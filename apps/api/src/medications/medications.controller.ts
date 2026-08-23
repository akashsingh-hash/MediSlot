import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @UseGuards(AuthGuard)
  @Get()
  getMedications(@Request() req: any) {
    if (req.user.role === 'PATIENT') {
      return this.medicationsService.getPatientMedications(req.user.sub);
    }
    return []; // For now, doctors don't need to fetch their own medications
  }
}
