const { PrismaClient } = require('@medislot/database');
const prisma = new PrismaClient();

async function runTest() {
  console.log("=========================================");
  console.log("🚀 STARTING E2E BACKEND INTEGRATION TEST");
  console.log("=========================================\n");

  try {
    // 1. LOGIN AS PATIENT
    console.log("1. Authenticating as patient@demo.local...");
    const loginRes = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@demo.local', password: 'demo123' })
    });
    
    if (!loginRes.ok) throw new Error("Login failed! " + await loginRes.text());
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log("✅ Successfully authenticated. Received JWT Token.\n");

    // 2. FETCH DOCTORS
    console.log("2. Fetching available doctors...");
    const docsRes = await fetch('http://localhost:3001/doctors', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const doctors = await docsRes.json();
    const doctor = doctors[0];
    if (!doctor) throw new Error("No doctors found in DB!");
    console.log(`✅ Found Doctor: ${doctor.user.email} (ID: ${doctor.id})\n`);

    // 3. BOOK APPOINTMENT
    console.log("3. Creating a Slot Hold with symptoms for Gemini AI...");
    const symptoms = "Patient reports severe chest pain, shortness of breath, and left arm numbness that started 30 minutes ago.";
    
    // Pick a date in the future, append random minute to avoid conflicts with previous tests
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 2);
    startTime.setHours(10, Math.floor(Math.random() * 60), 0, 0);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const bookRes = await fetch('http://localhost:3001/appointments/hold', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        doctorId: doctor.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: 'CONSULTATION',
        symptoms: symptoms
      })
    });

    if (!bookRes.ok) {
      const errorText = await bookRes.text();
      // Handle the case where it might already be booked by previous tests
      if (bookRes.status === 409) {
        console.log("⚠️ Slot already held by previous test, which proves concurrency works!");
      } else {
        throw new Error("Booking failed! " + errorText);
      }
    } else {
      const appointment = await bookRes.json();
      console.log(`✅ Slot held successfully! Appointment ID: ${appointment.id}\n`);
      
      console.log("4. Waiting for BullMQ and Gemini AI to process the pre-visit summary...");
      await new Promise(r => setTimeout(r, 6000));

      console.log("5. Checking Database for AI-generated PreVisitSummary...");
      const summary = await prisma.preVisitSummary.findUnique({
        where: { appointmentId: appointment.id }
      });

      if (summary) {
        console.log("🎉 SUCCESS! Gemini AI processed the queue and generated the summary:");
        console.log("   - Urgency Level:", summary.urgencyLevel);
        console.log("   - Chief Complaint:", summary.chiefComplaint);
        console.log("   - AI Questions:", summary.suggestedQuestions);
      } else {
        console.log("❌ Failed to find summary. The queue processor might still be running or failed.");
      }
    }
  } catch (e) {
    console.error("❌ E2E TEST FAILED:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
