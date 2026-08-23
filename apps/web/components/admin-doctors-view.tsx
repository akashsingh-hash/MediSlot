'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, X, Check, MoreVertical, Calendar, Clock, Users, TrendingUp } from 'lucide-react'
import { useAuth } from './auth-provider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchAllDoctors, 
  createDoctor, 
  updateDoctor, 
  deleteDoctor,
  fetchDoctorStatistics,
  type CreateDoctorDto,
  type UpdateDoctorDto
} from '@/lib/api'

function Modal({ isOpen, onClose, title, children, size = 'medium' }: any) {
  if (!isOpen) return null
  const maxWidth = size === 'large' ? 800 : 500
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--background)', borderRadius: 12, padding: 24, width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={20}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Status({ children, tone = 'success' }: { children: React.ReactNode; tone?: 'success'|'warning'|'neutral'|'danger' }) {
  return <span className={`status status-${tone}`}><span className="status-dot" />{children}</span>
}

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string, style?: React.CSSProperties }) {
  return <section className={`surface ${className}`} style={style}>{children}</section>
}

function Heading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

const COMMON_SPECIALISATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Practice',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Surgery',
  'Urology'
]

export function AdminDoctorsView({ setNotice }: { setNotice: (msg: string) => void }) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form states for create/edit
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialisation: '',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri default
    workingHours: { start: '09:00', end: '17:00' },
    slotDuration: 30
  })

  // Fetch all doctors
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => fetchAllDoctors(token as string),
    enabled: !!token
  })

  // Fetch doctor statistics
  const { data: stats } = useQuery({
    queryKey: ['doctor-stats', selectedDoctor?.id],
    queryFn: () => fetchDoctorStatistics(token as string, selectedDoctor.id),
    enabled: !!token && !!selectedDoctor && showStatsModal
  })

  // Create doctor mutation
  const createMutation = useMutation({
    mutationFn: (dto: CreateDoctorDto) => createDoctor(token as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setShowCreateModal(false)
      resetForm()
      setNotice('✅ Doctor created successfully')
    },
    onError: (error: any) => {
      setNotice(`❌ ${error.message}`)
    }
  })

  // Update doctor mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDoctorDto }) => 
      updateDoctor(token as string, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setShowEditModal(false)
      setSelectedDoctor(null)
      resetForm()
      setNotice('✅ Doctor updated successfully')
    },
    onError: (error: any) => {
      setNotice(`❌ ${error.message}`)
    }
  })

  // Delete doctor mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDoctor(token as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setShowDeleteModal(false)
      setSelectedDoctor(null)
      setNotice('✅ Doctor deleted successfully')
    },
    onError: (error: any) => {
      setNotice(`❌ ${error.message}`)
    }
  })

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      specialisation: '',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '17:00' },
      slotDuration: 30
    })
  }

  const handleCreate = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.specialisation) {
      setNotice('❌ Please fill in all required fields')
      return
    }
    if (formData.workingDays.length === 0) {
      setNotice('❌ Please select at least one working day')
      return
    }
    createMutation.mutate(formData)
  }

  const handleEdit = (doctor: any) => {
    setSelectedDoctor(doctor)
    setFormData({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialisation: doctor.specialisation,
      workingDays: doctor.workingDays,
      workingHours: doctor.workingHours,
      slotDuration: doctor.slotDuration
    })
    setShowEditModal(true)
  }

  const handleUpdate = () => {
    if (!formData.firstName || !formData.lastName || !formData.specialisation) {
      setNotice('❌ Please fill in all required fields')
      return
    }
    if (formData.workingDays.length === 0) {
      setNotice('❌ Please select at least one working day')
      return
    }
    updateMutation.mutate({ id: selectedDoctor.id, dto: formData })
  }

  const handleDelete = (doctor: any) => {
    setSelectedDoctor(doctor)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (selectedDoctor) {
      deleteMutation.mutate(selectedDoctor.id)
    }
  }

  const handleViewStats = (doctor: any) => {
    setSelectedDoctor(doctor)
    setShowStatsModal(true)
  }

  const toggleWorkingDay = (day: number) => {
    setFormData((prev: any) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d: number) => d !== day)
        : [...prev.workingDays, day].sort()
    }))
  }

  // Filter doctors based on search
  const filteredDoctors = doctors?.filter((doctor: any) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      doctor.firstName.toLowerCase().includes(searchLower) ||
      doctor.lastName.toLowerCase().includes(searchLower) ||
      doctor.specialisation.toLowerCase().includes(searchLower) ||
      doctor.user.email.toLowerCase().includes(searchLower)
    )
  })

  return (
    <>
      <Heading 
        title="Doctor Management" 
        subtitle="Manage doctor accounts, schedules, and availability."
        action={
          <button className="primary-button" onClick={() => { resetForm(); setShowCreateModal(true) }}>
            <Plus size={17}/> Add doctor
          </button>
        }
      />

      {/* Search Bar */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={18} style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search by name, specialization, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              fontSize: 14,
              color: 'var(--foreground)',
              outline: 'none'
            }}
          />
        </div>
      </Card>

      {/* Doctors Table */}
      <Card style={{ marginTop: 20 }}>
        <div className="card-heading">
          <div>
            <h2>All Doctors</h2>
            <p className="muted">{filteredDoctors?.length || 0} doctors registered</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            Loading doctors...
          </div>
        ) : filteredDoctors?.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            {searchQuery ? 'No doctors found matching your search.' : 'No doctors yet. Create your first doctor account.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    DOCTOR
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SPECIALISATION
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    WORKING DAYS
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    HOURS
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    APPOINTMENTS
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors?.map((doctor: any) => (
                  <tr key={doctor.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '15px 8px' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: 2 }}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </strong>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {doctor.user.email}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '15px 8px', color: 'var(--foreground)' }}>
                      {doctor.specialisation}
                    </td>
                    <td style={{ padding: '15px 8px', fontSize: 12, color: 'var(--muted)' }}>
                      {doctor.workingDays.map((day: number) => DAYS_OF_WEEK[day].short).join(', ')}
                    </td>
                    <td style={{ padding: '15px 8px', fontSize: 12, color: 'var(--muted)' }}>
                      {doctor.workingHours.start} - {doctor.workingHours.end}
                      <br />
                      <span style={{ fontSize: 11 }}>{doctor.slotDuration} min slots</span>
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      <button
                        onClick={() => handleViewStats(doctor)}
                        className="outline-button"
                        style={{ fontSize: 12, padding: '4px 8px' }}
                      >
                        {doctor._count.appointments} total
                      </button>
                    </td>
                    <td style={{ padding: '15px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(doctor)}
                          className="outline-button"
                          style={{ padding: '6px 10px' }}
                          title="Edit doctor"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor)}
                          className="outline-button"
                          style={{ padding: '6px 10px', color: 'var(--coral)' }}
                          title="Delete doctor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Doctor Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Doctor" size="large">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Email <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="doctor@example.com"
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Password <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Temporary password"
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              First Name <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Last Name <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Smith"
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Specialisation <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <select
              value={formData.specialisation}
              onChange={(e) => setFormData({ ...formData, specialisation: e.target.value })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            >
              <option value="">Select specialisation</option>
              {COMMON_SPECIALISATIONS.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
              Working Days <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWorkingDay(day.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: formData.workingDays.includes(day.value) ? 'var(--primary)' : 'var(--surface)',
                    color: formData.workingDays.includes(day.value) ? '#fff' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Start Time <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="time"
              value={formData.workingHours.start}
              onChange={(e) => setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              End Time <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="time"
              value={formData.workingHours.end}
              onChange={(e) => setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Slot Duration (minutes) <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <select
              value={formData.slotDuration}
              onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button className="text-button" onClick={() => setShowCreateModal(false)}>
            Cancel
          </button>
          <button 
            className="primary-button" 
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            <Check size={16} />
            {createMutation.isPending ? 'Creating...' : 'Create Doctor'}
          </button>
        </div>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Doctor" size="large">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              First Name <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Last Name <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Specialisation <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <select
              value={formData.specialisation}
              onChange={(e) => setFormData({ ...formData, specialisation: e.target.value })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            >
              {COMMON_SPECIALISATIONS.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
              Working Days <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWorkingDay(day.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: formData.workingDays.includes(day.value) ? 'var(--primary)' : 'var(--surface)',
                    color: formData.workingDays.includes(day.value) ? '#fff' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Start Time <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="time"
              value={formData.workingHours.start}
              onChange={(e) => setFormData({ ...formData, workingHours: { ...formData.workingHours, start: e.target.value } })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              End Time <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <input
              type="time"
              value={formData.workingHours.end}
              onChange={(e) => setFormData({ ...formData, workingHours: { ...formData.workingHours, end: e.target.value } })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Slot Duration (minutes) <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <select
              value={formData.slotDuration}
              onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button className="text-button" onClick={() => setShowEditModal(false)}>
            Cancel
          </button>
          <button 
            className="primary-button" 
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            <Check size={16} />
            {updateMutation.isPending ? 'Updating...' : 'Update Doctor'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Doctor">
        <div style={{ marginBottom: 20 }}>
          <p style={{ marginBottom: 12 }}>
            Are you sure you want to delete <strong>Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</strong>?
          </p>
          <div style={{ background: 'var(--coral)', opacity: 0.1, padding: 12, borderRadius: 8, border: '1px solid var(--coral)' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--foreground)' }}>
              ⚠️ This action cannot be undone. The doctor account and profile will be permanently deleted. 
              This will fail if the doctor has any upcoming appointments.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="text-button" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </button>
          <button 
            className="primary-button" 
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
            style={{ background: 'var(--coral)' }}
          >
            <Trash2 size={16} />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Doctor'}
          </button>
        </div>
      </Modal>

      {/* Statistics Modal */}
      <Modal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="Doctor Statistics" size="large">
        {stats ? (
          <div>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, marginBottom: 4 }}>
                Dr. {stats.doctorName}
              </h3>
              <p className="muted" style={{ margin: 0 }}>{stats.specialisation}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Calendar size={18} style={{ color: 'var(--primary)' }} />
                  <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Appointments
                  </span>
                </div>
                <strong style={{ fontSize: 28 }}>{stats.totalAppointments}</strong>
              </div>

              <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Check size={18} style={{ color: 'var(--primary)' }} />
                  <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Completed
                  </span>
                </div>
                <strong style={{ fontSize: 28 }}>{stats.completedAppointments}</strong>
              </div>

              <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                  <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Upcoming
                  </span>
                </div>
                <strong style={{ fontSize: 28 }}>{stats.upcomingAppointments}</strong>
              </div>

              <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Clock size={18} style={{ color: 'var(--primary)' }} />
                  <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Today
                  </span>
                </div>
                <strong style={{ fontSize: 28 }}>{stats.todayAppointments}</strong>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, background: 'var(--mint)', borderRadius: 8, border: '1px solid #b8d8d1' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--foreground)' }}>
                <strong>Leave Days:</strong> {stats.totalLeaves} scheduled
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            Loading statistics...
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="primary-button" onClick={() => setShowStatsModal(false)}>
            Close
          </button>
        </div>
      </Modal>
    </>
  )
}
