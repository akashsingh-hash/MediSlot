import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface IEmailProvider {
  sendEmail(payload: EmailPayload): Promise<boolean>;
}

/**
 * Resend Email Provider
 */
@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private resend: Resend | null = null;
  private emailFrom: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resendApiKey');
    this.emailFrom = this.configService.get<string>('emailFrom') || 'MediSlot <noreply@medislot.demo>';

    if (apiKey && apiKey !== 're_123456789') {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email provider initialized');
    } else {
      this.logger.warn('Resend API key not configured - emails will be logged only');
    }
  }

  async sendEmail(payload: EmailPayload): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(`[DEV MODE] Email would be sent to ${payload.to}: ${payload.subject}`);
      return false;
    }

    try {
      const result = await this.resend.emails.send({
        from: this.emailFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (result.error) {
        this.logger.error(`Failed to send email to ${payload.to}:`, result.error);
        return false;
      }

      this.logger.log(`Email sent successfully to ${payload.to} (ID: ${result.data?.id})`);
      return true;
    } catch (error: any) {
      this.logger.error(`Exception sending email to ${payload.to}:`, error.message);
      return false;
    }
  }
}

/**
 * Email Service with provider abstraction
 */
@Injectable()
export class EmailService {
  private provider: IEmailProvider;

  constructor(private configService: ConfigService) {
    this.provider = new ResendProvider(this.configService);
  }

