import { Controller, Post, Get, Delete, Patch, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AuthGuard } from '../auth/auth.guard';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateHoldDto {
  @IsString()
  doctorId: string;
  
  @IsDateString()
  startTime: string;
  
  @IsDateString()
  endTime: string;
  
  @IsOptional()
  @IsString()
  symptoms?: string;
}

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RescheduleAppointmentDto {
  @IsDateString()
  newStartTime: string;
  
  @IsDateString()
  newEndTime: string;
}

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(AuthGuard)
  @Post('hold')
  createHold(@Request() req: any, @Body() data: CreateHoldDto) {
    return this.appointmentsService.createHold({
      doctorId: data.doctorId,
      patientId: req.user.sub,
      startTime: data.startTime,
      endTime: data.endTime,
      symptoms: data.symptoms
    });
  }

  @UseGuards(AuthGuard)
  @Get()
  getAppointments(@Request() req: any) {
    return this.appointmentsService.getAppointments(req.user.sub, req.user.role);
  }

  @UseGuards(AuthGuard)
  @Post(':id/confirm')
  confirmAppointment(@Request() req: any, @Param('id') id: string) {
    return this.appointmentsService.confirmAppointment(id, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  cancelAppointment(@Request() req: any, @Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancelAppointment(id, req.user.sub, dto.reason);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/reschedule')
  rescheduleAppointment(@Request() req: any, @Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.rescheduleAppointment(
      id, 
      req.user.sub, 
      dto.newStartTime, 
      dto.newEndTime
    );
  }
}
