export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function loginApi(email: string, password: string = 'password') {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function fetchDoctors() {
  const res = await fetch(`${API_URL}/doctors`)
  if (!res.ok) throw new Error('Failed to fetch doctors')
  return res.json()
}

export async function fetchDoctorSlots(doctorId: string, date: string) {
  const res = await fetch(`${API_URL}/doctors/${doctorId}/slots?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch slots')
  return res.json()
}

export async function bookHold(token: string, data: { doctorId: string, startTime: string, endTime: string, symptoms?: string }) {
  const res = await fetch(`${API_URL}/appointments/hold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Booking failed: ${errorBody}`)
  }
  return res.json()
}

export async function fetchAppointments(token: string) {
  const res = await fetch(`${API_URL}/appointments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch appointments')
  return res.json()
}

export async function fetchMedications(token: string) {
  const res = await fetch(`${API_URL}/medications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch medications')
  return res.json()
}

export async function fetchAdminMetrics(token: string) {
  const res = await fetch(`${API_URL}/admin/metrics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch admin metrics')
  return res.json()
}

export async function fetchMessages(token: string) {
  const res = await fetch(`${API_URL}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function sendMessage(token: string, recipientId: string, content: string) {
  const res = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipientId, content })
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function fetchPatients(token: string) {
  const res = await fetch(`${API_URL}/doctors/patients`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch patients')
  return res.json()
}

export async function fetchLeaves(token: string) {
  const res = await fetch(`${API_URL}/doctors/leave`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch leaves')
  return res.json()
}

export async function addLeave(token: string, date: string) {
  const res = await fetch(`${API_URL}/doctors/leave`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date })
  })
  if (!res.ok) throw new Error('Failed to add leave')
  return res.json()
}

// Calendar API Functions
export async function getCalendarStatus(token: string) {
  const res = await fetch(`${API_URL}/calendar/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch calendar status')
  return res.json()
}

export async function connectCalendar(token: string) {
  // This will redirect to Google OAuth
  window.location.href = `${API_URL}/calendar/connect?token=${token}`
}

export async function disconnectCalendar(token: string) {
  const res = await fetch(`${API_URL}/calendar/disconnect`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to disconnect calendar')
  return res.json()
}

// Admin Doctor Management API Functions
export async function fetchAllDoctors(token: string) {
  const res = await fetch(`${API_URL}/admin/doctors`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch doctors')
  return res.json()
}

export async function fetchDoctorDetails(token: string, doctorId: string) {
  const res = await fetch(`${API_URL}/admin/doctors/${doctorId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch doctor details')
  return res.json()
}

export async function fetchDoctorStatistics(token: string, doctorId: string) {
  const res = await fetch(`${API_URL}/admin/doctors/${doctorId}/statistics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch doctor statistics')
  return res.json()
}

export interface CreateDoctorDto {
  email: string
  password: string
  firstName: string
  lastName: string
  specialisation: string
  workingDays: number[]
  workingHours: { start: string; end: string }
  slotDuration: number
}

export async function createDoctor(token: string, dto: CreateDoctorDto) {
  const res = await fetch(`${API_URL}/admin/doctors`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto)
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to create doctor')
  }
  return res.json()
}

export interface UpdateDoctorDto {
  firstName?: string
  lastName?: string
  specialisation?: string
  workingDays?: number[]
  workingHours?: { start: string; end: string }
  slotDuration?: number
}

export async function updateDoctor(token: string, doctorId: string, dto: UpdateDoctorDto) {
  const res = await fetch(`${API_URL}/admin/doctors/${doctorId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto)
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to update doctor')
  }
  return res.json()
}

export async function deleteDoctor(token: string, doctorId: string) {
  const res = await fetch(`${API_URL}/admin/doctors/${doctorId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to delete doctor')
  }
  return res.json()
}

export async function addDoctorLeave(token: string, doctorId: string, date: string) {
  const res = await fetch(`${API_URL}/admin/doctors/${doctorId}/leave`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date })
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to add leave for doctor')
  }
  return res.json()
}

export async function fetchAllLeaves(token: string) {
  const res = await fetch(`${API_URL}/admin/leaves`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch all leaves')
  return res.json()
}

// Prescriptions API Functions
export interface CreatePrescriptionDto {
  appointmentId: string
  clinicalNotes: string
  followUpSteps: string[]
  medications: {
    name: string
    dose: string
    frequency: string
    duration: string
  }[]
}

export async function createPrescription(token: string, dto: CreatePrescriptionDto) {
  const res = await fetch(`${API_URL}/prescriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto)
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to create prescription')
  }
  return res.json()
}

export async function getMyPrescriptions(token: string) {
  const res = await fetch(`${API_URL}/prescriptions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch prescriptions')
  return res.json()
}

export async function getUpcomingReminders(token: string) {
  const res = await fetch(`${API_URL}/prescriptions/reminders/upcoming`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch reminders')
  return res.json()
}

export async function markReminderTaken(token: string, reminderId: string) {
  const res = await fetch(`${API_URL}/prescriptions/reminders/${reminderId}/taken`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to mark reminder as taken')
  return res.json()
}

// Appointment Cancellation/Rescheduling API Functions
export interface CancelAppointmentDto {
  reason?: string
}

export interface RescheduleAppointmentDto {
  newStartTime: string
  newEndTime: string
}

export async function cancelAppointment(token: string, appointmentId: string, dto?: CancelAppointmentDto) {
  const res = await fetch(`${API_URL}/appointments/${appointmentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto || {})
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to cancel appointment')
  }
  return res.json()
}

export async function rescheduleAppointment(token: string, appointmentId: string, dto: RescheduleAppointmentDto) {
  const res = await fetch(`${API_URL}/appointments/${appointmentId}/reschedule`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto)
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to reschedule appointment')
  }
  return res.json()
}