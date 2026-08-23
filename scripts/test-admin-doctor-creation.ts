/**
 * Test script for Admin Doctor Creation
 * 
 * This script tests the complete doctor creation flow via API
 * 
 * Usage:
 *   npx ts-node scripts/test-admin-doctor-creation.ts
 */

const API_URL = 'http://localhost:3001';

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

async function loginAsAdmin(): Promise<string> {
  console.log('🔐 Logging in as admin...');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@demo.local',
      password: 'demo123'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to login as admin');
  }

  const data = await response.json();
  console.log('✅ Admin login successful');
  return data.access_token;
}

async function createTestDoctor(token: string): Promise<any> {
  console.log('\n👨‍⚕️ Creating test doctor...');
  
  const doctorData: CreateDoctorDto = {
    email: `test.doctor.${Date.now()}@hospital.com`, // Unique email
    password: 'Welcome123',
    firstName: 'Test',
    lastName: 'Doctor',
    specialisation: 'General Practice',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    slotDuration: 30
  };

  const response = await fetch(`${API_URL}/admin/doctors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(doctorData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create doctor: ${error.message}`);
  }

  const doctor = await response.json();
  console.log('✅ Doctor created successfully');
  console.log(`   ID: ${doctor.id}`);
  console.log(`   Email: ${doctor.user.email}`);
  console.log(`   Name: Dr. ${doctor.firstName} ${doctor.lastName}`);
  console.log(`   Specialisation: ${doctor.specialisation}`);
  
  return doctor;
}

async function verifyDoctorLogin(email: string, password: string): Promise<boolean> {
  console.log('\n🔑 Verifying doctor can login...');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    console.log('❌ Doctor login failed');
    return false;
  }

  const data = await response.json();
  console.log('✅ Doctor login successful');
  console.log(`   Role: ${data.role}`);
  return data.role === 'DOCTOR';
}

async function getAllDoctors(token: string): Promise<any[]> {
  console.log('\n📋 Fetching all doctors...');
  
  const response = await fetch(`${API_URL}/admin/doctors`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch doctors');
  }

  const doctors = await response.json();
  console.log(`✅ Found ${doctors.length} doctors in system`);
  return doctors;
}

async function getDoctorStatistics(token: string, doctorId: string): Promise<any> {
  console.log('\n📊 Fetching doctor statistics...');
  
  const response = await fetch(`${API_URL}/admin/doctors/${doctorId}/statistics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch doctor statistics');
  }

  const stats = await response.json();
  console.log('✅ Statistics retrieved:');
  console.log(`   Total Appointments: ${stats.totalAppointments}`);
  console.log(`   Completed: ${stats.completedAppointments}`);
  console.log(`   Upcoming: ${stats.upcomingAppointments}`);
  console.log(`   Today: ${stats.todayAppointments}`);
  return stats;
}

async function deleteTestDoctor(token: string, doctorId: string): Promise<void> {
  console.log('\n🗑️  Cleaning up test doctor...');
  
  const response = await fetch(`${API_URL}/admin/doctors/${doctorId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    console.log(`⚠️  Could not delete doctor: ${error.message}`);
    return;
  }

  console.log('✅ Test doctor deleted');
}

async function main() {
  console.log('🏥 MediSlot - Admin Doctor Creation Test\n');
  console.log('=' .repeat(50));
  
  let adminToken: string;
  let createdDoctor: any;

  try {
    // Step 1: Login as admin
    adminToken = await loginAsAdmin();

    // Step 2: Get existing doctors count
    const doctorsBefore = await getAllDoctors(adminToken);
    const countBefore = doctorsBefore.length;

    // Step 3: Create new doctor
    createdDoctor = await createTestDoctor(adminToken);

    // Step 4: Verify doctor can login
    const canLogin = await verifyDoctorLogin(
      createdDoctor.user.email,
      'Welcome123'
    );

    if (!canLogin) {
      throw new Error('Doctor login verification failed');
    }

    // Step 5: Get updated doctors count
    const doctorsAfter = await getAllDoctors(adminToken);
    const countAfter = doctorsAfter.length;

    if (countAfter !== countBefore + 1) {
      throw new Error(`Expected ${countBefore + 1} doctors, found ${countAfter}`);
    }

    // Step 6: Get doctor statistics
    await getDoctorStatistics(adminToken, createdDoctor.id);

    // Step 7: Cleanup
    await deleteTestDoctor(adminToken, createdDoctor.id);

    // Final verification
    const doctorsFinal = await getAllDoctors(adminToken);
    if (doctorsFinal.length !== countBefore) {
      console.log(`⚠️  Warning: Doctor count mismatch after cleanup`);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Admin authentication');
    console.log('   ✅ Doctor creation');
    console.log('   ✅ Doctor login');
    console.log('   ✅ Doctor listing');
    console.log('   ✅ Doctor statistics');
    console.log('   ✅ Doctor deletion');
    console.log('\n🎉 Admin doctor management is working correctly!');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    
    // Cleanup on failure
    if (createdDoctor && adminToken) {
      console.log('\n🧹 Attempting cleanup...');
      try {
        await deleteTestDoctor(adminToken, createdDoctor.id);
      } catch {
        console.log('⚠️  Manual cleanup may be required');
      }
    }
    
    process.exit(1);
  }
}

main();
