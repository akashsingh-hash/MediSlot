import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  findAll(@Query('specialisation') specialisation?: string) {
    return this.doctorsService.findAll(specialisation);
  }

  @UseGuards(AuthGuard)
  @Get('patients')
  getPatients(@Request() req: any) {
    return this.doctorsService.getPatients(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('leave')
  getLeaves(@Request() req: any) {
    return this.doctorsService.getLeaves(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post('leave')
  addLeave(@Request() req: any, @Body('date') date: string) {
    return this.doctorsService.addLeave(req.user.sub, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Get(':id/slots')
  getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.getSlots(id, date);
  }
}

