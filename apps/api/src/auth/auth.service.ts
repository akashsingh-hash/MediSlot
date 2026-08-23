import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

interface RegisterPatientDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let isPasswordValid = false;
    if (user.password.startsWith('$')) {
      isPasswordValid = await argon2.verify(user.password, loginDto.password);
    } else {
      // Legacy or seed data fallback (SHA256 hex)
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(loginDto.password).digest('hex');
      isPasswordValid = (hash === user.password);
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      role: user.role,
      email: user.email
    };
  }

  async registerPatient(registerDto: RegisterPatientDto) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate email uniqueness
    const existing = await this.prisma.user.findUnique({ 
      where: { email: registerDto.email.toLowerCase() }
    });
    
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Validate password strength
    if (registerDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Validate name fields
    if (!registerDto.firstName || registerDto.firstName.trim().length < 2) {
      throw new BadRequestException('First name must be at least 2 characters long');
    }

    if (!registerDto.lastName || registerDto.lastName.trim().length < 2) {
      throw new BadRequestException('Last name must be at least 2 characters long');
    }

    // Validate phone if provided
    if (registerDto.phone) {
      // Remove all non-digit characters for validation
      const digitsOnly = registerDto.phone.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        throw new BadRequestException('Phone number must be between 10 and 15 digits');
      }
    }

    // Hash password with argon2
    const hashedPassword = await argon2.hash(registerDto.password);

    // Create user and patient profile in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: registerDto.email.toLowerCase(),
          password: hashedPassword,
          role: 'PATIENT',
        }
      });

      await tx.patientProfile.create({
        data: {
          userId: newUser.id,
          firstName: registerDto.firstName.trim(),
          lastName: registerDto.lastName.trim(),
          phone: registerDto.phone?.trim() || null,
        }
      });

      return newUser;
    });

    this.logger.log(`New patient registered: ${user.email}`);

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      role: user.role,
      email: user.email
    };
  }

  /**
   * Check if email is available for registration
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    return { available: !existing };
  }
}
