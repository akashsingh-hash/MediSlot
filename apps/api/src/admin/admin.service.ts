import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

interface CreateDoctorDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specialisation: string;
  workingDays: number[];
  workingHours: { start: string; end: string };
  slotDuration: number;
}

interface UpdateDoctorDto {
  firstName?: string;
  lastName?: string;
  specialisation?: string;
  workingDays?: number[];
  workingHours?: { start: string; end: string };
  slotDuration?: number;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      appointmentsToday,
      activeDoctors,
      allAppointments,
      completedAppointments
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          startTime: {
            gte: today,
          }
        }
      }),
      this.prisma.doctorProfile.count(),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({
        where: { status: 'COMPLETED' }
      })
    ]);

    const completionRate = allAppointments === 0 ? 0 : Math.round((completedAppointments / allAppointments) * 1000) / 10;

    return {
      appointmentsToday,
      activeDoctors,
      completionRate: `${completionRate}%`,
      avgResponseTime: 'N/A' // Requires tracking message response timestamps in the future
    };
  }

  /**
   * Get all doctors with their user information
   */
  async getAllDoctors() {
    return this.prisma.doctorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            appointments: true,
            leaves: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get single doctor by ID
   */
  async getDoctorById(doctorId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            appointments: true,
            leaves: true
          }
        }
      }
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    return doctor;
  }

  /**
   * Create new doctor with user account
   */
  async createDoctor(dto: CreateDoctorDto) {
    // Validate email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate working days (0-6, where 0 = Sunday)
    if (!dto.workingDays || dto.workingDays.length === 0) {
      throw new BadRequestException('Working days must not be empty');
    }

    if (dto.workingDays.some(day => day < 0 || day > 6)) {
      throw new BadRequestException('Working days must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Validate working hours format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(dto.workingHours.start) || !timeRegex.test(dto.workingHours.end)) {
      throw new BadRequestException('Working hours must be in HH:MM format');
    }

    // Validate slot duration
    if (dto.slotDuration < 5 || dto.slotDuration > 120) {
      throw new BadRequestException('Slot duration must be between 5 and 120 minutes');
    }

    const hashedPassword = await this.hashPassword(dto.password);

    // Create user and doctor profile in transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: 'DOCTOR'
        }
      });

      const doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          specialisation: dto.specialisation,
          workingDays: dto.workingDays,
          workingHours: dto.workingHours,
          slotDuration: dto.slotDuration
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true
            }
          }
        }
      });

      return doctorProfile;
    });
  }

  /**
   * Update doctor profile information
   */
  async updateDoctor(doctorId: string, dto: UpdateDoctorDto) {
    // Check if doctor exists
    const existingDoctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId }
    });

    if (!existingDoctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Validate working days if provided
    if (dto.workingDays) {
      if (dto.workingDays.length === 0) {
        throw new BadRequestException('Working days must not be empty');
      }
      if (dto.workingDays.some(day => day < 0 || day > 6)) {
        throw new BadRequestException('Working days must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // Validate working hours if provided
    if (dto.workingHours) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dto.workingHours.start) || !timeRegex.test(dto.workingHours.end)) {
        throw new BadRequestException('Working hours must be in HH:MM format');
      }
    }

    // Validate slot duration if provided
    if (dto.slotDuration !== undefined) {
      if (dto.slotDuration < 5 || dto.slotDuration > 120) {
        throw new BadRequestException('Slot duration must be between 5 and 120 minutes');
      }
    }

    return this.prisma.doctorProfile.update({
      where: { id: doctorId },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            appointments: true,
            leaves: true
          }
        }
      }
    });
  }

  /**
   * Delete doctor (soft delete - deactivate account)
   * Cannot delete if doctor has future appointments
   */
  async deleteDoctor(doctorId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        appointments: {
          where: {
            startTime: {
              gte: new Date()
            },
            status: {
              notIn: ['CANCELLED', 'NO_SHOW']
            }
          }
        },
        user: true
      }
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Check for future appointments
    if (doctor.appointments.length > 0) {
      throw new BadRequestException(
        `Cannot delete doctor with ${doctor.appointments.length} upcoming appointments. ` +
        'Please cancel or reassign all future appointments first.'
      );
    }

    // Soft delete: Mark doctor as inactive instead of deleting
    // This preserves historical appointment data and medical records
    return this.prisma.$transaction(async (tx) => {
      // Mark doctor profile as inactive by clearing working days
      // This prevents new appointments from being booked
      await tx.doctorProfile.update({
        where: { id: doctorId },
        data: {
          workingDays: [], // No working days = no slots available
        }
      });

      // Deactivate user account by modifying email to prevent login
      await tx.user.update({
        where: { id: doctor.userId },
        data: {
          email: `deleted_${doctor.user.email}_${Date.now()}`,
        }
      });

      return { 
        success: true, 
        message: 'Doctor account deactivated successfully. Past appointments and records are preserved.' 
      };
    });
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStatistics(doctorId: string) {
    const doctor = await this.getDoctorById(doctorId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      todayAppointments
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { doctorId }
      }),
      this.prisma.appointment.count({
        where: { doctorId, status: 'COMPLETED' }
      }),
      this.prisma.appointment.count({
        where: {
          doctorId,
          startTime: { gte: new Date() },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] }
        }
      }),
      this.prisma.appointment.count({
        where: {
          doctorId,
          startTime: { gte: today, lte: endOfToday }
        }
      })
    ]);

    return {
      doctorId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      specialisation: doctor.specialisation,
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      todayAppointments,
      totalLeaves: doctor._count.leaves
    };
  }

  /**
   * Add leave/availability block for a doctor (admin only)
   */
  async addDoctorLeave(doctorId: string, date: string) {
    // Validate doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    const leaveDate = new Date(date);
    if (isNaN(leaveDate.getTime())) {
      throw new BadRequestException('Invalid date provided');
    }

    // Check if leave already exists for this date
    const existingLeave = await this.prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        date: leaveDate
      }
    });

    if (existingLeave) {
      throw new ConflictException('Leave already exists for this date');
    }

    // Create leave
    return this.prisma.doctorLeave.create({
      data: {
        doctorId,
        date: leaveDate
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialisation: true
          }
        }
      }
    });
  }

  /**
   * Get all leaves for all doctors (admin only)
   */
  async getAllLeaves() {
    return this.prisma.doctorLeave.findMany({
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialisation: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
  }
}
