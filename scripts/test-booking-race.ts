import { PrismaClient } from '@prisma/client';
import { addDays, set } from 'date-fns';

const prisma = new PrismaClient();

async function runRaceTest() {
  console.log('--- MediSlot Concurrency Test ---');

  // 1. Setup Data
  const doctor = await prisma.doctorProfile.create({
    data: {
      firstName: 'Test',
      lastName: 'Doctor',
      specialisation: 'General Practice',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '17:00' },
      slotDuration: 30,
      user: {
        create: {
          email: `doctor_${Date.now()}@test.local`,
          password: 'hashedpassword',
          role: 'DOCTOR',
        },
      },
    },
  });

  const patient = await prisma.patientProfile.create({
    data: {
      firstName: 'Test',
      lastName: 'Patient',
      user: {
        create: {
          email: `patient_${Date.now()}@test.local`,
          password: 'hashedpassword',
          role: 'PATIENT',
        },
      },
    },
  });

  const targetDate = set(addDays(new Date(), 1), {
    hours: 9,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  
  const targetEndTime = set(addDays(new Date(), 1), {
    hours: 9,
    minutes: 30,
    seconds: 0,
    milliseconds: 0,
  });

  console.log(`Target Slot: ${targetDate.toISOString()}`);
  console.log(`Doctor ID: ${doctor.id}`);
  console.log(`Patient ID: ${patient.id}`);
  console.log('Launching 20 concurrent booking attempts...');

  const attempts = 20;
  const promises = [];

  for (let i = 0; i < attempts; i++) {
    const attempt = prisma.$transaction(async (tx) => {
      // Trying to hold the slot. If another transaction commits first,
      // the unique constraint (doctorId, startTime) will throw a P2002 error.
      const appointment = await tx.appointment.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          startTime: targetDate,
          endTime: targetEndTime,
          status: 'HELD', // Starting as held
        },
      });
      return appointment;
    }).catch(e => {
      if (e.code === 'P2002') {
        return 'CONFLICT';
      }
      return 'OTHER_ERROR';
    });
    
    promises.push(attempt);
  }

  const results = await Promise.all(promises);

  const successes = results.filter((r) => typeof r === 'object' && r !== null);
  const conflicts = results.filter((r) => r === 'CONFLICT');
  const errors = results.filter((r) => r === 'OTHER_ERROR');

  console.log('\n--- Test Results ---');
  console.log(`Concurrent booking attempts: ${attempts}`);
  console.log(`Successful bookings: ${successes.length}`);
  console.log(`Conflict responses (P2002): ${conflicts.length}`);
  
  if (errors.length > 0) {
    console.log(`Other errors: ${errors.length}`);
  }

  // Verify DB State
  const persisted = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      startTime: targetDate,
    },
  });

  console.log(`Persisted appointments for slot: ${persisted}`);

  if (successes.length === 1 && persisted === 1 && conflicts.length === attempts - 1) {
    console.log('\n✅ TEST PASSED: Concurrency control prevents double-booking.');
  } else {
    console.error('\n❌ TEST FAILED: Concurrency control is broken.');
  }

  // Cleanup
  await prisma.user.deleteMany({
    where: {
      id: { in: [doctor.userId, patient.userId] }
    }
  });

  await prisma.$disconnect();
}

runRaceTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