  getProvider(): IEmailProvider {
    return this.provider;
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    recipientEmail: string,
    recipientName: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentTime: string,
  ): Promise<boolean> {
    const subject = '✓ Appointment Confirmed - MediSlot';
    const html = this.generateBookingConfirmationTemplate(
      recipientName,
      doctorName,
      appointmentDate,
      appointmentTime,
    );

    return this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(
    recipientEmail: string,
    recipientName: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentTime: string,
  ): Promise<boolean> {
    const subject = '🔔 Reminder: Upcoming Appointment Tomorrow - MediSlot';
    const html = this.generateReminderTemplate(
      recipientName,
      doctorName,
      appointmentDate,
      appointmentTime,
    );

    return this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send reschedule notification email
   */
  async sendRescheduleEmail(
    recipientEmail: string,
    recipientName: string,
    otherPartyName: string,
    oldDate: Date,
    newDate: Date,
    rescheduledBy: string,
  ): Promise<boolean> {
    const subject = '📅 Appointment Rescheduled - MediSlot';
    const html = this.generateRescheduleTemplate(
      recipientName,
      otherPartyName,
      oldDate,
      newDate,
      rescheduledBy,
    );

    return this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send cancellation email
   */
  async sendCancellationEmail(
    recipientEmail: string,
    recipientName: string,
    doctorName: string,
    appointmentDate: Date,
    reason: string,
  ): Promise<boolean> {
    const subject = 'Appointment Cancelled - MediSlot';
    const html = this.generateCancellationTemplate(
      recipientName,
      doctorName,
      appointmentDate,
      reason,
    );

    return this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send doctor leave conflict notification
   */
  async sendLeaveConflictEmail(
    recipientEmail: string,
    recipientName: string,
    doctorName: string,
    originalDate: Date,
  ): Promise<boolean> {
    const subject = 'Appointment Requires Rescheduling - MediSlot';
    const html = this.generateLeaveConflictTemplate(
      recipientName,
      doctorName,
      originalDate,
    );

    return this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send medication reminder email
   */
  async sendMedicationReminder(
    recipientEmail: string,
    recipientName: string,
    medicationName: string,
    dose: string,
    time: string,
  ): Promise<boolean> {
    const subject = '💊 Medication Reminder - MediSlot';
    const html = this.generateMedicationReminderTemplate(
      recipientName,
      medicationName,
      dose,
      time,
    );

    return this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send post-visit summary available email
   */
  async sendPostVisitSummaryEmail(
    recipientEmail: string,
    recipientName: string,
    doctorName: string,
    visitDate: Date,
  ): Promise<boolean> {
    const subject = '📄 Visit Summary Available - MediSlot';
    const html = this.generatePostVisitSummaryTemplate(
      recipientName,
      doctorName,
      visitDate,
    );

    return this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  // ============ Email Templates ============

  private generateBookingConfirmationTemplate(
    patientName: string,
    doctorName: string,
    date: Date,
    time: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background-color: #147d78; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                ✓ Appointment Confirmed
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #172427; font-size: 16px; line-height: 1.5;">
                Hi <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #172427; font-size: 16px; line-height: 1.5;">
                Your appointment has been confirmed. We look forward to seeing you!
              </p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #dceee8; border-left: 4px solid #147d78; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #6d7b7d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Doctor</td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 16px; color: #172427; font-size: 18px; font-weight: 600;">${doctorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6d7b7d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</td>
                  </tr>
                  <tr>
                    <td style="padding: 0; color: #172427; font-size: 18px; font-weight: 600;">
                      ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      <br>
                      <span style="font-size: 16px; font-weight: 400;">${time}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 24px 0 0; color: #6d7b7d; font-size: 14px; line-height: 1.5;">
                You'll receive a reminder 24 hours before your appointment. If you need to reschedule or cancel, please log in to your MediSlot account.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f6f7f4; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6d7b7d; font-size: 12px; line-height: 1.5; text-align: center;">
                <strong>MediSlot</strong> · Healthcare, coordinated.
                <br>
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateReminderTemplate(
    patientName: string,
    doctorName: string,
    date: Date,
    time: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 32px 32px 24px; background-color: #b27622; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                🔔 Appointment Tomorrow
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #172427; font-size: 16px; line-height: 1.5;">
                Hi <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #172427; font-size: 16px; line-height: 1.5;">
                This is a friendly reminder about your upcoming appointment.
              </p>
              
              <div style="background-color: #f8ecd9; border-left: 4px solid #b27622; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #6d7b7d; font-size: 13px;">WITH</td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 16px; color: #172427; font-size: 18px; font-weight: 600;">${doctorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6d7b7d; font-size: 13px;">WHEN</td>
                  </tr>
                  <tr>
                    <td style="padding: 0; color: #172427; font-size: 18px; font-weight: 600;">
                      ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      <br>
                      <span style="font-size: 16px; font-weight: 400;">${time}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 24px 0 0; color: #6d7b7d; font-size: 14px; line-height: 1.5;">
                Please arrive 10 minutes early. If you can't make it, please cancel or reschedule through your MediSlot account.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background-color: #f6f7f4; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6d7b7d; font-size: 12px; text-align: center;">
                <strong>MediSlot</strong> · Healthcare, coordinated.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateCancellationTemplate(
    patientName: string,
    doctorName: string,
    date: Date,
    reason: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 20px; color: #172427; font-size: 24px; font-weight: 700;">
                Appointment Cancelled
              </h1>
              
              <p style="margin: 0 0 20px; color: #172427; font-size: 16px; line-height: 1.5;">
                Hi <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #172427; font-size: 16px; line-height: 1.5;">
                Your appointment has been cancelled.
              </p>
              
              <div style="background-color: #fae4e1; border-left: 4px solid #c55a51; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #6d7b7d; font-size: 13px;">CANCELLED APPOINTMENT</p>
                <p style="margin: 0 0 4px; color: #172427; font-size: 16px; font-weight: 600;">${doctorName}</p>
                <p style="margin: 0; color: #6d7b7d; font-size: 14px;">${date.toLocaleDateString()}</p>
                ${reason !== 'User cancelled' ? `<p style="margin: 16px 0 0; color: #172427; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              
              <p style="margin: 24px 0 0; color: #6d7b7d; font-size: 14px; line-height: 1.5;">
                If you'd like to reschedule, please log in to your MediSlot account to book a new appointment.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background-color: #f6f7f4; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6d7b7d; font-size: 12px; text-align: center;">
                <strong>MediSlot</strong> · Healthcare, coordinated.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateLeaveConflictTemplate(
    patientName: string,
    doctorName: string,
    date: Date,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Requires Rescheduling</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 20px; color: #172427; font-size: 24px; font-weight: 700;">
                Appointment Requires Rescheduling
              </h1>
              
              <p style="margin: 0 0 20px; color: #172427; font-size: 16px; line-height: 1.5;">
                Hi <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #172427; font-size: 16px; line-height: 1.5;">
                Unfortunately, ${doctorName} is unavailable on ${date.toLocaleDateString()} due to unexpected circumstances. Your appointment will need to be rescheduled.
              </p>
              
              <div style="background-color: #f8ecd9; border-left: 4px solid #b27622; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; color: #172427; font-size: 14px; line-height: 1.5;">
                  Please log in to your MediSlot account to select a new date and time that works for you. We apologize for any inconvenience this may cause.
                </p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background-color: #f6f7f4; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6d7b7d; font-size: 12px; text-align: center;">
                <strong>MediSlot</strong> · Healthcare, coordinated.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateMedicationReminderTemplate(
    patientName: string,
    medicationName: string,
    dose: string,
    time: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medication Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 20px; color: #172427; font-size: 24px; font-weight: 700;">
                💊 Medication Reminder
              </h1>
              
              <p style="margin: 0 0 20px; color: #172427; font-size: 16px; line-height: 1.5;">
                Hi <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #172427; font-size: 16px; line-height: 1.5;">
                Time to take your medication:
              </p>
              
              <div style="background-color: #dceee8; border-left: 4px solid #147d78; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #172427; font-size: 18px; font-weight: 600;">${medicationName}</p>
                <p style="margin: 0 0 4px; color: #6d7b7d; font-size: 14px;">Dose: ${dose}</p>
                <p style="margin: 0; color: #6d7b7d; font-size: 14px;">Time: ${time}</p>
              </div>
              
              <p style="margin: 24px 0 0; color: #6d7b7d; font-size: 14px; line-height: 1.5;">
                Stay consistent with your care plan for the best results.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background-color: #f6f7f4; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6d7b7d; font-size: 12px; text-align: center;">
                <strong>MediSlot</strong> · Healthcare, coordinated.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generatePostVisitSummaryTemplate(
    patientName: string,
    doctorName: string,
    visitDate: Date,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visit Summary Available</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 20px; color: #172427; font-size: 24px; font-weight: 700;">
                📄 Visit Summary Available
              </h1>
              
              <p style="margin: 0 0 20px; color: #172427; font-size: 16px; line-height: 1.5;">
                Hi <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #172427; font-size: 16px; line-height: 1.5;">
                Your visit summary from ${doctorName} on ${visitDate.toLocaleDateString()} is now available.
              </p>
              
              <div style="background-color: #dceee8; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; color: #172427; font-size: 14px; line-height: 1.5;">
                  Log in to your MediSlot account to view your personalized visit summary, medications, and next steps.
                </p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background-color: #f6f7f4; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6d7b7d; font-size: 12px; text-align: center;">
                <strong>MediSlot</strong> · Healthcare, coordinated.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateRescheduleTemplate(
    recipientName: string,
    otherPartyName: string,
    oldDate: Date,
    newDate: Date,
    rescheduledBy: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Rescheduled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f7f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 32px 32px 24px; background-color: #5b7fc7; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                📅 Appointment Rescheduled
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #172427; font-size: 16px; line-height: 1.5;">
                Hi <strong>${recipientName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #172427; font-size: 16px; line-height: 1.5;">
                Your appointment with ${otherPartyName} has been rescheduled.
              </p>
              
              <!-- Previous Time -->
              <div style="background-color: #fae4e1; border-left: 4px solid #c55a51; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #6d7b7d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Previous Time</p>
                <p style="margin: 0; color: #172427; font-size: 16px; font-weight: 600;">
                  ${oldDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  <br>
                  <span style="font-weight: 400;">${oldDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>

              <!-- New Time -->
              <div style="background-color: #d4e8f7; border-left: 4px solid #5b7fc7; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #6d7b7d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">New Time</p>
                <p style="margin: 0; color: #172427; font-size: 18px; font-weight: 600;">
                  ${newDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  <br>
                  <span style="font-weight: 500;">${newDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #6d7b7d; font-size: 14px; line-height: 1.5;">
                The appointment has been rescheduled by ${rescheduledBy === 'patient' ? 'the patient' : 'the doctor'}. 
                ${rescheduledBy === 'patient' ? 'The doctor will be notified of this change.' : 'You will receive a calendar update shortly.'}
              </p>

              <p style="margin: 16px 0 0; color: #6d7b7d; font-size: 14px; line-height: 1.5;">
                If you have any questions or need to make further changes, please log in to your MediSlot account.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; background-color: #f6f7f4; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6d7b7d; font-size: 12px; line-height: 1.5; text-align: center;">
                <strong>MediSlot</strong> · Healthcare, coordinated.
                <br>
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
