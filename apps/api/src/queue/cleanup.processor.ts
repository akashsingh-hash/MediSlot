import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('outbox') private outboxQueue: Queue,
  ) {}

  /**
   * Run every 5 minutes to clean up expired HELD appointments
   * Appointments in HELD status for more than 15 minutes will be released
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredHolds() {
    this.logger.log('Starting cleanup of expired HELD appointments...');

    try {
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      // Find all HELD appointments that are older than 15 minutes
      const expiredHolds = await this.prisma.appointment.findMany({
        where: {
          status: 'HELD',
          createdAt: {
            lt: fifteenMinutesAgo,
          },
        },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (expiredHolds.length === 0) {
        this.logger.log('No expired HELD appointments found.');
        return;
      }

      this.logger.log(`Found ${expiredHolds.length} expired HELD appointments to clean up.`);

      // Delete expired HELD appointments
      for (const appointment of expiredHolds) {
        await this.prisma.$transaction(async (tx) => {
          // Delete the appointment
          await tx.appointment.delete({
            where: { id: appointment.id },
          });

          this.logger.log(
            `Released expired HELD slot: ${appointment.id} ` +
            `(Doctor: ${appointment.doctor.firstName} ${appointment.doctor.lastName}, ` +
            `Time: ${appointment.startTime.toISOString()}, ` +
            `Held for: ${Math.round((Date.now() - appointment.createdAt.getTime()) / 60000)} minutes)`
          );
        });
      }

      this.logger.log(`Successfully cleaned up ${expiredHolds.length} expired HELD appointments.`);
    } catch (error) {
      this.logger.error('Error during cleanup of expired HELD appointments:', error);
    }
  }

  /**
   * Run daily at midnight to clean up old failed outbox events
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldOutboxEvents() {
    this.logger.log('Starting cleanup of old outbox events...');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Delete completed or failed events older than 7 days
      const result = await this.prisma.outboxEvent.deleteMany({
        where: {
          status: {
            in: ['COMPLETED', 'FAILED'],
          },
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old outbox events.`);
    } catch (error) {
      this.logger.error('Error during cleanup of old outbox events:', error);
    }
  }

  /**
   * Run every hour to schedule appointment reminders
   * Schedule 24-hour and 1-hour reminders for upcoming appointments
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleAppointmentReminders() {
    this.logger.log('Checking for appointments that need reminders...');

    try {
      const now = new Date();
      
      // Find appointments in the next 24-25 hours that don't have 24h reminders yet
      const twentyFourHoursFromNow = new Date(now);
      twentyFourHoursFromNow.setHours(now.getHours() + 24);
      
      const twentyFiveHoursFromNow = new Date(now);
      twentyFiveHoursFromNow.setHours(now.getHours() + 25);

      const appointmentsFor24hReminder = await this.prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: twentyFourHoursFromNow,
            lte: twentyFiveHoursFromNow,
          },
        },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
        },
      });

      // Schedule 24-hour reminders
      for (const appointment of appointmentsFor24hReminder) {
        // Check if reminder already exists
        const existingReminder = await this.prisma.outboxEvent.findFirst({
          where: {
            type: 'EMAIL_APPOINTMENT_REMINDER',
            AND: [
              {
                payload: {
                  path: ['appointmentId'],
                  equals: appointment.id,
                },
              },
              {
                payload: {
                  path: ['reminderType'],
                  equals: '24_HOUR',
                },
              },
            ],
          },
        });

        if (!existingReminder) {
          await this.schedule24HourReminder(appointment);
        }
      }

      // Find appointments in the next 1-2 hours that need 1-hour reminders
      const oneHourFromNow = new Date(now);
      oneHourFromNow.setHours(now.getHours() + 1);
      
      const twoHoursFromNow = new Date(now);
      twoHoursFromNow.setHours(now.getHours() + 2);

      const appointmentsFor1hReminder = await this.prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: oneHourFromNow,
            lte: twoHoursFromNow,
          },
        },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
        },
      });

      // Schedule 1-hour reminders
      for (const appointment of appointmentsFor1hReminder) {
        // Check if reminder already exists
        const existingReminder = await this.prisma.outboxEvent.findFirst({
          where: {
            type: 'EMAIL_APPOINTMENT_REMINDER',
            AND: [
              {
                payload: {
                  path: ['appointmentId'],
                  equals: appointment.id,
                },
              },
              {
                payload: {
                  path: ['reminderType'],
                  equals: '1_HOUR',
                },
              },
            ],
          },
        });

        if (!existingReminder) {
          await this.schedule1HourReminder(appointment);
        }
      }

      this.logger.log(
        `Scheduled ${appointmentsFor24hReminder.length} 24-hour reminders and ${appointmentsFor1hReminder.length} 1-hour reminders`
      );
    } catch (error) {
      this.logger.error('Error scheduling appointment reminders:', error);
    }
  }

  /**
   * Schedule 24-hour reminder for an appointment
   */
  private async schedule24HourReminder(appointment: any) {
    const reminderTime = new Date(appointment.startTime);
    reminderTime.setHours(reminderTime.getHours() - 24);

    const appointmentTime = appointment.startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const outboxEvent = await this.prisma.outboxEvent.create({
      data: {
        type: 'EMAIL_APPOINTMENT_REMINDER',
        payload: {
          appointmentId: appointment.id,
          reminderType: '24_HOUR',
          email: appointment.patient.user.email,
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          appointmentDate: appointment.startTime.toISOString(),
          appointmentTime,
        },
        status: 'PENDING',
      },
    });

    // Schedule job
    const delay = Math.max(0, reminderTime.getTime() - Date.now());
    await this.outboxQueue.add(
      'process-outbox',
      {
        eventId: outboxEvent.id,
        type: 'EMAIL_APPOINTMENT_REMINDER',
        payload: outboxEvent.payload,
      },
      {
        delay,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    this.logger.log(
      `Scheduled 24-hour reminder for appointment ${appointment.id} (${appointment.patient.firstName} with Dr. ${appointment.doctor.lastName})`
    );
  }

  /**
   * Schedule 1-hour reminder for an appointment
   */
  private async schedule1HourReminder(appointment: any) {
    const reminderTime = new Date(appointment.startTime);
    reminderTime.setHours(reminderTime.getHours() - 1);

    const appointmentTime = appointment.startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const outboxEvent = await this.prisma.outboxEvent.create({
      data: {
        type: 'EMAIL_APPOINTMENT_REMINDER',
        payload: {
          appointmentId: appointment.id,
          reminderType: '1_HOUR',
          email: appointment.patient.user.email,
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          appointmentDate: appointment.startTime.toISOString(),
          appointmentTime,
        },
        status: 'PENDING',
      },
    });

    // Schedule job
    const delay = Math.max(0, reminderTime.getTime() - Date.now());
    await this.outboxQueue.add(
      'process-outbox',
      {
        eventId: outboxEvent.id,
        type: 'EMAIL_APPOINTMENT_REMINDER',
        payload: outboxEvent.payload,
      },
      {
        delay,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    this.logger.log(
      `Scheduled 1-hour reminder for appointment ${appointment.id} (${appointment.patient.firstName} with Dr. ${appointment.doctor.lastName})`
    );
  }
}
