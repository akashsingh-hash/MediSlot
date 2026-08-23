import { Injectable, NotFoundException, BadRequestException, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@medislot/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('outbox') private outboxQueue: Queue,
  ) {}

  async findAll(specialisation?: string) {
    const where: Prisma.DoctorProfileWhereInput = {};
    if (specialisation) {
      where.specialisation = { contains: specialisation, mode: 'insensitive' };
    }
    return this.prisma.doctorProfile.findMany({
      where,
      include: {
        user: {
          select: { 
            id: true,
            email: true 
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true }
        }
      }
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async getSlots(doctorId: string, dateString: string) {
    if (!dateString) {
      throw new BadRequestException('Date query parameter is required (YYYY-MM-DD)');
    }
    
    // Parse date consistently in UTC to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const doctor = await this.findOne(doctorId);

    // Check if doctor is on leave
    const leave = await this.prisma.doctorLeave.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date
        }
      }
    });

    if (leave) {
      return []; // No slots available if on leave
    }

    const dayOfWeek = date.getUTCDay(); 
    if (!doctor.workingDays.includes(dayOfWeek)) {
      return [];
    }

    const hours = doctor.workingHours as { start?: string, end?: string };
    if (!hours || !hours.start || !hours.end) {
      return [];
    }

    const slots = [];
    const [startHour, startMin] = hours.start.split(':').map(Number);
    const [endHour, endMin] = hours.end.split(':').map(Number);

    // Create times in UTC to maintain consistency
    const startTime = new Date(date);
    startTime.setUTCHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setUTCHours(endHour, endMin, 0, 0);

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23,59,59,999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      }
    });

    let currentSlot = new Date(startTime);
    const slotDuration = doctor.slotDuration; // in minutes

    while (currentSlot < endTime) {
      const nextSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
      if (nextSlot > endTime) break;

      const isBooked = appointments.some((app: any) => {
        return (currentSlot >= app.startTime && currentSlot < app.endTime) ||
               (nextSlot > app.startTime && nextSlot <= app.endTime) ||
               (currentSlot <= app.startTime && nextSlot >= app.endTime);
      });

      if (!isBooked) {
        slots.push({
          startTime: new Date(currentSlot),
          endTime: new Date(nextSlot)
        });
      }
      currentSlot = nextSlot;
    }

    return slots;
  }

  async getPatients(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: { patient: { include: { user: true } }, visit: true },
      distinct: ['patientId'],
      orderBy: { startTime: 'desc' }
    });
    
    return appointments.map((a: any) => ({
      id: a.patient.id,
      name: a.patient.user.name || `${a.patient.firstName} ${a.patient.lastName}`,
      lastVisit: a.startTime,
      carePlan: a.visit ? 'Follow-up' : 'Routine monitoring'
    }));
  }

  async getLeaves(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) return [];
    
    return this.prisma.doctorLeave.findMany({
      where: { doctorId: doctor.id, date: { gte: new Date() } },
      orderBy: { date: 'asc' }
    });
  }

  async addLeave(userId: string, dateString: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const date = new Date(dateString);
    date.setHours(0,0,0,0);

    // Find existing appointments on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23,59,59,999);

    const affectedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['HELD', 'CONFIRMED']
        }
      }
    });

    // Create leave and handle conflicts in transaction
    return await this.prisma.$transaction(async (tx) => {
      const leave = await tx.doctorLeave.upsert({
        where: { doctorId_date: { doctorId: doctor.id, date } },
        update: {},
        create: { doctorId: doctor.id, date }
      });

      // Update affected appointments to RESCHEDULE_REQUIRED
      if (affectedAppointments.length > 0) {
        await tx.appointment.updateMany({
          where: {
            id: { in: affectedAppointments.map(a => a.id) }
          },
          data: {
            status: 'RESCHEDULE_REQUIRED'
          }
        });

        // Create email and calendar events for each affected appointment
        for (const appointment of affectedAppointments) {
          // Email notification
          const emailEvent = await tx.outboxEvent.create({
            data: {
              type: 'EMAIL_LEAVE_CONFLICT',
              payload: { appointmentId: appointment.id }
            }
          });

          await this.outboxQueue.add('process-outbox', {
            eventId: emailEvent.id,
            type: 'EMAIL_LEAVE_CONFLICT',
            payload: { appointmentId: appointment.id }
          });

          // Calendar deletion
          const calendarEvent = await tx.outboxEvent.create({
            data: {
              type: 'CALENDAR_DELETE',
              payload: { appointmentId: appointment.id }
            }
          });

          await this.outboxQueue.add('process-outbox', {
            eventId: calendarEvent.id,
            type: 'CALENDAR_DELETE',
            payload: { appointmentId: appointment.id }
          });
        }
      }

      return leave;
    });
  }
}
