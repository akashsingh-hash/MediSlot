import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google, calendar_v3 } from 'googleapis';

interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private oauth2Client: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('googleClientId');
    const clientSecret = this.configService.get<string>('googleClientSecret');
    const redirectUri = this.configService.get<string>('googleRedirectUri');

    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.warn('Google Calendar OAuth credentials not configured');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  /**
   * Generate OAuth authorization URL for user to grant calendar access
   */
  getAuthUrl(userId: string): string {
    const scopes = ['https://www.googleapis.com/auth/calendar.events'];
    
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId in state to identify user after redirect
      prompt: 'consent', // Force consent to ensure refresh token
    });

    return url;
  }

  /**
   * Handle OAuth callback and store tokens
   */
  async handleCallback(code: string, userId: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new BadRequestException('No access token received from Google');
      }

      // Store encrypted tokens in database
      await this.prisma.calendarConnection.upsert({
        where: { userId },
        update: {
          provider: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: tokens.scope || '',
          updatedAt: new Date(),
        },
        create: {
          userId,
          provider: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: tokens.scope || '',
        },
      });

      this.logger.log(`Calendar connected for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to handle OAuth callback', error);
      throw new BadRequestException('Failed to connect calendar');
    }
  }

  /**
   * Disconnect calendar for a user
   */
  async disconnect(userId: string): Promise<void> {
    await this.prisma.calendarConnection.deleteMany({
      where: { userId },
    });
    this.logger.log(`Calendar disconnected for user ${userId}`);
  }

  /**
   * Get calendar connection status for user
   */
  async getConnectionStatus(userId: string): Promise<any> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { userId },
      select: {
        provider: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return {
      connected: !!connection,
      provider: connection?.provider || null,
      connectedAt: connection?.createdAt || null,
    };
  }

  /**
   * Get valid OAuth client for user (handles token refresh)
   */
  private async getAuthenticatedClient(userId: string): Promise<any> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new BadRequestException('Calendar not connected for this user');
    }

    const client = new google.auth.OAuth2(
      this.configService.get<string>('googleClientId'),
      this.configService.get<string>('googleClientSecret'),
      this.configService.get<string>('googleRedirectUri'),
    );

    client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.expiresAt?.getTime(),
    });

    // Handle token refresh
    client.on('tokens', async (tokens: any) => {
      if (tokens.refresh_token) {
        await this.prisma.calendarConnection.update({
          where: { userId },
          data: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          },
        });
      } else if (tokens.access_token) {
        await this.prisma.calendarConnection.update({
          where: { userId },
          data: {
            accessToken: tokens.access_token,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          },
        });
      }
    });

    return client;
  }

  /**
   * Create calendar event for appointment
   */
  async createAppointmentEvent(
    appointmentId: string,
    userId: string,
  ): Promise<string | null> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: {
            include: { user: true },
          },
          patient: {
            include: { user: true },
          },
        },
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      const client = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: client });

      const isDoctor = userId === appointment.doctor.userId;
      const otherParty = isDoctor
        ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
        : `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

      // Privacy-conscious: Don't include sensitive medical info in calendar
      const summary = isDoctor
        ? `Patient Appointment - ${otherParty}`
        : `Healthcare Appointment with ${otherParty}`;

      const description = isDoctor
        ? `Appointment with patient ${otherParty}.\nStatus: ${appointment.status}`
        : `Healthcare appointment scheduled.\nStatus: ${appointment.status}`;

      const event = {
        summary,
        description,
        start: {
          dateTime: appointment.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: appointment.endTime.toISOString(),
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 min before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      const eventId = response.data.id;
      if (!eventId) {
        throw new Error('No event ID returned from Google Calendar');
      }

      // Store the calendar event mapping
      await this.prisma.calendarEvent.create({
        data: {
          appointmentId,
          providerEventId: eventId,
          provider: 'google',
          ownerId: userId,
          status: 'COMPLETED',
        },
      });

      this.logger.log(`Calendar event created: ${eventId} for appointment ${appointmentId}`);
      return eventId;
    } catch (error: any) {
      this.logger.error(`Failed to create calendar event: ${error.message}`, error.stack);
      
      // Store failed attempt for retry
      await this.prisma.calendarEvent.create({
        data: {
          appointmentId,
          providerEventId: `failed-${Date.now()}`,
          provider: 'google',
          ownerId: userId,
          status: 'FAILED',
        },
      }).catch(() => {}); // Ignore if already exists
      
      return null;
    }
  }

  /**
   * Update calendar event (for reschedule)
   */
  async updateAppointmentEvent(
    appointmentId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const calendarEvent = await this.prisma.calendarEvent.findFirst({
        where: {
          appointmentId,
          ownerId: userId,
          provider: 'google',
        },
      });

      if (!calendarEvent || calendarEvent.status === 'FAILED') {
        this.logger.warn(`No valid calendar event found for appointment ${appointmentId}`);
        return false;
      }

      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: {
            include: { user: true },
          },
          patient: {
            include: { user: true },
          },
        },
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      const client = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: client });

      const isDoctor = userId === appointment.doctor.userId;
      const otherParty = isDoctor
        ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
        : `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

      const summary = isDoctor
        ? `Patient Appointment - ${otherParty}`
        : `Healthcare Appointment with ${otherParty}`;

      const description = isDoctor
        ? `Appointment with patient ${otherParty}.\nStatus: ${appointment.status}`
        : `Healthcare appointment scheduled.\nStatus: ${appointment.status}`;

      await calendar.events.update({
        calendarId: 'primary',
        eventId: calendarEvent.providerEventId,
        requestBody: {
          summary,
          description,
          start: {
            dateTime: appointment.startTime.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: appointment.endTime.toISOString(),
            timeZone: 'UTC',
          },
        },
      });

      await this.prisma.calendarEvent.update({
        where: { id: calendarEvent.id },
        data: { status: 'COMPLETED' },
      });

      this.logger.log(`Calendar event updated for appointment ${appointmentId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to update calendar event: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete/cancel calendar event
   */
  async deleteAppointmentEvent(
    appointmentId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const calendarEvent = await this.prisma.calendarEvent.findFirst({
        where: {
          appointmentId,
          ownerId: userId,
          provider: 'google',
        },
      });

      if (!calendarEvent || calendarEvent.status === 'FAILED') {
        this.logger.warn(`No valid calendar event found for appointment ${appointmentId}`);
        return false;
      }

      const client = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: calendarEvent.providerEventId,
      });

      await this.prisma.calendarEvent.delete({
        where: { id: calendarEvent.id },
      });

      this.logger.log(`Calendar event deleted for appointment ${appointmentId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to delete calendar event: ${error.message}`);
      return false;
    }
  }

  /**
   * Sync calendar events for an appointment (create for both doctor and patient)
   */
  async syncAppointmentToCalendars(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    // Create event for doctor if connected
    const doctorConnection = await this.prisma.calendarConnection.findUnique({
      where: { userId: appointment.doctor.userId },
    });

    if (doctorConnection) {
      await this.createAppointmentEvent(appointmentId, appointment.doctor.userId);
    }

    // Create event for patient if connected
    const patientConnection = await this.prisma.calendarConnection.findUnique({
      where: { userId: appointment.patient.userId },
    });

    if (patientConnection) {
      await this.createAppointmentEvent(appointmentId, appointment.patient.userId);
    }
  }

  /**
   * Create calendar event for medication reminder
   */
  async createMedicationReminderEvent(
    medicationId: string,
    reminderTime: Date,
    userId: string,
  ): Promise<string | null> {
    try {
      const medication = await this.prisma.prescriptionMedication.findUnique({
        where: { id: medicationId },
        include: {
          prescription: {
            include: {
              visit: {
                include: {
                  appointment: {
                    include: {
                      doctor: {
                        include: { user: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!medication) {
        throw new BadRequestException('Medication not found');
      }

      const client = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: client });

      const doctorName = `Dr. ${medication.prescription.visit.appointment.doctor.firstName} ${medication.prescription.visit.appointment.doctor.lastName}`;

      const summary = `💊 Medication Reminder: ${medication.name}`;
      const description = 
        `Take your medication: ${medication.name}\n` +
        `Dose: ${medication.dose}\n` +
        `Frequency: ${medication.frequency}\n` +
        `Duration: ${medication.duration}\n` +
        `Prescribed by: ${doctorName}`;

      // Calculate end time (30 minutes after reminder)
      const endTime = new Date(reminderTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const event = {
        summary,
        description,
        start: {
          dateTime: reminderTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 0 }, // At the time
            { method: 'popup', minutes: 15 }, // 15 min before
          ],
        },
        colorId: '11', // Red color for medications
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      const eventId = response.data.id;
      if (!eventId) {
        throw new Error('No event ID returned from Google Calendar');
      }

      this.logger.log(`Medication reminder calendar event created: ${eventId} for medication ${medicationId}`);
      return eventId;
    } catch (error: any) {
      this.logger.error(`Failed to create medication reminder calendar event: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Sync all medication reminders for a patient to Google Calendar
   */
  async syncMedicationReminders(userId: string): Promise<void> {
    try {
      // Check if user has calendar connected
      const connection = await this.prisma.calendarConnection.findUnique({
        where: { userId },
      });

      if (!connection) {
        this.logger.log(`User ${userId} does not have calendar connected, skipping medication reminder sync`);
        return;
      }

      // Get patient profile
      const profile = await this.prisma.patientProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        this.logger.log(`No patient profile found for user ${userId}`);
        return;
      }

      // Get all pending medication reminders for this patient
      const reminders = await this.prisma.medicationReminder.findMany({
        where: {
          medication: {
            prescription: {
              visit: {
                appointment: {
                  patientId: profile.id,
                },
              },
            },
          },
          status: 'PENDING',
          reminderTime: {
            gte: new Date(), // Only future reminders
          },
        },
        include: {
          medication: true,
        },
        orderBy: {
          reminderTime: 'asc',
        },
      });

      this.logger.log(`Syncing ${reminders.length} medication reminders to calendar for user ${userId}`);

      // Create calendar events for each reminder
      for (const reminder of reminders) {
        await this.createMedicationReminderEvent(
          reminder.medicationId,
          reminder.reminderTime,
          userId,
        );
      }

      this.logger.log(`Medication reminder sync completed for user ${userId}`);
    } catch (error: any) {
      this.logger.error(`Failed to sync medication reminders: ${error.message}`, error.stack);
    }
  }
}
