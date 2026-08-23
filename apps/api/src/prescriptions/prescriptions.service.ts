import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LlmService } from '../llm/llm.service';
import { CalendarService } from '../calendar/calendar.service';

interface MedicationDto {
  name: string;
  dose: string;
  frequency: string; // ONCE_DAILY, TWICE_DAILY, THREE_TIMES_DAILY, EVERY_X_HOURS
  duration: string; // e.g., "7 days", "2 weeks", "1 month"
  instructions?: string;
}

interface CreatePrescriptionDto {
  appointmentId: string;
  clinicalNotes: string;
  followUpSteps: string[];
  medications: MedicationDto[];
}

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('outbox') private outboxQueue: Queue,
    private llmService: LlmService,
    private calendarService: CalendarService,
  ) {}

  /**
   * Create a prescription with medications after a visit
   * This is called by the doctor after completing an appointment
   */
  async createPrescription(userId: string, dto: CreatePrescriptionDto) {
    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        doctor: true,
        patient: { include: { user: true } },
        visit: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify doctor owns this appointment
    if (appointment.doctor.userId !== userId) {
      throw new ForbiddenException('You can only prescribe for your own appointments');
    }

    // Verify appointment is confirmed, held, or completed
    if (!['CONFIRMED', 'COMPLETED', 'HELD'].includes(appointment.status)) {
      throw new BadRequestException('Can only prescribe for confirmed, held, or completed appointments');
    }

    // Create visit, prescription, and medications in a transaction
    // Increased timeout to 30 seconds to handle medication reminder scheduling
    const result = await this.prisma.$transaction(async (tx) => {
      // Create or update visit
      let visit;
      if (appointment.visit) {
        visit = await tx.visit.update({
          where: { id: appointment.visit.id },
          data: {
            clinicalNotes: dto.clinicalNotes,
            followUpSteps: dto.followUpSteps,
          },
        });
      } else {
        visit = await tx.visit.create({
          data: {
            appointmentId: dto.appointmentId,
            clinicalNotes: dto.clinicalNotes,
            followUpSteps: dto.followUpSteps,
          },
        });
      }

      // Create prescription
      const prescription = await tx.prescription.create({
        data: {
          visitId: visit.id,
          medications: {
            create: dto.medications.map((med) => ({
              name: med.name,
              dose: med.dose,
              frequency: med.frequency,
              duration: med.duration,
            })),
          },
        },
        include: {
          medications: true,
        },
      });

      // Mark appointment as completed
      await tx.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: 'COMPLETED' },
      });

      // Schedule medication reminders for each medication
      for (const medication of prescription.medications) {
        await this.scheduleMedicationReminders(
          tx,
          medication.id,
          medication.frequency,
          medication.duration,
          appointment.patient.user.email,
          `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          medication.name,
          medication.dose,
        );
      }

      return { visit, prescription };
    }, {
      maxWait: 10000, // Maximum time to wait to start transaction (10 seconds)
      timeout: 30000, // Maximum time for transaction to complete (30 seconds)
    });

    // After transaction completes successfully, sync medication reminders to patient's calendar
    try {
      await this.calendarService.syncMedicationReminders(appointment.patient.userId);
      this.logger.log(`Medication reminders synced to calendar for patient ${appointment.patient.userId}`);
    } catch (error: any) {
      this.logger.error(`Failed to sync medication reminders to calendar: ${error.message}`);
      // Don't fail the prescription creation if calendar sync fails
    }

    return result.prescription;
  }

  /**
   * Schedule medication reminders based on frequency
   */
  private async scheduleMedicationReminders(
    tx: any,
    medicationId: string,
    frequency: string,
    duration: string,
    patientEmail: string,
    patientName: string,
    medicationName: string,
    dose: string,
  ) {
    const now = new Date();
    const reminders: Date[] = [];

    // Calculate reminder times based on frequency
    const durationDays = this.parseDuration(duration);
    const dailyTimes = this.getFrequencyTimes(frequency);

    // Generate reminder schedule for the duration
    for (let day = 0; day < durationDays; day++) {
      for (const time of dailyTimes) {
        const reminderTime = new Date(now);
        reminderTime.setDate(now.getDate() + day);
        reminderTime.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);

        // Only schedule future reminders
        if (reminderTime > now) {
          reminders.push(new Date(reminderTime));
        }
      }
    }

    // Create reminder records
    for (const reminderTime of reminders) {
      await tx.medicationReminder.create({
        data: {
          medicationId,
          reminderTime,
          status: 'PENDING',
        },
      });

      // Create outbox event for email reminder
      const outboxEvent = await tx.outboxEvent.create({
        data: {
          type: 'EMAIL_MEDICATION_REMINDER',
          payload: {
            medicationId,
            reminderTime: reminderTime.toISOString(),
            email: patientEmail,
            patientName,
            medicationName,
            dose,
            time: reminderTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          },
          status: 'PENDING',
        },
      });

      // Schedule job to run at reminder time
      await this.outboxQueue.add(
        'process-outbox',
        {
          eventId: outboxEvent.id,
          type: 'EMAIL_MEDICATION_REMINDER',
          payload: outboxEvent.payload,
        },
        {
          delay: Math.max(0, reminderTime.getTime() - Date.now()), // Delay until reminder time
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }
  }

  /**
   * Parse duration string to days
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)\s*(day|days|week|weeks|month|months)/i);
    if (!match) {
      return 7; // Default to 7 days
    }

    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (true) {
      case unit.startsWith('day'):
        return amount;
      case unit.startsWith('week'):
        return amount * 7;
      case unit.startsWith('month'):
        return amount * 30;
      default:
        return 7;
    }
  }

  /**
   * Get reminder times based on frequency
   */
  private getFrequencyTimes(frequency: string): string[] {
    switch (frequency.toUpperCase()) {
      case 'ONCE_DAILY':
        return ['08:00']; // 8 AM
      case 'TWICE_DAILY':
        return ['08:00', '20:00']; // 8 AM and 8 PM
      case 'THREE_TIMES_DAILY':
        return ['08:00', '14:00', '20:00']; // 8 AM, 2 PM, 8 PM
      case 'EVERY_6_HOURS':
        return ['08:00', '14:00', '20:00', '02:00']; // Every 6 hours
      case 'EVERY_4_HOURS':
        return ['08:00', '12:00', '16:00', '20:00', '00:00', '04:00']; // Every 4 hours
      default:
        return ['08:00']; // Default to once daily
    }
  }

  /**
   * Get prescription by ID
   */
  async getPrescription(prescriptionId: string, userId: string, role: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        visit: {
          include: {
            appointment: {
              include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } },
              },
            },
          },
        },
        medications: {
          include: {
            reminders: {
              orderBy: { reminderTime: 'asc' },
            },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Authorization check
    const appointment = prescription.visit.appointment;
    if (role === 'DOCTOR' && appointment.doctor.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === 'PATIENT' && appointment.patient.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return prescription;
  }

  /**
   * Get all prescriptions for a patient
   */
  async getPatientPrescriptions(userId: string) {
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patientProfile) {
      return [];
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        visit: {
          appointment: {
            patientId: patientProfile.id,
          },
        },
      },
      include: {
        visit: {
          include: {
            appointment: {
              include: {
                doctor: true,
              },
            },
          },
        },
        medications: {
          include: {
            reminders: {
              where: {
                reminderTime: {
                  gte: new Date(), // Only future reminders
                },
              },
              orderBy: { reminderTime: 'asc' },
              take: 1, // Next reminder only
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prescriptions;
  }

  /**
   * Mark a medication reminder as taken/completed
   */
  async markReminderTaken(reminderId: string, userId: string) {
    const reminder = await this.prisma.medicationReminder.findUnique({
      where: { id: reminderId },
      include: {
        medication: {
          include: {
            prescription: {
              include: {
                visit: {
                  include: {
                    appointment: {
                      include: {
                        patient: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Verify patient owns this reminder
    if (reminder.medication.prescription.visit.appointment.patient.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.medicationReminder.update({
      where: { id: reminderId },
      data: { status: 'COMPLETED' },
    });
  }

  /**
   * Get upcoming medication reminders for a patient
   */
  async getUpcomingReminders(userId: string) {
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patientProfile) {
      return [];
    }

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const reminders = await this.prisma.medicationReminder.findMany({
      where: {
        medication: {
          prescription: {
            visit: {
              appointment: {
                patientId: patientProfile.id,
              },
            },
          },
        },
        reminderTime: {
          gte: now,
          lte: endOfDay,
        },
        status: 'PENDING',
      },
      include: {
        medication: {
          include: {
            prescription: {
              include: {
                visit: {
                  include: {
                    appointment: {
                      include: {
                        doctor: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        reminderTime: 'asc',
      },
    });

    return reminders;
  }

  /**
   * Generate post-visit summary using LLM
   */
  async generatePostVisitSummary(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        prescriptions: {
          include: {
            medications: true,
          },
        },
        postVisit: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    // Check if summary already exists
    if (visit.postVisit) {
      return visit.postVisit;
    }

    // Prepare prescription details for LLM
    const prescriptionDetails = visit.prescriptions.flatMap((p) =>
      p.medications.map((m) => ({
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
      })),
    );

    // Generate summary using LLM
    const llmResult = await this.llmService.getProvider().generatePostVisitSummary(
      visit.clinicalNotes,
      prescriptionDetails,
    );

    // Create post-visit summary record
    const summary = await this.prisma.postVisitSummary.create({
      data: {
        visitId: visit.id,
        summaryText: llmResult.summary,
        safetyNote: llmResult.safetyNote || 'Please follow your doctor\'s instructions carefully.',
        status: 'COMPLETED',
      },
    });

    return summary;
  }

  /**
   * Get post-visit summary
   */
  async getPostVisitSummary(visitId: string, userId: string, role: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        postVisit: true,
        appointment: {
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } },
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    // Authorization check
    const appointment = visit.appointment;
    if (role === 'DOCTOR' && appointment.doctor.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === 'PATIENT' && appointment.patient.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!visit.postVisit) {
      throw new NotFoundException('Post-visit summary not yet generated');
    }

    return visit.postVisit;
  }
}
