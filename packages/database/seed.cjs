const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Neon database...');
  const hash = crypto.createHash('sha256').update('demo123').digest('hex');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      email: 'admin@demo.local',
      password: hash,
      role: 'ADMIN',
    },
  });

  const docUser = await prisma.user.upsert({
    where: { email: 'doctor@demo.local' },
    update: {},
    create: {
      email: 'doctor@demo.local',
      password: hash,
      role: 'DOCTOR',
    },
  });

  await prisma.doctorProfile.upsert({
    where: { userId: docUser.id },
    update: {},
    create: {
      userId: docUser.id,
      firstName: 'Sarah',
      lastName: 'Smith',
      specialisation: 'Cardiology',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '17:00' },
      slotDuration: 30,
    },
  });

  const patUser = await prisma.user.upsert({
    where: { email: 'patient@demo.local' },
    update: {},
    create: {
      email: 'patient@demo.local',
      password: hash,
      role: 'PATIENT',
    },
  });

  await prisma.patientProfile.upsert({
    where: { userId: patUser.id },
    update: {},
    create: {
      userId: patUser.id,
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0100',
    },
  });

  console.log('✅ Seeding complete!');
  console.log('Demo accounts available:');
  console.log(' - admin@demo.local / demo123 (Role: ADMIN)');
  console.log(' - doctor@demo.local / demo123 (Role: DOCTOR - Dr. Sarah Smith, Cardiology)');
  console.log(' - patient@demo.local / demo123 (Role: PATIENT - John Doe)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
