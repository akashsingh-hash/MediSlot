import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  ForbiddenException 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdmin(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @UseGuards(AuthGuard)
  @Get('metrics')
  getMetrics(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getMetrics();
  }

  @UseGuards(AuthGuard)
  @Get('doctors')
  getAllDoctors(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAllDoctors();
  }

  @UseGuards(AuthGuard)
  @Get('doctors/:id')
  getDoctorById(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.getDoctorById(id);
  }

  @UseGuards(AuthGuard)
  @Get('doctors/:id/statistics')
  getDoctorStatistics(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.getDoctorStatistics(id);
  }

  @UseGuards(AuthGuard)
  @Post('doctors')
  createDoctor(@Request() req: any, @Body() dto: CreateDoctorDto) {
    this.checkAdmin(req);
    return this.adminService.createDoctor(dto);
  }

  @UseGuards(AuthGuard)
  @Put('doctors/:id')
  updateDoctor(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    this.checkAdmin(req);
    return this.adminService.updateDoctor(id, dto);
  }

  @UseGuards(AuthGuard)
  @Delete('doctors/:id')
  deleteDoctor(@Request() req: any, @Param('id') id: string) {
    this.checkAdmin(req);
    return this.adminService.deleteDoctor(id);
  }

  @UseGuards(AuthGuard)
  @Post('doctors/:id/leave')
  addDoctorLeave(@Request() req: any, @Param('id') doctorId: string, @Body('date') date: string) {
    this.checkAdmin(req);
    return this.adminService.addDoctorLeave(doctorId, date);
  }

  @UseGuards(AuthGuard)
  @Get('leaves')
  getAllLeaves(@Request() req: any) {
    this.checkAdmin(req);
    return this.adminService.getAllLeaves();
  }
}
