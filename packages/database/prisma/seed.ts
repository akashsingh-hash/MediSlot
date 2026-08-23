import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  const passwordHash = await hashPassword('demo123');

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      email: 'admin@demo.local',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  // Doctor
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@demo.local' },
    update: {},
    create: {
      email: 'doctor@demo.local',
      password: passwordHash,
      role: 'DOCTOR',
    },
  });

  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      firstName: 'Sarah',
      lastName: 'Smith',
      specialisation: 'Cardiology',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '17:00' },
      slotDuration: 30,
    },
  });

  // Patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@demo.local' },
    update: {},
    create: {
      email: 'patient@demo.local',
      password: passwordHash,
      role: 'PATIENT',
    },
  });

  await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0100',
    },
  });

  console.log('Seeding complete! Demo users created:');
  console.log('admin@demo.local / demo123');
  console.log('doctor@demo.local / demo123');
  console.log('patient@demo.local / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
