'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDoctors, fetchDoctorSlots, bookHold } from '@/lib/api'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from './auth-provider'
import { useToast } from '@/hooks/use-toast'

function Status({ children, tone = '' }: any) { return <span className={`status status-${tone}`}><span className="status-dot" />{children}</span> }
function Avatar({ initials, tone = 'teal' }: any) { return <div className={`avatar avatar-${tone}`}>{initials}</div> }
function Card({ children, className = '' }: any) { return <section className={`surface ${className}`}>{children}</section> }

export function DoctorsView({ active }: { active: string }) {
  const { data: doctors, isLoading, error } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors })
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  if (isLoading) return <div>Loading doctors...</div>
  if (error) return <div>Failed to load doctors: {error.message}</div>
  
  if (selectedDoc) {
    return <BookingView doctor={selectedDoc} onBack={() => setSelectedDoc(null)} />
  }

  // Get unique specialties
  const specialties = Array.from(new Set(doctors?.map((d: any) => d.specialisation).filter(Boolean))) as string[]
  
  // Filter doctors by specialty and search
  const filteredDoctors = doctors?.filter((d: any) => {
    const matchesSpecialty = specialtyFilter === 'all' || d.specialisation === specialtyFilter
    const matchesSearch = searchQuery === '' || 
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialisation?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSpecialty && matchesSearch
  })

  return (
    <>
      <div className="page-heading">
        <div><h1>{active === 'Doctors' ? 'Doctors' : 'Find a doctor'}</h1><p className="muted">Browse care teams, specialties, and availability.</p></div>
      </div>

      {/* Search and Filter Bar */}
      <div className="doctors-filter-bar">
        <input
          type="text"
          placeholder="Search by name or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        <div className="filter-group">
          <label>Specialty</label>
          <select 
            className="modal-select" 
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="all">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredDoctors?.length === 0 ? (
        <Card>
          <p className="muted" style={{textAlign: 'center', padding: 40}}>
            No doctors found matching your criteria. Try adjusting your filters.
          </p>
        </Card>
      ) : (
        <div className="doctor-list-grid">
          {filteredDoctors?.map((d: any) => {
            const name = `Dr. ${d.firstName} ${d.lastName}`
            const initials = `${d.firstName[0]}${d.lastName[0]}`
            
            return (
              <Card key={d.id} className="doctor-card">
                <div className="card-heading">
                  <Avatar initials={initials} tone="teal"/>
                  <Status tone="success">Available</Status>
                </div>
                <h3 style={{margin: '12px 0 4px', fontSize: 16}}>{name}</h3>
                <p className="muted" style={{fontSize: 13}}>{d.specialisation}</p>
                
                <button className="outline-button" style={{marginTop: 16, width: '100%'}} onClick={() => setSelectedDoc(d)}>
                  Book Appointment <ChevronRight size={15}/>
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

function BookingView({ doctor, onBack }: { doctor: any, onBack: () => void }) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [symptoms, setSymptoms] = useState('')
  const [booking, setBooking] = useState(false)
  
  const { data: slots, isLoading } = useQuery({ 
    queryKey: ['slots', doctor.id, selectedDate], 
    queryFn: () => fetchDoctorSlots(doctor.id, selectedDate),
    enabled: !!selectedDate
  })
  
  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })
  
  const handleBook = async (slot: any) => {
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please login first to book an appointment',
        variant: 'destructive'
      })
      return
    }
    
    if (!symptoms.trim()) {
      toast({
        title: 'Symptoms Required',
        description: 'Please describe your symptoms before booking',
        variant: 'destructive'
      })
      return
    }
    
    setBooking(true)
    try {
      await bookHold(token, {
        doctorId: doctor.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        symptoms
      })
      
      // Invalidate queries to refresh dashboard and records
      await queryClient.invalidateQueries({ queryKey: ['appointments'] })
      await queryClient.invalidateQueries({ queryKey: ['slots'] })
      await queryClient.invalidateQueries({ queryKey: ['adminMetrics'] })
      
      toast({
        title: 'Success!',
        description: 'Appointment booked successfully! AI is processing your summary.'
      })
      onBack()
    } catch (e: any) {
      toast({
        title: 'Booking Failed',
        description: e.message || 'Failed to book appointment',
        variant: 'destructive'
      })
    } finally {
      setBooking(false)
    }
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="booking-container">
      <button onClick={onBack} className="text-button" style={{marginBottom: 12}}>← Back to doctors</button>
      
      <Card style={{padding: 20}}>
        <div className="booking-header">
          <div>
            <h2 style={{margin: 0, fontSize: 20}}>Dr. {doctor.firstName} {doctor.lastName}</h2>
            <p className="muted" style={{margin: '4px 0 0', fontSize: 13}}>{doctor.specialisation}</p>
          </div>
          <Status tone="success">Available</Status>
        </div>
      </Card>

      <Card style={{marginTop: 0, padding: 20}}>
        {/* Date Selection */}
        <div>
          <label style={{display: 'block', marginBottom: 10, fontWeight: 600, fontSize: 13}}>
            Select Date
          </label>
          <div className="date-selector">
            {availableDates.slice(0, 7).map(date => (
              <button
                key={date}
                className={`date-option ${selectedDate === date ? 'active' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="date-day">{formatDateDisplay(date)}</span>
                <span className="date-number">{new Date(date).getDate()}</span>
              </button>
            ))}
          </div>
          
          {/* Alternative: Dropdown for more dates */}
          <div style={{marginTop: 10}}>
            <select 
              className="modal-select" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {formatDateDisplay(date)} - {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Symptoms Input */}
        <div style={{marginTop: 20}}>
          <label style={{display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13}}>
            Chief Complaint / Symptoms <span style={{color: 'var(--coral)'}}>*</span>
          </label>
          <textarea 
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms in detail. Our AI will prepare a clinical summary for the doctor..."
            className="modal-textarea"
            rows={3}
            style={{width: '100%', fontSize: 13}}
          />
          <p className="muted" style={{fontSize: 11, marginTop: 4}}>
            This helps the doctor prepare for your visit and saves time during the appointment.
          </p>
        </div>

        {/* Available Slots */}
        <div style={{marginTop: 20}}>
          <h3 style={{margin: '0 0 10px', fontSize: 15}}>
            Available Time Slots
          </h3>
          {isLoading ? (
            <div style={{padding: 16, textAlign: 'center'}}>
              <p className="muted">Loading available slots...</p>
            </div>
          ) : slots?.length === 0 ? (
            <div style={{padding: 16, textAlign: 'center', background: 'var(--mint)', borderRadius: 8}}>
              <p className="muted">No slots available on this date. Try another date.</p>
            </div>
          ) : (
            <div className="slots-grid">
              {slots?.map((slot: any) => (
                <button 
                  key={slot.startTime} 
                  onClick={() => handleBook(slot)}
                  disabled={booking || !symptoms.trim()}
                  className="slot-button"
                >
                  {new Date(slot.startTime).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {booking && (
          <div style={{marginTop: 12, padding: 10, background: 'var(--mint)', borderRadius: 8, textAlign: 'center'}}>
            <p style={{margin: 0, color: 'var(--primary)', fontWeight: 600, fontSize: 13}}>
              Booking your appointment...
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
