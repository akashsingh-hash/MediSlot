import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('outbox') private outboxQueue: Queue,
  ) {}

  async createHold(data: { doctorId: string; patientId: string; startTime: string; endTime: string; symptoms?: string }) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }

    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: data.patientId }
    });

    if (!patientProfile) {
      throw new BadRequestException('Patient profile not found for this user');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.create({
          data: {
            doctorId: data.doctorId,
            patientId: patientProfile.id,
            startTime,
            endTime,
            status: 'HELD',
          },
        });

        if (data.symptoms) {
          // Store symptoms and trigger background LLM job
          await tx.symptomSubmission.create({
            data: {
              appointmentId: appt.id,
              rawSymptoms: data.symptoms,
            }
          });

          await tx.preVisitSummary.create({
            data: {
              appointmentId: appt.id,
              chiefComplaint: data.symptoms, // Initial dump before LLM formatting
              urgencyLevel: 'MEDIUM',
              questions: [],
              status: 'PENDING',
            }
          });

          await tx.outboxEvent.create({
            data: {
              type: 'LLM_PRE_VISIT',
              payload: { appointmentId: appt.id, symptoms: data.symptoms }
            }
          });
        }

        // Create calendar sync event
        await tx.outboxEvent.create({
          data: {
            type: 'CALENDAR_SYNC',
            payload: { appointmentId: appt.id }
          }
        });

        // Create email confirmation event
        await tx.outboxEvent.create({
          data: {
            type: 'EMAIL_BOOKING_CONFIRMATION',
            payload: { appointmentId: appt.id }
          }
        });
        
        return appt;
      });

      // AFTER transaction commits, enqueue jobs
      const events = await this.prisma.outboxEvent.findMany({
        where: {
          payload: {
            path: ['appointmentId'],
            equals: result.id
          },
          status: 'PENDING'
        }
      });

      for (const event of events) {
        await this.outboxQueue.add('process-outbox', {
          eventId: event.id,
          type: event.type,
          payload: event.payload
        });
      }

      return result;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('This slot is already booked for this doctor.');
      }
      throw error;
    }
  }

  async getAppointments(userId: string, role: string) {
    if (role === 'PATIENT') {
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { userId }
      });
      if (!patientProfile) return [];
      
      return this.prisma.appointment.findMany({
        where: { patientId: patientProfile.id },
        include: {
          doctor: { include: { user: true } },
          preVisit: true,
          symptoms: true,
        },
        orderBy: { startTime: 'asc' }
      });
    } else if (role === 'DOCTOR') {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId }
      });
      if (!doctorProfile) return [];

      return this.prisma.appointment.findMany({
        where: { doctorId: doctorProfile.id },
        include: {
          patient: { include: { user: true } },
          preVisit: true,
          symptoms: true,
        },
        orderBy: { startTime: 'asc' }
      });
    }
    
    return [];
  }

  async confirmAppointment(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    if (appointment.patient.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' }
    });
  }

  async cancelAppointment(appointmentId: string, userId: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        patient: { include: { user: true } }, 
        doctor: { include: { user: true } }
      }
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    // Check authorization
    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;

    if (!isPatient && !isDoctor) {
      throw new BadRequestException('Unauthorized');
    }

    // Cannot cancel already cancelled or completed appointments
    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Appointment is already cancelled');
    }
    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    const cancellationReason = reason || 'Cancelled by user';

    await this.prisma.$transaction(async (tx) => {
      // Update appointment status
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' }
      });

      // Create calendar delete event
      const calendarEvent = await tx.outboxEvent.create({
        data: {
          type: 'CALENDAR_DELETE',
          payload: { appointmentId }
        }
      });

      // Enqueue calendar delete job
      await this.outboxQueue.add('process-outbox', {
        eventId: calendarEvent.id,
        type: 'CALENDAR_DELETE',
        payload: { appointmentId }
      });

      // Create email cancellation event for both patient and doctor
      const emailEvent = await tx.outboxEvent.create({
        data: {
          type: 'EMAIL_CANCELLATION',
          payload: { 
            appointmentId, 
            reason: cancellationReason,
            cancelledBy: isPatient ? 'patient' : 'doctor'
          }
        }
      });

      // Enqueue email job
      await this.outboxQueue.add('process-outbox', {
        eventId: emailEvent.id,
        type: 'EMAIL_CANCELLATION',
        payload: { 
          appointmentId, 
          reason: cancellationReason,
          cancelledBy: isPatient ? 'patient' : 'doctor'
        }
      });
    });

    return { 
      message: 'Appointment cancelled successfully',
      appointment: {
        id: appointment.id,
        status: 'CANCELLED',
        startTime: appointment.startTime,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
      }
    };
  }

  async rescheduleAppointment(
    appointmentId: string, 
    userId: string, 
    newStartTime: string, 
    newEndTime: string
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        patient: { include: { user: true } }, 
        doctor: { include: { user: true } },
        symptoms: true,
        preVisit: true
      }
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    // Check authorization - only patient or doctor can reschedule
    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;

    if (!isPatient && !isDoctor) {
      throw new BadRequestException('Unauthorized');
    }

    // Cannot reschedule cancelled or completed appointments
    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Cannot reschedule cancelled appointments');
    }
    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot reschedule completed appointments');
    }

    const parsedStartTime = new Date(newStartTime);
    const parsedEndTime = new Date(newEndTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }

    // Verify new slot is available (check for conflicts with other appointments)
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        startTime: parsedStartTime,
        id: { not: appointmentId }, // Exclude current appointment
        status: { notIn: ['CANCELLED'] }
      }
    });

    if (conflict) {
      throw new ConflictException('The new time slot is not available');
    }

    const updatedAppointment = await this.prisma.$transaction(async (tx) => {
      // Update appointment with new times and set status to RESCHEDULE_REQUIRED
      // This allows for confirmation flow
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startTime: parsedStartTime,
          endTime: parsedEndTime,
          status: isPatient ? 'HELD' : appointment.status // Patient reschedule needs re-confirmation
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        }
      });

      // Delete old calendar events
      const deleteCalendarEvent = await tx.outboxEvent.create({
        data: {
          type: 'CALENDAR_DELETE',
          payload: { appointmentId }
        }
      });

      await this.outboxQueue.add('process-outbox', {
        eventId: deleteCalendarEvent.id,
        type: 'CALENDAR_DELETE',
        payload: { appointmentId }
      });

      // Create new calendar events
      const createCalendarEvent = await tx.outboxEvent.create({
        data: {
          type: 'CALENDAR_SYNC',
          payload: { appointmentId }
        }
      });

      await this.outboxQueue.add('process-outbox', {
        eventId: createCalendarEvent.id,
        type: 'CALENDAR_SYNC',
        payload: { appointmentId }
      });

      // Send reschedule notification email
      const emailEvent = await tx.outboxEvent.create({
        data: {
          type: 'EMAIL_RESCHEDULE',
          payload: { 
            appointmentId,
            oldStartTime: appointment.startTime.toISOString(),
            newStartTime: newStartTime,
            rescheduledBy: isPatient ? 'patient' : 'doctor'
          }
        }
      });

      await this.outboxQueue.add('process-outbox', {
        eventId: emailEvent.id,
        type: 'EMAIL_RESCHEDULE',
        payload: { 
          appointmentId,
          oldStartTime: appointment.startTime.toISOString(),
          newStartTime: newStartTime,
          rescheduledBy: isPatient ? 'patient' : 'doctor'
        }
      });

      return updated;
    });

    return {
      message: 'Appointment rescheduled successfully',
      appointment: updatedAppointment
    };
  }
}
