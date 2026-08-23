import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  /**
   * Create a prescription (Doctor only)
   * POST /prescriptions
   */
  @UseGuards(AuthGuard)
  @Post()
  async createPrescription(@Request() req: any, @Body() dto: CreatePrescriptionDto) {
    if (req.user.role !== 'DOCTOR') {
      throw new Error('Only doctors can create prescriptions');
    }
    return this.prescriptionsService.createPrescription(req.user.sub, dto);
  }

  /**
   * Get prescription by ID
   * GET /prescriptions/:id
   */
  @UseGuards(AuthGuard)
  @Get(':id')
  async getPrescription(@Request() req: any, @Param('id') id: string) {
    return this.prescriptionsService.getPrescription(id, req.user.sub, req.user.role);
  }

  /**
   * Get all prescriptions for current patient
   * GET /prescriptions
   */
  @UseGuards(AuthGuard)
  @Get()
  async getMyPrescriptions(@Request() req: any) {
    if (req.user.role !== 'PATIENT') {
      return [];
    }
    return this.prescriptionsService.getPatientPrescriptions(req.user.sub);
  }

  /**
   * Get upcoming reminders for today
   * GET /prescriptions/reminders/upcoming
   */
  @UseGuards(AuthGuard)
  @Get('reminders/upcoming')
  async getUpcomingReminders(@Request() req: any) {
    if (req.user.role !== 'PATIENT') {
      return [];
    }
    return this.prescriptionsService.getUpcomingReminders(req.user.sub);
  }

  /**
   * Mark a reminder as taken
   * PATCH /prescriptions/reminders/:id/taken
   */
  @UseGuards(AuthGuard)
  @Patch('reminders/:id/taken')
  async markReminderTaken(@Request() req: any, @Param('id') id: string) {
    return this.prescriptionsService.markReminderTaken(id, req.user.sub);
  }

  /**
   * Generate post-visit summary for a visit
   * POST /prescriptions/visits/:visitId/summary
   */
  @UseGuards(AuthGuard)
  @Post('visits/:visitId/summary')
  async generatePostVisitSummary(@Request() req: any, @Param('visitId') visitId: string) {
    if (req.user.role !== 'DOCTOR') {
      throw new Error('Only doctors can generate post-visit summaries');
    }
    return this.prescriptionsService.generatePostVisitSummary(visitId);
  }

  /**
   * Get post-visit summary for a visit
   * GET /prescriptions/visits/:visitId/summary
   */
  @UseGuards(AuthGuard)
  @Get('visits/:visitId/summary')
  async getPostVisitSummary(@Request() req: any, @Param('visitId') visitId: string) {
    return this.prescriptionsService.getPostVisitSummary(visitId, req.user.sub, req.user.role);
  }
}
