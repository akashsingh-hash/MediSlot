import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicationsService {
  constructor(private prisma: PrismaService) {}

  async getPatientMedications(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId }
    });

    if (!profile) return [];

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        visit: {
          appointment: {
            patientId: profile.id
          }
        }
      },
      include: {
        medications: true,
        visit: {
          include: {
            appointment: {
              include: {
                doctor: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    });

    // Flatten to match the expected UI structure
    const medsList = [];
    for (const p of prescriptions) {
      for (const m of p.medications) {
        medsList.push({
          id: m.id,
          name: m.name,
          dose: m.dose,
          time: m.frequency,
          state: 'Pending', // default state for demo
          prescribedBy: `Dr. ${p.visit.appointment.doctor.firstName} ${p.visit.appointment.doctor.lastName}`,
          date: p.createdAt
        });
      }
    }
    return medsList;
  }
}
