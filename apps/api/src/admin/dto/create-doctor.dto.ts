import { IsString, IsNotEmpty, IsEmail, IsArray, IsNumber, IsObject, Min, ArrayMinSize, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

class WorkingHoursDto {
  @IsString()
  @IsNotEmpty()
  start: string;  // Format: "HH:mm"

  @IsString()
  @IsNotEmpty()
  end: string;    // Format: "HH:mm"
}

export class CreateDoctorDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  specialisation: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one working day is required' })
  @IsNumber({}, { each: true })
  workingDays: number[];  // 1-7 for Monday-Sunday

  @IsObject()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto;

  @IsNumber()
  @Min(15, { message: 'Slot duration must be at least 15 minutes' })
  slotDuration: number;  // in minutes
}
