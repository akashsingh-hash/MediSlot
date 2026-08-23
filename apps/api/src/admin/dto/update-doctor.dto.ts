import { IsString, IsOptional, IsArray, IsNumber, IsObject, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WorkingHoursDto {
  @IsString()
  start: string;  // Format: "HH:mm"

  @IsString()
  end: string;    // Format: "HH:mm"
}

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  specialisation?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one working day is required' })
  @IsNumber({}, { each: true })
  workingDays?: number[];  // 1-7 for Monday-Sunday

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  @IsOptional()
  @IsNumber()
  @Min(15, { message: 'Slot duration must be at least 15 minutes' })
  slotDuration?: number;  // in minutes
}
