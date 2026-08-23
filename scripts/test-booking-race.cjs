const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runRaceTest() {
  console.log('\n=============================================');
  console.log('🩺 MEDISLOT CONCURRENCY RACE TEST');
  console.log('=============================================');

  // 1. Create a test doctor and patient
  const doctorUser = await prisma.user.create({
    data: {
      email: `doctor_${Date.now()}@test.local`,
      password: 'testpassword',
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          firstName: 'Concurrency',
          lastName: 'Tester',
          specialisation: 'Neurology',
          workingDays: [1, 2, 3, 4, 5],
          workingHours: { start: '09:00', end: '17:00' },
          slotDuration: 30,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const patientUser = await prisma.user.create({
    data: {
      email: `patient_${Date.now()}@test.local`,
      password: 'testpassword',
      role: 'PATIENT',
      patientProfile: {
        create: {
          firstName: 'Race',
          lastName: 'Patient',
        },
      },
    },
    include: { patientProfile: true },
  });

  const doctor = doctorUser.doctorProfile;
  const patient = patientUser.patientProfile;

  // Single target slot
  const targetStartTime = new Date('2026-09-01T09:00:00.000Z');
  const targetEndTime = new Date('2026-09-01T09:30:00.000Z');

  console.log(`Doctor: Dr. ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);
  console.log(`Patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
  console.log(`Target Slot: ${targetStartTime.toISOString()}`);
  console.log(`\n🚀 Launching 20 SIMULTANEOUS concurrent booking requests for the same slot...`);

  const attempts = 20;
  const promises = [];

  for (let i = 0; i < attempts; i++) {
    const attempt = prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        startTime: targetStartTime,
        endTime: targetEndTime,
        status: 'HELD',
      },
    })
    .then((res) => ({ status: 'SUCCESS', id: res.id }))
    .catch((err) => {
      if (err.code === 'P2002') {
        return { status: 'CONFLICT_P2002' };
      }
      return { status: 'ERROR', message: err.message };
    });

    promises.push(attempt);
  }

  const results = await Promise.all(promises);

  const successes = results.filter((r) => r.status === 'SUCCESS');
  const conflicts = results.filter((r) => r.status === 'CONFLICT_P2002');
  const errors = results.filter((r) => r.status === 'ERROR');

  console.log('\n📊 Concurrency Results:');
  console.log(`---------------------------------------------`);
  console.log(`Concurrent booking attempts: ${attempts}`);
  console.log(`Successful bookings:         ${successes.length}`);
  console.log(`Conflict responses (409):    ${conflicts.length}`);
  if (errors.length > 0) {
    console.log(`Other errors:                ${errors.length}`);
  }

  // Verify database state
  const persistedCount = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      startTime: targetStartTime,
    },
  });

  console.log(`Persisted records in DB:     ${persistedCount}`);
  console.log(`---------------------------------------------`);

  if (successes.length === 1 && persistedCount === 1 && conflicts.length === attempts - 1) {
    console.log(`✅ VERDICT: PASSED! Zero double-booking occurred.`);
    console.log(`Database unique constraint @@unique([doctorId, startTime]) successfully protected data integrity.`);
  } else {
    console.log(`❌ VERDICT: FAILED.`);
  }

  // Cleanup
  await prisma.user.deleteMany({
    where: { id: { in: [doctorUser.id, patientUser.id] } },
  });

  await prisma.$disconnect();
}

runRaceTest().catch(console.error);
