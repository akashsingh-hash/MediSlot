import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { CalendarService } from '../calendar/calendar.service';
import { EmailService } from '../email/email.service';

@Processor('outbox')
export class OutboxProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
    private calendarService: CalendarService,
    private emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { eventId, type, payload } = job.data;
    this.logger.log(`Processing outbox event: ${eventId} | Type: ${type}`);
    
    // Check if event exists and get current status
    const event = await this.prisma.outboxEvent.findUnique({ where: { id: eventId } });
    
    if (!event) {
      this.logger.warn(`Event ${eventId} not found in database`);
      return;
    }
    
    if (event.status === 'COMPLETED') {
      this.logger.log(`Event ${eventId} already completed`);
      return;
    }
    
    if (event.status === 'PROCESSING') {
      this.logger.log(`Event ${eventId} already being processed by another worker`);
      return;
    }

    try {
      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'PROCESSING' }
      });

      // Handle based on type
      if (type === 'LLM_PRE_VISIT') {
        this.logger.log(`Starting LLM pre-visit analysis for appointment: ${payload.appointmentId}`);
        const result = await this.llmService.getProvider().generatePreVisitSummary(payload.symptoms);
        this.logger.log(`LLM analysis result: ${JSON.stringify(result)}`);
        
        await this.prisma.$transaction(async (tx: any) => {
          await tx.preVisitSummary.update({
            where: { appointmentId: payload.appointmentId },
            data: {
              urgencyLevel: result.urgencyLevel,
              chiefComplaint: result.chiefComplaint,
              questions: result.suggestedQuestions,
              status: 'COMPLETED'
            }
          });
          await tx.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
        });
        this.logger.log(`LLM pre-visit summary updated successfully`);
      } else if (type === 'CALENDAR_SYNC') {
        // Sync appointment to calendars
        await this.calendarService.syncAppointmentToCalendars(payload.appointmentId);
        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'CALENDAR_UPDATE') {
        // Update calendar events for both parties
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          include: { doctor: true, patient: true }
        });
        
        if (appointment) {
          await Promise.all([
            this.calendarService.updateAppointmentEvent(payload.appointmentId, appointment.doctor.userId).catch(() => {}),
            this.calendarService.updateAppointmentEvent(payload.appointmentId, appointment.patient.userId).catch(() => {}),
          ]);
        }
        
        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'CALENDAR_DELETE') {
        // Delete calendar events for both parties
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          include: { doctor: true, patient: true }
        });
        
        if (appointment) {
          await Promise.all([
            this.calendarService.deleteAppointmentEvent(payload.appointmentId, appointment.doctor.userId).catch(() => {}),
            this.calendarService.deleteAppointmentEvent(payload.appointmentId, appointment.patient.userId).catch(() => {}),
          ]);
        }
        
        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'EMAIL_BOOKING_CONFIRMATION') {
        // Send booking confirmation emails
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } }
          }
        });

        if (appointment) {
          const appointmentTime = appointment.startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          // Send to patient
          await this.emailService.sendBookingConfirmation(
            appointment.patient.user.email,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            appointment.startTime,
            appointmentTime,
          );

          // Send to doctor
          await this.emailService.sendBookingConfirmation(
            appointment.doctor.user.email,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            appointment.startTime,
            appointmentTime,
          );
        }

        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'EMAIL_APPOINTMENT_REMINDER') {
        // Send appointment reminder
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } }
          }
        });

        if (appointment) {
          const appointmentTime = appointment.startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          await this.emailService.sendAppointmentReminder(
            appointment.patient.user.email,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            appointment.startTime,
            appointmentTime,
          );
        }

        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'EMAIL_CANCELLATION') {
        // Send cancellation emails
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } }
          }
        });

        if (appointment) {
          const reason = payload.reason || 'User cancelled';

          await this.emailService.sendCancellationEmail(
            appointment.patient.user.email,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            appointment.startTime,
            reason,
          );

          await this.emailService.sendCancellationEmail(
            appointment.doctor.user.email,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            appointment.startTime,
            reason,
          );
        }

        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'EMAIL_RESCHEDULE') {
        // Send reschedule notification emails
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } }
          }
        });

        if (appointment) {
          const oldDate = new Date(payload.oldStartTime);
          const newDate = new Date(payload.newStartTime);
          const rescheduledBy = payload.rescheduledBy || 'user';

          // Send to patient
          await this.emailService.sendRescheduleEmail(
            appointment.patient.user.email,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            oldDate,
            newDate,
            rescheduledBy
          );

          // Send to doctor
          await this.emailService.sendRescheduleEmail(
            appointment.doctor.user.email,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            oldDate,
            newDate,
            rescheduledBy
          );
        }

        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'EMAIL_LEAVE_CONFLICT') {
        // Send leave conflict notification
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } }
          }
        });

        if (appointment) {
          await this.emailService.sendLeaveConflictEmail(
            appointment.patient.user.email,
            `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            appointment.startTime,
          );
        }

        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      } else if (type === 'EMAIL_MEDICATION_REMINDER') {
        // Send medication reminder
        const reminder = await this.prisma.medicationReminder.findUnique({
          where: { id: payload.medicationId },
        });

        if (reminder && reminder.status === 'PENDING') {
          await this.emailService.sendMedicationReminder(
            payload.email,
            payload.patientName,
            payload.medicationName,
            payload.dose,
            payload.time,
          );

          // Mark reminder as sent
          await this.prisma.medicationReminder.update({
            where: { id: payload.medicationId },
            data: { status: 'COMPLETED' },
          });
        }

        await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'COMPLETED' }});
      }

    } catch (error) {
      this.logger.error(`Failed to process event ${eventId}`, error);
      await this.prisma.outboxEvent.update({ where: { id: eventId }, data: { status: 'FAILED' }});
      throw error;
    }
  }
}
