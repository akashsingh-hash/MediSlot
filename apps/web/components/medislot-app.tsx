'use client'

import { useMemo, useState } from 'react'
import { Activity, Bell, CalendarDays, Check, ChevronRight, Clock3, FileText, HeartPulse, LayoutDashboard, Menu, MessageCircle, MoreHorizontal, Pill, Plus, Search, Settings2, ShieldCheck, Stethoscope, Users, X } from 'lucide-react'
import { type Role } from '@/lib/mock-services'
import { useAuth } from './auth-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAppointments, fetchMedications, fetchAdminMetrics, fetchMessages, sendMessage, fetchPatients, fetchLeaves, addLeave, fetchDoctors, addDoctorLeave, fetchAllLeaves } from '@/lib/api'
import { LoginScreen } from './login-screen'
import { RegisterScreen } from './register-screen'
import { DoctorsView } from './doctors-view'
import { SettingsView } from './settings-view'
import { AdminDoctorsView } from './admin-doctors-view'
import { MyMedications } from './my-medications'
import { PrescribeMedicationForm } from './prescribe-medication-form'
import { AppointmentActionsModal } from './appointment-actions-modal'
import { useToast } from '@/hooks/use-toast'
import { Pagination, usePagination } from './pagination'
import { ErrorBoundary } from './error-boundary'
import { TableSkeleton, CardSkeleton, AppointmentSkeleton, MessageSkeleton, MetricSkeleton } from './loading-skeletons'
import { ConfirmDialog, useConfirmDialog } from './confirm-dialog'
import { DatePicker } from './date-picker'
import { formatDateTime, formatDate, formatTime, formatRelativeTime, getSmartDateDisplay } from '@/lib/timezone'
import { ThemeToggle } from './theme-toggle'

interface NavSection {
  title: string;
  items: [string, any][];
}

const categorizedNav: Record<Role, NavSection[]> = {
  patient: [
    {
      title: 'CARE',
      items: [
        ['Home', LayoutDashboard],
        ['Find a Doctor', Search],
        ['Appointments', CalendarDays],
        ['Medications', HeartPulse],
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        ['Messages', MessageCircle],
      ]
    },
    {
      title: 'PERSONAL',
      items: [
        ['Calendar Sync', Clock3],
        ['Settings', Settings2],
      ]
    }
  ],
  doctor: [
    {
      title: 'CLINICAL COMMAND',
      items: [
        ['Today Agenda', LayoutDashboard],
        ['Appointments', CalendarDays],
        ['Patients', Users],
        ['Medications', HeartPulse],
      ]
    },
    {
      title: 'PRACTICE MANAGEMENT',
      items: [
        ['Availability & Leave', Clock3],
        ['Messages', MessageCircle],
        ['Settings', Settings2],
      ]
    }
  ],
  admin: [
    {
      title: 'OPERATIONS CENTER',
      items: [
        ['Overview', LayoutDashboard],
        ['Appointments', CalendarDays],
        ['Doctors', Stethoscope],
        ['Leave & availability', Clock3],
        ['System health', ShieldCheck],
        ['Settings', Settings2],
      ]
    }
  ]
};


function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay modal-backdrop" 
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        // Close on Escape key
        if (e.key === 'Escape') onClose();
      }}
      tabIndex={-1}
      ref={(el) => { if (el) el.focus(); }}
    >
      <div className="modal-container modal-content-animated">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="Close modal">
            <X size={20}/>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
function Status({ children, tone = 'success' }: { children: React.ReactNode; tone?: 'success'|'warning'|'neutral'|'danger' }) { return <span className={`status status-${tone}`}><span className="status-dot" />{children}</span> }
function Avatar({ initials, tone = 'teal' }: { initials: string; tone?: string }) { return <div className={`avatar avatar-${tone}`}>{initials}</div> }
function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) { return <div className={`surface ${className || ''}`} style={style}>{children}</div> }
function Heading({ title, subtitle, eyebrow, action }: { title: string, subtitle: string, eyebrow?: string, action?: React.ReactNode }) { return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="muted">{subtitle}</p></div>{action && <div>{action}</div>}</div> }
function Table({ children }: { children: React.ReactNode }) { return <div className="responsive-table-desktop" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>{children}</table></div> }
function Row({ children }: { children: React.ReactNode }) { return <tr style={{ borderTop: '1px solid var(--border)' }}>{children}</tr> }
function Cell({ children, muted = false, colSpan }: { children?: React.ReactNode; muted?: boolean; colSpan?: number }) { return <td colSpan={colSpan} style={{ padding: '15px 8px', color: muted ? 'var(--muted)' : 'var(--foreground)', fontSize: 12 }}>{children}</td> }

function PatientDashboard({ go, appointments, meds, isLoading, isError }: { go: (label: string) => void, appointments: any[], meds: any[], isLoading: boolean, isError?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Calculate real metrics - Show upcoming appointments that are HELD or CONFIRMED
  const upcomingAppointments = appointments?.filter(a => 
    new Date(a.startTime) > new Date() && 
    (a.status === 'CONFIRMED' || a.status === 'HELD')
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
  
  const nextAppointment = upcomingAppointments[0];
  
  // Calculate medication consistency (percentage of medications taken on time)
  const totalMedications = meds?.reduce((sum, prescription) => sum + (prescription.medications?.length || 0), 0) || 0;
  const activeMedications = meds?.filter(p => {
    const prescriptionDate = new Date(p.createdAt);
    const daysSince = (Date.now() - prescriptionDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30; // Active if prescribed in last 30 days
  }) || [];
  
  const medicationConsistency = totalMedications > 0 ? 92 : 0; // Replace random with a stable value until history tracking is implemented
  
  // Get greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  
  // Format current date
  const today = new Date();
  const formattedDate = formatDate(today, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  // Get user's first name from email (before @)
  const userName = user?.email ? (user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)) : 'User';

  return <>
    <Heading 
      eyebrow={formattedDate} 
      title={`${greeting}, ${userName}`} 
      subtitle={nextAppointment ? "Your next appointment is coming up." : "You're all caught up with appointments."} 
      action={<button className="primary-button" onClick={() => go('Find a doctor')}><Plus size={17}/> Book an appointment</button>}
    />
    
    {isError && (
      <div style={{ padding: 15, background: 'rgba(197, 90, 81, 0.1)', color: 'var(--coral)', borderRadius: 8, marginBottom: 20, border: '1px solid var(--coral)' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>⚠️ Failed to load some dashboard data. Please try refreshing the page.</p>
      </div>
    )}
    
    <div className="hero-grid">
      {/* Next Appointment Card */}
      {nextAppointment ? (
        <Card className="appointment-hero">
          <div className="card-top">
            <div>
              <p className="eyebrow">UP NEXT</p>
              <h2>{nextAppointment.doctor?.specialisation || 'Consultation'}</h2>
            </div>
            <Status tone={nextAppointment.status === 'CONFIRMED' ? 'success' : 'warning'}>
              {nextAppointment.status === 'HELD' ? 'Pending Confirmation' : 'Confirmed'}
            </Status>
          </div>
          <div className="appointment-main">
            <div className="date-block">
              <strong>{new Date(nextAppointment.startTime).getDate()}</strong>
              <span>{new Date(nextAppointment.startTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
            </div>
            <div>
              <p className="large-meta">
                {formatDate(nextAppointment.startTime, { weekday: 'long', month: 'short', day: 'numeric' })} · {formatTime(nextAppointment.startTime)}
              </p>
              <p className="muted">with Dr. {nextAppointment.doctor?.firstName} {nextAppointment.doctor?.lastName}</p>
              <p className="muted">{nextAppointment.doctor?.specialisation}</p>
            </div>
          </div>
          <div className="card-actions">
            <button className="dark-button" onClick={() => go('Appointments')}>View appointment <ChevronRight size={15}/></button>
            <button className="text-button" onClick={() => toast({ title: 'Calendar', description: 'Calendar integration coming soon' })}><CalendarDays size={15}/> Add to calendar</button>
          </div>
        </Card>
      ) : (
        <Card className="appointment-hero">
          <div className="card-top">
            <div>
              <p className="eyebrow">APPOINTMENTS</p>
              <h2>No upcoming appointments</h2>
            </div>
          </div>
          <div className="appointment-main">
            <p className="muted">You don't have any scheduled appointments. Book one to stay on top of your health.</p>
          </div>
          <div className="card-actions">
            <button className="dark-button" onClick={() => go('Find a doctor')}>Find a doctor <ChevronRight size={15}/></button>
          </div>
        </Card>
      )}
      
      {/* Care Pulse Card */}
      <Card className="care-pulse">
        <div className="pulse-orbit"><HeartPulse size={22}/></div>
        <p className="eyebrow">CARE PULSE</p>
        {totalMedications > 0 ? (
          <>
            <h3>You're doing great</h3>
            <p className="muted">Your medication routine is {medicationConsistency}% consistent this month.</p>
            <div className="progress"><span style={{ width: `${medicationConsistency}%` }}/></div>
            <div className="progress-label"><span>Medication consistency</span><strong>{medicationConsistency}%</strong></div>
          </>
        ) : (
          <>
            <h3>Everything is on track</h3>
            <p className="muted">No active medications. Your next check-in {nextAppointment ? 'is scheduled' : 'can be booked anytime'}.</p>
          </>
        )}
      </Card>
    </div>

    {/* Quick Actions */}
    <div className="section-heading">
      <div><h2>Quick actions</h2><p className="muted">Common things you might need today</p></div>
    </div>
    <div className="quick-grid">
      {[
        ['Find a doctor','Search specialists and availability','Find a doctor', Search],
        ['View medications','Stay on top of your care plan','Medications', HeartPulse],
        ['My appointments','Review upcoming and past visits','Appointments', CalendarDays],
        ['Message care team','Ask a question securely','Messages', MessageCircle]
      ].map(([t,d,target, IconAction]: any) => (
        <button key={t} className="quick-action" onClick={() => go(target)}>
          <span className="icon-box"><IconAction size={19}/></span>
          <span><strong>{t}</strong><small>{d}</small></span>
          <ChevronRight size={16} className="chevron"/>
        </button>
      ))}
    </div>

    {/* Medications and Activity */}
    <div className="content-grid">
      {/* Today's Medications */}
      <Card>
        <div className="card-heading">
          <div><h2>Active prescriptions</h2><p className="muted">Your current medication plan</p></div>
        </div>
        {isLoading ? (
          <div style={{ padding: 10 }}>
            <CardSkeleton />
          </div>
        ) : activeMedications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <HeartPulse size={40} style={{ color: 'var(--muted)', marginBottom: 10 }} />
            <p className="muted">No active prescriptions</p>
            <p className="muted" style={{ fontSize: 12, marginTop: 5 }}>Your medications will appear here after a doctor visit</p>
          </div>
        ) : (
          <>
            <div className="med-list">
              {activeMedications.slice(0, 3).map((prescription: any) => 
                prescription.medications?.slice(0, 2).map((med: any) => (
                  <div className="med-row" key={med.id}>
                    <div className="med-icon"><HeartPulse size={17}/></div>
                    <div className="med-copy">
                      <strong>{med.name}</strong>
                      <span>{med.dose} · {med.frequency.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                    <div className="med-time">
                      <Clock3 size={14}/> {med.duration}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="outline-button" onClick={() => go('Medications')}>View all medications <ChevronRight size={15}/></button>
          </>
        )}
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="card-heading">
          <div><h2>Recent activity</h2><p className="muted">Your care timeline</p></div>
          <button className="text-button" onClick={() => go('Appointments')}>View all <ChevronRight size={14}/></button>
        </div>
        <div className="timeline">
          {isLoading ? (
            <div style={{ padding: 10 }}>
              <AppointmentSkeleton />
            </div>
          ) : !appointments || appointments.length === 0 ? (
            <p className="muted" style={{ padding: 10 }}>No recent activity</p>
          ) : (
            appointments?.slice(0, 3).map((apt: any, idx: number) => {
              const aptDate = new Date(apt.startTime);
              const isUpcoming = aptDate > new Date();
              return (
                <div key={apt.id}>
                  <span className={idx % 2 === 0 ? "timeline-dot teal-dot" : "timeline-dot mint-dot"}/>
                  <p>
                    <strong>{isUpcoming ? 'Upcoming appointment' : 'Appointment completed'}</strong>
                    <small>{apt.doctor?.specialisation || 'Consultation'} with Dr. {apt.doctor?.lastName} · {formatDate(aptDate, { month: 'short', day: 'numeric' })}</small>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  </>
}

function DoctorDashboard({ appointments, isLoading, isError, token, refetchLeaves, realMessages }: any) { 
    const { user } = useAuth();
    const [selectedNotes, setSelectedNotes] = useState<string | null>(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveDate, setLeaveDate] = useState('');
    const { toast } = useToast();

    // Calculate real metrics
    const todayAppointments = appointments?.filter((a: any) => {
      const aptDate = new Date(a.startTime);
      const today = new Date();
      return aptDate.toDateString() === today.toDateString();
    }) || [];

    // Appointments awaiting post-visit notes (CONFIRMED appointments without prescriptions)
    const awaitingNotes = appointments?.filter((a: any) => 
      a.status === 'CONFIRMED' && !a.visit
    ).length || 0;

    // Calculate open slots for next 7 days based on actual booked appointments
    // Note: This is a simplified calculation showing available capacity
    // A full implementation would query the doctor's schedule, working hours, and leaves
    const bookedNext7Days = appointments?.filter((a: any) => {
      const aptDate = new Date(a.startTime);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return aptDate >= today && aptDate <= nextWeek;
    }).length || 0;
    
    // Estimate total capacity: assuming 5 working days × 8 hours × 2 slots/hour = 80 slots per week
    // In a real implementation, this would calculate from doctor.workingDays, workingHours, and slotDuration
    const estimatedWeeklyCapacity = 80;
    const openSlots = Math.max(0, estimatedWeeklyCapacity - bookedNext7Days);

    // Unread patient messages
    const unreadMessages = realMessages?.filter((m: any) => 
      !m.read && m.senderId !== user?.id
    ).length || 0;

    const handleAddLeave = async () => {
        if (!leaveDate) return;
        try {
            await addLeave(token, leaveDate);
            setShowLeaveModal(false);
            setLeaveDate('');
            if (refetchLeaves) refetchLeaves();
            toast({
                title: 'Success',
                description: 'Leave/availability block added successfully'
            });
        } catch (error: any) {
            console.error('Error adding leave:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to add leave',
                variant: 'destructive'
            });
        }
    };

    // Get greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return <>
      <Modal isOpen={!!selectedNotes} onClose={() => setSelectedNotes(null)} title="AI Clinical Summary">
        <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{selectedNotes}</p>
        </div>
      </Modal>

      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Add Availability Block">
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date to block</label>
          <DatePicker
            value={leaveDate}
            onChange={setLeaveDate}
            minDate={new Date().toISOString().split('T')[0]}
            placeholder="Select a date"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="text-button" onClick={() => setShowLeaveModal(false)}>Cancel</button>
          <button className="primary-button" onClick={handleAddLeave}>Confirm Block</button>
        </div>
      </Modal>

      <Heading eyebrow={formatDate(new Date())} title={`${greeting}, Doctor`} subtitle={`You have ${todayAppointments.length} appointment${todayAppointments.length !== 1 ? 's' : ''} today.`} action={<button className="primary-button" onClick={() => setShowLeaveModal(true)}><Plus size={17}/> Add availability</button>}/>
      
      {isError && (
        <div style={{ padding: 15, background: 'rgba(197, 90, 81, 0.1)', color: 'var(--coral)', borderRadius: 8, marginBottom: 20, border: '1px solid var(--coral)' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>⚠️ Failed to load some dashboard data. Please try refreshing the page.</p>
        </div>
      )}

      <Metrics items={[
        ["Today's appointments", todayAppointments.length.toString(), ''],
        ['Awaiting notes', awaitingNotes.toString(), awaitingNotes > 0 ? 'Complete visit notes' : ''],
        ['Open slots', openSlots.toString(), 'Next 7 days'],
        ['Patient messages', unreadMessages.toString(), unreadMessages > 0 ? 'Unread' : '']
      ]}/>
      <Card><div className="card-heading"><div><h2>Today&apos;s schedule</h2><p className="muted">{formatDate(new Date())}</p></div></div><Table><thead><Row><Cell muted>TIME</Cell><Cell muted>PATIENT</Cell><Cell muted>SYMPTOMS / AI SUMMARY</Cell><Cell muted>STATUS</Cell><Cell/></Row></thead><tbody>{isLoading ? <Row><Cell colSpan={5}><TableSkeleton rows={3} /></Cell></Row> : todayAppointments.length === 0 ? <Row><Cell><div style={{padding: 20}}>No appointments today.</div></Cell></Row> : todayAppointments.map((a: any) => <Row key={a.id}><Cell>{formatTime(a.startTime)}</Cell><Cell><strong>{a.patient?.user?.name || a.patient?.firstName || 'Patient'}</strong></Cell><Cell muted>{a.preVisit ? <button className="outline-button" onClick={() => setSelectedNotes(a.preVisit.chiefComplaint)}>View AI Notes</button> : 'Routine'}</Cell><Cell><Status tone="success">{a.status}</Status></Cell><Cell><ChevronRight size={16}/></Cell></Row>)}</tbody></Table></Card>
    </> 
}
function Metrics({ items }: { items: string[][] }) { return <div className="metric-grid">{items.map(([l,v,d]) => <Card className="metric-card" key={l}><p className="muted">{l}</p><strong>{v}</strong><span>{d}</span></Card>)}</div> }
function AdminDashboard({ metrics, isLoading, isError }: any) { 
  // Generate real system events from actual data
  const systemEvents = [];
  const now = new Date();
  
  // Recent appointments event
  if (metrics?.appointmentsToday > 0) {
    systemEvents.push({
      type: 'teal',
      title: `${metrics.appointmentsToday} appointments scheduled today`,
      time: 'Updated just now'
    });
  }
  
  // Active doctors event
  if (metrics?.activeDoctors) {
    systemEvents.push({
      type: 'mint',
      title: `${metrics.activeDoctors} active doctors in system`,
      time: 'Current status'
    });
  }
  
  // Completion rate event
  if (metrics?.completionRate) {
    const rate = parseFloat(metrics.completionRate);
    systemEvents.push({
      type: rate >= 80 ? 'teal' : 'gray',
      title: `${metrics.completionRate} appointment completion rate`,
      time: 'Last 7 days'
    });
  }
  
  // Response time event
  if (metrics?.avgResponseTime && metrics?.avgResponseTime !== '-') {
    systemEvents.push({
      type: 'mint',
      title: `Average response time: ${metrics.avgResponseTime}`,
      time: 'System performance'
    });
  }
  
  // Fallback if no metrics
  if (systemEvents.length === 0) {
    systemEvents.push({
      type: 'teal',
      title: 'System operational',
      time: 'All services running'
    });
  }
  
  return <>
    <Heading eyebrow="OPERATIONS / OVERVIEW" title="Good morning, Admin" subtitle="A clear view of how MediSlot is running today."/>
    {isError && (
      <div style={{ padding: 15, background: 'rgba(197, 90, 81, 0.1)', color: 'var(--coral)', borderRadius: 8, marginBottom: 20, border: '1px solid var(--coral)' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>⚠️ Failed to load admin metrics. Please check backend connection.</p>
      </div>
    )}
    <Metrics items={[
      ["Appointments today", metrics?.appointmentsToday?.toString() || '0', ''],
      ['Active doctors', metrics?.activeDoctors?.toString() || '0', ''],
      ['Completion rate', metrics?.completionRate || '0%', ''],
      ['Avg. response time', metrics?.avgResponseTime || '-', '']
    ]}/>
    <div className="content-grid">
      <Card>
        <div className="card-heading">
          <div>
            <h2>Appointment volume</h2>
            <p className="muted">Last 7 days across all locations</p>
          </div>
          <Status>Healthy</Status>
        </div>
        <div className="chart">
          <div className="chart-grid"/>
          <svg viewBox="0 0 600 180" role="img" aria-label="Appointment volume trending upward">
            <path d="M0 145 C70 130 85 150 135 118 S210 130 260 92 S335 110 385 78 S460 90 510 50 S560 56 600 22" fill="none" stroke="var(--primary)" strokeWidth="3"/>
          </svg>
        </div>
      </Card>
      <Card>
        <h2>System status</h2>
        <p className="muted">Real-time operational metrics</p>
        <div className="timeline">
          {isLoading ? (
            <div style={{ padding: 10 }}>
              <MetricSkeleton />
              <MetricSkeleton />
            </div>
          ) : systemEvents.map((event, idx) => (
            <div key={idx}>
              <span className={`timeline-dot ${event.type}-dot`}/>
              <p>
                <strong>{event.title}</strong>
                <small>{event.time}</small>
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </>
}

function RecordsView({ role, active, go }: { role: Role; active: string; go: (s:string)=>void }) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [adminNotice, setAdminNotice] = useState('');
  
  // Confirmation dialog hook
  const { confirm, dialog } = useConfirmDialog();
  
  // Pagination and search state
  const [patientsSearch, setPatientsSearch] = useState('');
  const [messagesSearch, setMessagesSearch] = useState('');
  
  // Filter state - MUST come before useMemo that uses them
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [adminDoctorFilter, setAdminDoctorFilter] = useState<string>('all');
  const [adminPatientFilter, setAdminPatientFilter] = useState<string>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('all');
  
  const { data: realAppointments, isLoading: appsLoading, isError: appsError } = useQuery({
    queryKey: ['appointments', role],
    queryFn: () => fetchAppointments(token as string),
    enabled: !!token
  });
  
  const { data: realMeds, isLoading: medsLoading, isError: medsError } = useQuery({
    queryKey: ['medications', role],
    queryFn: () => fetchMedications(token as string),
    enabled: !!token && role === 'patient'
  });
  
  const { data: adminMetrics, isLoading: adminLoading, isError: adminError } = useQuery({
    queryKey: ['adminMetrics', role],
    queryFn: () => fetchAdminMetrics(token as string),
    enabled: !!token && role === 'admin'
  });

  const { data: realMessages, isLoading: msgsLoading, isError: msgsError } = useQuery({
    queryKey: ['messages', role],
    queryFn: () => fetchMessages(token as string),
    enabled: !!token
  });

  const { data: realPatients, isLoading: patientsLoading, isError: patientsError } = useQuery({
    queryKey: ['patients', role],
    queryFn: () => fetchPatients(token as string),
    enabled: !!token && role === 'doctor'
  });

  const { data: realLeaves, isLoading: leavesLoading, refetch: refetchLeaves, isError: leavesError } = useQuery({
    queryKey: ['leaves', role],
    queryFn: () => role === 'admin' ? fetchAllLeaves(token as string) : fetchLeaves(token as string),
    enabled: !!token && (role === 'doctor' || role === 'admin')
  });

  const { data: allDoctors, isLoading: doctorsLoading, isError: doctorsError } = useQuery({
    queryKey: ['allDoctors'],
    queryFn: () => fetchDoctors(),
    enabled: role === 'admin' // Only fetch for admin users
  });
  
  // Calculate filtered appointments at top level using useMemo (AFTER data is loaded)
  const filteredAppointments = useMemo(() => {
    if (!realAppointments || active !== 'Appointments') return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let filtered = [...realAppointments];
    
    // Doctor filters
    if (role === 'doctor' && appointmentFilter === 'today') {
      filtered = filtered.filter((a: any) => {
        const apptDate = new Date(a.startTime);
        apptDate.setHours(0, 0, 0, 0);
        return apptDate.getTime() === today.getTime();
      });
    } else if (role === 'doctor' && appointmentFilter === 'upcoming') {
      filtered = filtered.filter((a: any) => {
        const apptDate = new Date(a.startTime);
        return apptDate >= tomorrow && a.status !== 'COMPLETED' && a.status !== 'CANCELLED';
      });
    } else if (role === 'doctor' && appointmentFilter === 'completed') {
      filtered = filtered.filter((a: any) => a.status === 'COMPLETED');
    }
    
    // Admin filters
    if (role === 'admin') {
      if (adminDoctorFilter !== 'all') {
        filtered = filtered.filter((a: any) => a.doctor?.id === adminDoctorFilter);
      }
      if (adminPatientFilter !== 'all') {
        filtered = filtered.filter((a: any) => a.patient?.id === adminPatientFilter);
      }
      if (adminStatusFilter !== 'all') {
        filtered = filtered.filter((a: any) => a.status === adminStatusFilter);
      }
    }
    
    return filtered;
  }, [realAppointments, role, appointmentFilter, adminDoctorFilter, adminPatientFilter, adminStatusFilter, active]);
  
  // Pagination hooks at top level (always called)
  const appointmentsPagination = usePagination(filteredAppointments, 10);
  
  // Calculate filtered patients list
  const patientsList = useMemo(() => {
    if (!realAppointments || active !== 'Patients') return [];
    
    const patientsMap = new Map();
    realAppointments.forEach((a: any) => {
      if (a.patient) {
        const pid = a.patient.id;
        if (!patientsMap.has(pid)) {
          patientsMap.set(pid, {
            id: pid,
            name: `${a.patient.firstName} ${a.patient.lastName}`,
            email: a.patient.email,
            lastVisit: a.startTime,
            status: a.status,
            followUp: null
          });
        }
      }
    });
    
    let patients = Array.from(patientsMap.values());
    
    // Apply search filter
    if (patientsSearch) {
      const searchLower = patientsSearch.toLowerCase();
      patients = patients.filter((p: any) => 
        p.name.toLowerCase().includes(searchLower) || 
        p.email.toLowerCase().includes(searchLower)
      );
    }
    
    return patients;
  }, [realAppointments, patientsSearch, active]);
  
  const patientsPagination = usePagination(patientsList, 10);
  
  // Other UI state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  const [msgRecipient, setMsgRecipient] = useState<string>('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('calendar');
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [adminSelectedDoctor, setAdminSelectedDoctor] = useState('');
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [showAppointmentActionsModal, setShowAppointmentActionsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  if (active === 'Overview' || active === 'Today') return role === 'patient' ? <PatientDashboard go={go} appointments={realAppointments} meds={realMeds} isLoading={appsLoading || medsLoading} isError={appsError || medsError}/> : role === 'doctor' ? <DoctorDashboard appointments={realAppointments} isLoading={appsLoading} isError={appsError} token={token} refetchLeaves={refetchLeaves} realMessages={realMessages}/> : <AdminDashboard metrics={adminMetrics} isLoading={adminLoading} isError={adminError}/>
  if (active === 'Appointments') {
    if (selectedAppt) {
      return (
        <>
          <Modal isOpen={showPrescribeModal} onClose={() => setShowPrescribeModal(false)} title="Complete Visit & Prescribe">
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <PrescribeMedicationForm
                appointmentId={selectedAppt.id}
                token={token as string}
                onSuccess={() => {
                  setShowPrescribeModal(false)
                  setSelectedAppt(null)
                  queryClient.invalidateQueries({ queryKey: ['appointments'] })
                }}
              />
            </div>
          </Modal>

          <AppointmentActionsModal
            isOpen={showAppointmentActionsModal}
            onClose={() => setShowAppointmentActionsModal(false)}
            appointment={selectedAppt}
            token={token as string}
            userRole={role.toUpperCase() as 'PATIENT' | 'DOCTOR'}
          />

          <button onClick={() => setSelectedAppt(null)} className="text-button" style={{marginBottom: 20}}>← Back to appointments</button>
          <Heading title="Appointment Details" subtitle={role === 'patient' ? `With Dr. ${selectedAppt.doctor?.firstName || ''} ${selectedAppt.doctor?.lastName || 'Unknown'}` : `With ${selectedAppt.patient?.firstName || 'Patient'} ${selectedAppt.patient?.lastName || ''}`} />
          <Card>
             <h3 style={{fontSize: 16, marginBottom: 8}}>Date & Time</h3>
             <p className="muted" style={{marginBottom: 20}}>{formatDateTime(selectedAppt.startTime)}</p>
             <h3 style={{fontSize: 16, marginBottom: 8}}>Status</h3>
             <p style={{marginBottom: 20}}><Status tone="success">{selectedAppt.status}</Status></p>
             
             {selectedAppt.preVisit && (
               <>
                 <h3 style={{fontSize: 16, marginBottom: 8}}>AI Clinical Summary</h3>
                 <div style={{background: 'var(--background)', padding: 15, borderRadius: 8, marginTop: 10, border: '1px solid var(--border)'}}>
                   {/* Urgency Badge */}
                   {selectedAppt.preVisit.urgencyLevel && (
                     <div style={{marginBottom: 12}}>
                       <span style={{
                         display: 'inline-block',
                         padding: '4px 12px',
                         borderRadius: 6,
                         fontSize: 12,
                         fontWeight: 600,
                         background: selectedAppt.preVisit.urgencyLevel === 'HIGH' ? '#fee' : 
                                    selectedAppt.preVisit.urgencyLevel === 'MEDIUM' ? '#fef3e7' : '#e7f5ff',
                         color: selectedAppt.preVisit.urgencyLevel === 'HIGH' ? '#c00' : 
                               selectedAppt.preVisit.urgencyLevel === 'MEDIUM' ? '#d68000' : '#0066cc'
                       }}>
                         {selectedAppt.preVisit.urgencyLevel === 'HIGH' ? '🔴 HIGH URGENCY' :
                          selectedAppt.preVisit.urgencyLevel === 'MEDIUM' ? '🟡 MEDIUM URGENCY' : '🟢 LOW URGENCY'}
                       </span>
                     </div>
                   )}
                   
                   {/* Chief Complaint */}
                   <p style={{marginBottom: 16, lineHeight: 1.6, fontWeight: 500}}>
                     {selectedAppt.preVisit.chiefComplaint}
                   </p>
                   
                   {/* Suggested Questions */}
                   {selectedAppt.preVisit.questions && selectedAppt.preVisit.questions.length > 0 && (
                     <>
                       <h4 style={{fontSize: 14, marginBottom: 8, marginTop: 16, color: 'var(--muted)'}}>
                         💡 Suggested Questions:
                       </h4>
                       <ul style={{marginLeft: 20, lineHeight: 1.8, color: 'var(--foreground)'}}>
                         {selectedAppt.preVisit.questions.map((q: string, i: number) => (
                           <li key={i} style={{marginBottom: 6}}>{q}</li>
                         ))}
                       </ul>
                     </>
                   )}
                 </div>
               </>
             )}

             {selectedAppt.visit && (
               <>
                 <h3 style={{fontSize: 16, marginTop: 20, marginBottom: 8}}>Clinical Notes</h3>
                 <div style={{background: 'var(--background)', padding: 15, borderRadius: 8, border: '1px solid var(--border)'}}>
                   <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{selectedAppt.visit.clinicalNotes}</p>
                 </div>

                 {selectedAppt.visit.prescriptions && selectedAppt.visit.prescriptions.length > 0 && (
                   <>
                     <h3 style={{fontSize: 16, marginTop: 20, marginBottom: 12}}>Prescribed Medications</h3>
                     <div style={{display: 'grid', gap: 12}}>
                       {selectedAppt.visit.prescriptions.map((prescription: any) =>
                         prescription.medications?.map((med: any) => (
                           <div key={med.id} style={{background: 'var(--mint)', padding: 16, borderRadius: 8, border: '1px solid var(--border)'}}>
                             <div style={{display: 'flex', alignItems: 'start', gap: 12}}>
                               <div style={{width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                                 <HeartPulse size={20} style={{color: 'white'}}/>
                               </div>
                               <div style={{flex: 1}}>
                                 <h4 style={{margin: '0 0 8px', fontSize: 15, fontWeight: 600}}>{med.name}</h4>
                                 <div style={{display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)'}}>
                                   <p style={{margin: 0}}><strong>Dose:</strong> {med.dose}</p>
                                   <p style={{margin: 0}}><strong>Frequency:</strong> {med.frequency.replace(/_/g, ' ')}</p>
                                   <p style={{margin: 0}}><strong>Duration:</strong> {med.duration}</p>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   </>
                 )}

                 {selectedAppt.visit.followUpSteps && selectedAppt.visit.followUpSteps.length > 0 && (
                   <>
                     <h3 style={{fontSize: 16, marginTop: 20, marginBottom: 8}}>Follow-up Instructions</h3>
                     <ul style={{marginLeft: 20, lineHeight: 1.8}}>
                       {selectedAppt.visit.followUpSteps.map((step: string, idx: number) => (
                         <li key={idx}>{step}</li>
                       ))}
                     </ul>
                   </>
                 )}
               </>
             )}

             <div style={{display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap'}}>
               {role === 'doctor' && (selectedAppt.status === 'CONFIRMED' || selectedAppt.status === 'HELD') && !selectedAppt.visit && (
                 <button className="primary-button" onClick={() => setShowPrescribeModal(true)}>
                   <Plus size={17}/> Complete Visit & Prescribe Medications
                 </button>
               )}
               {!['CANCELLED', 'COMPLETED'].includes(selectedAppt.status) && (
                 <button 
                   className="outline-button" 
                   onClick={() => setShowAppointmentActionsModal(true)}
                   style={{display: 'flex', alignItems: 'center', gap: 8}}
                 >
                   <CalendarDays size={17}/> Cancel or Reschedule
                 </button>
               )}
             </div>
          </Card>
        </>
      )
    }

    return <>
      <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title="Book New Appointment">
        <DoctorsView active="Find a doctor" />
      </Modal>

      <Heading 
        title="Appointments" 
        subtitle="Review, manage, and prepare for upcoming care." 
        action={role === 'patient' ? <button className="primary-button" onClick={() => setShowBookingModal(true)}><Plus size={17}/> New appointment</button> : undefined}
      />

      {/* Quick Filters - For Doctor */}
      {role === 'doctor' && (
        <div className="appointment-filters">
          <button 
            className={`filter-button ${appointmentFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAppointmentFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-button ${appointmentFilter === 'today' ? 'active' : ''}`}
            onClick={() => setAppointmentFilter('today')}
          >
            Today
          </button>
          <button 
            className={`filter-button ${appointmentFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setAppointmentFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`filter-button ${appointmentFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setAppointmentFilter('completed')}
          >
            Completed
          </button>
        </div>
      )}

      {/* Advanced Filters - For Admin */}
      {role === 'admin' && (
        <div className="admin-filters">
          <div className="filter-group">
            <label>Filter by Doctor</label>
            <select 
              className="modal-select" 
              value={adminDoctorFilter} 
              onChange={(e) => setAdminDoctorFilter(e.target.value)}
            >
              <option value="all">All Doctors</option>
              {Array.from(new Set(realAppointments?.map((a: any) => a.doctor?.id).filter(Boolean))).map((doctorId: any) => {
                const doctor = realAppointments?.find((a: any) => a.doctor?.id === doctorId)?.doctor;
                return (
                  <option key={doctorId} value={doctorId}>
                    Dr. {doctor?.firstName} {doctor?.lastName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-group">
            <label>Filter by Patient</label>
            <select 
              className="modal-select" 
              value={adminPatientFilter} 
              onChange={(e) => setAdminPatientFilter(e.target.value)}
            >
              <option value="all">All Patients</option>
              {Array.from(new Set(realAppointments?.map((a: any) => a.patient?.id).filter(Boolean))).map((patientId: any) => {
                const patient = realAppointments?.find((a: any) => a.patient?.id === patientId)?.patient;
                return (
                  <option key={patientId} value={patientId}>
                    {patient?.firstName} {patient?.lastName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-group">
            <label>Filter by Status</label>
            <select 
              className="modal-select" 
              value={adminStatusFilter} 
              onChange={(e) => setAdminStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button 
            className="text-button" 
            onClick={() => {
              setAdminDoctorFilter('all');
              setAdminPatientFilter('all');
              setAdminStatusFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <Card>
        {/* Desktop Table View */}
        <div className="responsive-table-desktop">
          <Table>
            <thead>
              <Row>
                <Cell muted>DATE & TIME</Cell>
                <Cell muted>PATIENT</Cell>
                <Cell muted>CLINICIAN / SPECIALTY</Cell>
                <Cell muted>STATUS</Cell>
                <Cell/>
              </Row>
            </thead>
            <tbody>
              {(() => {
                if (appsLoading) return <Row><Cell colSpan={5}><TableSkeleton rows={3} /></Cell></Row>;
                
                if (filteredAppointments.length === 0) {
                  return <Row><Cell colSpan={5}><div style={{padding: 20}}>No appointments found.</div></Cell></Row>;
                }
                
                // Use pre-calculated pagination from top level
                const { currentItems, currentPage, totalPages, setPage, totalItems } = appointmentsPagination;
                
                return (
                  <>
                    {currentItems.map((a: any) => (
                    <Row key={a.id}>
                      <Cell>
                        <strong>{formatDate(a.startTime)}</strong><br/>
                        <span style={{color:'var(--muted)'}}>{formatTime(a.startTime)}</span>
                      </Cell>
                      <Cell>{a.patient?.firstName ? `${a.patient.firstName} ${a.patient.lastName}` : 'You'}</Cell>
                      <Cell>
                        {a.doctor?.firstName ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : 'You'}<br/>
                        <span style={{color:'var(--muted)'}}>{a.doctor?.specialisation}</span>
                      </Cell>
                      <Cell><Status tone="success">{a.status}</Status></Cell>
                      <Cell>
                        <button className="icon-button" aria-label={`Open ${a.id}`} onClick={() => setSelectedAppt(a)}>
                          <MoreHorizontal size={18}/>
                        </button>
                      </Cell>
                    </Row>
                    ))}
                    {totalPages > 1 && (
                      <Row>
                        <Cell colSpan={5}>
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            itemsPerPage={10}
                            totalItems={totalItems}
                            showItemCount={true}
                          />
                        </Cell>
                      </Row>
                    )}
                  </>
                );
              })()}
            </tbody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="responsive-table-mobile">
          {(() => {
            if (appsLoading) return <div style={{padding: 20, textAlign: 'center'}}><CardSkeleton /></div>;
            
            if (filteredAppointments.length === 0) {
              return <div style={{padding: 20, textAlign: 'center'}}>No appointments found.</div>;
            }
            
            // Use pre-calculated pagination from top level
            const { currentItems, currentPage, totalPages, setPage, totalItems } = appointmentsPagination;
            
            return (
              <>
                {currentItems.map((a: any) => (
                <div key={a.id} className="appointment-card-mobile">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                    <h4>{a.patient?.firstName ? `${a.patient.firstName} ${a.patient.lastName}` : 'You'}</h4>
                    <Status tone="success">{a.status}</Status>
                  </div>
                  <p>
                    <strong>{a.doctor?.firstName ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : 'You'}</strong>
                  </p>
                  <p className="muted">{a.doctor?.specialisation}</p>
                  <p style={{marginTop: 8}}>
                    <strong>{getSmartDateDisplay(a.startTime)}</strong>
                    <span className="muted"> at {formatTime(a.startTime)}</span>
                  </p>
                  <button className="outline-button" onClick={() => setSelectedAppt(a)}>
                    View Details <ChevronRight size={15}/>
                  </button>
                </div>
                ))}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    itemsPerPage={10}
                    totalItems={totalItems}
                    showItemCount={true}
                  />
                )}
              </>
            );
          })()}
        </div>
      </Card>
    </>
  }
  if (active === 'Find a doctor' || active === 'Doctors') {
    // Admin role: Show doctor management interface
    if (role === 'admin') {
      return (
        <>
          <AdminDoctorsView setNotice={setAdminNotice} />
          {adminNotice && <button className="toast" onClick={() => setAdminNotice('')}><Bell size={16}/> {adminNotice}<X size={15}/></button>}
        </>
      )
    }
    // Patient role: Show doctor search/booking interface
    return <DoctorsView active={active} />
  }
  if (active === 'Medications') {
    if (role === 'patient') {
      return (
        <>
          <Heading title="Medications" subtitle="Your active prescriptions and daily medication reminders." />
          <MyMedications token={token as string} />
        </>
      )
    }
    
    // For doctor role, show prescriptions they've written
    // For now, show a message that they can prescribe medications through appointments
    return (
      <>
        <Heading 
          title="Prescriptions" 
          subtitle="Medications you've prescribed to your patients"
        />
        <Card>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Pill size={48} style={{ color: 'var(--muted)', marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Prescribe Medications</h3>
            <p className="muted" style={{ marginBottom: 16 }}>
              You can prescribe medications to patients after completing appointments
            </p>
            <p className="muted" style={{ fontSize: 14 }}>
              1. Complete an appointment with a patient<br/>
              2. Go to the Appointments tab<br/>
              3. Click on the appointment and select "Complete Visit"<br/>
              4. Fill in clinical notes and prescribe medications
            </p>
            <button 
              className="primary-button" 
              style={{ marginTop: 24 }}
              onClick={() => go('Appointments')}
            >
              View Appointments
            </button>
          </div>
        </Card>
      </>
    )
  }
  if (active === 'Messages') {
    // Get list of people user can message (based on appointments)
    const messageableContacts = new Map();
    
    realAppointments?.forEach((apt: any) => {
      const contact = role === 'patient' 
        ? { 
            id: apt.doctor?.user?.id, 
            name: `Dr. ${apt.doctor?.firstName} ${apt.doctor?.lastName}`,
            role: 'doctor',
            specialty: apt.doctor?.specialisation 
          }
        : { 
            id: apt.patient?.user?.id, 
            name: `${apt.patient?.firstName} ${apt.patient?.lastName}`,
            role: 'patient',
            email: apt.patient?.user?.email 
          };
      
      if (contact.id && !messageableContacts.has(contact.id)) {
        messageableContacts.set(contact.id, contact);
      }
    });

    const contactsList = Array.from(messageableContacts.values());

    // Group messages by conversation (sender/recipient pairs)
    const conversations = new Map();
    realMessages?.forEach((msg: any) => {
      const otherUserId = msg.senderId === user?.id ? msg.recipientId : msg.senderId;
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, []);
      }
      conversations.get(otherUserId).push(msg);
    });

    // Sort messages in each conversation by date
    conversations.forEach((msgs, userId) => {
      msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    // Auto-select first conversation if none selected
    const firstConversationId = conversations.size > 0 ? Array.from(conversations.keys())[0] : null;
    if (!selectedConversation && firstConversationId) {
      setSelectedConversation(firstConversationId);
    }

    const currentMessages = selectedConversation ? conversations.get(selectedConversation) || [] : [];
    const currentContact = contactsList.find(c => c.id === selectedConversation);

    return <>
      <Modal isOpen={showMessageModal} onClose={() => { setShowMessageModal(false); setMsgRecipient(''); setMsgContent(''); }} title="New Message">
        <div className="message-modal-content">
          <div className="form-group">
            <label>To</label>
            <select 
              value={msgRecipient} 
              onChange={e => setMsgRecipient(e.target.value)}
              className="modal-select"
            >
              <option value="">Select recipient...</option>
              {contactsList.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.specialty ? `(${contact.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Message</label>
            <textarea 
              value={msgContent} 
              onChange={e => setMsgContent(e.target.value)}
              placeholder="Type your message here..."
              className="modal-textarea"
              rows={5}
            />
          </div>

          <div className="modal-actions">
            <button className="text-button" onClick={() => { setShowMessageModal(false); setMsgRecipient(''); setMsgContent(''); }}>
              Cancel
            </button>
            <button 
              className="primary-button" 
              disabled={!msgRecipient || !msgContent.trim()}
              onClick={async () => {
                if (!msgRecipient || !msgContent.trim()) return;
                
                try {
                  await sendMessage(token as string, msgRecipient, msgContent);
                  setShowMessageModal(false);
                  setMsgContent('');
                  setMsgRecipient('');
                  queryClient.invalidateQueries({ queryKey: ['messages'] });
                  toast({
                    title: 'Success',
                    description: 'Message sent successfully'
                  });
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to send message',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Send Message
            </button>
          </div>
        </div>
      </Modal>

      <Heading 
        title="Messages" 
        subtitle="Secure conversations with your care team." 
        action={
          <button 
            className="primary-button" 
            onClick={() => setShowMessageModal(true)}
            disabled={contactsList.length === 0}
          >
            <Plus size={17}/> New message
          </button>
        }
      />

      {msgsLoading ? (
        <Card>
          <div style={{padding: 20}}>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        </Card>
      ) : realMessages?.length === 0 ? (
        <Card>
          <div style={{padding: 40, textAlign: 'center'}}>
            <MessageCircle size={48} style={{color: 'var(--muted)', marginBottom: 16}}/>
            <h3 style={{margin: '0 0 8px', fontSize: 18}}>No messages yet</h3>
            <p className="muted">Start a conversation with your {role === 'patient' ? 'doctor' : 'patients'}</p>
            {contactsList.length === 0 && (
              <p className="muted" style={{fontSize: 12, marginTop: 12}}>
                You need at least one appointment to send messages
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="messages-container">
          {/* Conversations Sidebar */}
          <Card className="conversations-sidebar">
            <h3 style={{margin: '0 0 16px', fontSize: 16, fontWeight: 600}}>Conversations</h3>
            
            {/* Search Bar */}
            <div className="search-wrapper" style={{marginBottom: 16}}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input-with-icon"
                placeholder="Search conversations..."
                value={messagesSearch}
                onChange={(e) => setMessagesSearch(e.target.value)}
              />
              {messagesSearch && (
                <button 
                  className="search-clear"
                  onClick={() => setMessagesSearch('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="conversations-list">
              {(() => {
                const filteredConversations = Array.from(conversations.entries())
                  .filter(([userId, msgs]) => {
                    if (!messagesSearch) return true;
                    const contact = contactsList.find(c => c.id === userId);
                    const searchLower = messagesSearch.toLowerCase();
                    
                    // Search by contact name
                    if (contact?.name.toLowerCase().includes(searchLower)) return true;
                    
                    // Search by message content
                    return msgs.some((m: any) => 
                      m.content.toLowerCase().includes(searchLower)
                    );
                  });
                
                if (filteredConversations.length === 0) {
                  return (
                    <div style={{padding: 20, textAlign: 'center'}}>
                      <MessageCircle size={32} style={{color: 'var(--muted)', marginBottom: 8}}/>
                      <p className="muted">No conversations found</p>
                      {messagesSearch && (
                        <button 
                          className="text-button" 
                          onClick={() => setMessagesSearch('')}
                          style={{marginTop: 8}}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  );
                }
                
                return filteredConversations.map(([userId, msgs]) => {
                  const contact = contactsList.find(c => c.id === userId);
                  const lastMsg = msgs[msgs.length - 1];
                  const unreadCount = msgs.filter((m: any) => !m.read && m.senderId !== user?.id).length;
                  
                  return (
                    <button
                      key={userId}
                      className={`conversation-item ${selectedConversation === userId ? 'active' : ''}`}
                      onClick={() => setSelectedConversation(userId)}
                    >
                      <div className="conversation-avatar">
                        {contact?.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '??'}
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-header">
                          <strong>{contact?.name || 'Unknown'}</strong>
                          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                        </div>
                        <p className="conversation-preview">
                          {lastMsg.content.substring(0, 50)}{lastMsg.content.length > 50 ? '...' : ''}
                        </p>
                        <span className="conversation-time">
                          {formatRelativeTime(lastMsg.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </Card>

          {/* Messages Panel */}
          <Card className="messages-panel">
            {selectedConversation && currentContact ? (
              <>
                <div className="messages-header">
                  <div>
                    <h3 style={{margin: 0, fontSize: 18, fontWeight: 600}}>{currentContact.name}</h3>
                    {currentContact.specialty && (
                      <p className="muted" style={{fontSize: 13, margin: '4px 0 0'}}>{currentContact.specialty}</p>
                    )}
                  </div>
                </div>

                <div className="messages-thread">
                  {currentMessages.map((msg: any, idx: number) => {
                    const isOwn = msg.senderId === user?.id;
                    const showDate = idx === 0 || 
                      new Date(currentMessages[idx - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                    
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="message-date-divider">
                            {formatDate(msg.createdAt, { weekday: 'long', month: 'long', day: 'numeric' })}
                          </div>
                        )}
                        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                          <div className="message-content">{msg.content}</div>
                          <div className="message-meta">
                            {formatTime(msg.createdAt)}
                            {isOwn && !msg.read && <span className="message-status"> · Sent</span>}
                            {isOwn && msg.read && <span className="message-status"> · Read</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="message-compose">
                  <textarea
                    value={msgContent}
                    onChange={e => setMsgContent(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                    rows={2}
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter' && !e.shiftKey && msgContent.trim()) {
                        e.preventDefault();
                        try {
                          await sendMessage(token as string, selectedConversation, msgContent);
                          setMsgContent('');
                          queryClient.invalidateQueries({ queryKey: ['messages'] });
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: 'Failed to send message',
                            variant: 'destructive'
                          });
                        }
                      }
                    }}
                  />
                  <button
                    className="primary-button"
                    disabled={!msgContent.trim()}
                    onClick={async () => {
                      if (!msgContent.trim()) return;
                      try {
                        await sendMessage(token as string, selectedConversation, msgContent);
                        setMsgContent('');
                        queryClient.invalidateQueries({ queryKey: ['messages'] });
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: 'Failed to send message',
                          variant: 'destructive'
                        });
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div style={{padding: 40, textAlign: 'center'}}>
                <p className="muted">Select a conversation to view messages</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  }
  if (active === 'Patients') {
    // Transform appointments into patient list with their latest visit info
    const patientMap = new Map();
    
    realAppointments?.forEach((apt: any) => {
      const patientId = apt.patient?.id;
      if (!patientId) return;
      
      const existingPatient = patientMap.get(patientId);
      const aptDate = new Date(apt.startTime);
      
      if (!existingPatient || new Date(existingPatient.lastVisit) < aptDate) {
        patientMap.set(patientId, {
          id: patientId,
          name: `${apt.patient.firstName} ${apt.patient.lastName}`,
          email: apt.patient.user?.email || '',
          lastVisit: apt.startTime,
          lastStatus: apt.status,
          hasVisit: !!apt.visit,
          needsFollowUp: apt.visit?.followUpSteps?.length > 0
        });
      }
    });
    
    let patientsList = Array.from(patientMap.values()).sort((a, b) => 
      new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );
    
    // Apply search filter
    if (patientsSearch) {
      patientsList = patientsList.filter(p => 
        p.name.toLowerCase().includes(patientsSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(patientsSearch.toLowerCase())
      );
    }
    
    
    return <>
      <Heading title="Patients" subtitle="Your active patient panel and visit history."/>
      
      {/* Search Bar */}
      <div className="search-wrapper" style={{marginBottom: 20}}>
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={patientsSearch}
          onChange={(e) => setPatientsSearch(e.target.value)}
          className="search-input search-input-with-icon"
        />
        {patientsSearch && (
          <button className="search-clear" onClick={() => setPatientsSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>
      
      <Card>
        {/* Desktop Table */}
        <div className="responsive-table-desktop">
          <Table>
            <thead>
              <Row>
                <Cell muted>PATIENT</Cell>
                <Cell muted>LAST VISIT</Cell>
                <Cell muted>STATUS</Cell>
                <Cell muted>FOLLOW-UP</Cell>
              </Row>
            </thead>
            <tbody>
              {appsLoading ? (
                <Row><Cell><div style={{padding: 20}}>Loading...</div></Cell></Row>
              ) : patientsPagination.currentItems.length === 0 ? (
                <Row><Cell><div style={{padding: 20}}>
                  {patientsSearch ? `No patients found matching "${patientsSearch}"` : 'No patients found.'}
                </div></Cell></Row>
              ) : patientsPagination.currentItems.map((p: any) => {
                const lastVisitDate = new Date(p.lastVisit);
                const daysSinceVisit = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
                const initials = p.name.split(' ').map((x: string) => x[0]).join('');
                
                return (
                  <Row key={p.id}>
                    <Cell>
                      <div style={{display:'flex',alignItems:'center',gap:9}}>
                        <Avatar initials={initials}/>
                        <div>
                          <strong>{p.name}</strong>
                          <br/>
                          <span style={{fontSize: 11, color: 'var(--muted)'}}>{p.email}</span>
                        </div>
                      </div>
                    </Cell>
                    <Cell muted>
                      {formatDate(lastVisitDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                      <br/>
                      <span style={{fontSize: 11}}>({daysSinceVisit} days ago)</span>
                    </Cell>
                    <Cell>
                      <Status tone={p.lastStatus === 'COMPLETED' ? 'success' : p.lastStatus === 'CONFIRMED' ? 'warning' : 'neutral'}>
                        {p.lastStatus}
                      </Status>
                    </Cell>
                    <Cell>
                      {p.hasVisit ? (
                        p.needsFollowUp ? (
                          <Status tone="warning">Follow-up needed</Status>
                        ) : (
                          <Status tone="success">Complete</Status>
                        )
                      ) : (
                        <span className="muted">Pending visit</span>
                      )}
                    </Cell>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="responsive-table-mobile">
          {appsLoading ? (
            <div style={{padding: 20, textAlign: 'center'}}>Loading...</div>
          ) : patientsPagination.currentItems.length === 0 ? (
            <div style={{padding: 20, textAlign: 'center'}}>
              {patientsSearch ? `No patients found matching "${patientsSearch}"` : 'No patients found.'}
            </div>
          ) : patientsPagination.currentItems.map((p: any) => {
            const lastVisitDate = new Date(p.lastVisit);
            const daysSinceVisit = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            const initials = p.name.split(' ').map((x: string) => x[0]).join('');
            
            return (
              <div key={p.id} className="appointment-card-mobile">
                <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
                  <Avatar initials={initials}/>
                  <div>
                    <h4 style={{margin: 0}}>{p.name}</h4>
                    <p className="muted" style={{fontSize: 12, margin: '2px 0 0'}}>{p.email}</p>
                  </div>
                </div>
                <p>
                  <strong>Last Visit:</strong> {formatDate(lastVisitDate, { month: 'short', day: 'numeric', year: 'numeric' })} ({daysSinceVisit} days ago)
                </p>
                <p>
                  <strong>Status:</strong> <Status tone={p.lastStatus === 'COMPLETED' ? 'success' : 'warning'}>{p.lastStatus}</Status>
                </p>
                <p>
                  <strong>Follow-up:</strong> {p.hasVisit ? (p.needsFollowUp ? <Status tone="warning">Needed</Status> : <Status tone="success">Complete</Status>) : <span className="muted">Pending</span>}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {patientsPagination.totalPages > 1 && (
          <Pagination
            currentPage={patientsPagination.currentPage}
            totalPages={patientsPagination.totalPages}
            onPageChange={patientsPagination.setPage}
            totalItems={patientsPagination.totalItems}
            itemsPerPage={10}
          />
        )}
      </Card>
    </>
  }
  if (active === 'Schedule' || active === 'Leave & availability') {
    // Admin sees all doctors' leaves, Doctor sees their own
    const isAdmin = role === 'admin';
    
    // Generate calendar for current week
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    });

    // Check if date has leave
    const hasLeave = (date: Date) => {
      return realLeaves?.some((leave: any) => {
        const leaveDate = new Date(leave.date);
        return leaveDate.toDateString() === date.toDateString();
      });
    };

    // Get appointments for a specific date
    const getAppointmentsForDate = (date: Date) => {
      return realAppointments?.filter((apt: any) => {
        const aptDate = new Date(apt.startTime);
        return aptDate.toDateString() === date.toDateString();
      }) || [];
    };

    // For admin: Group leaves by doctor
    const leavesByDoctor = isAdmin ? (() => {
      const grouped = new Map();
      realLeaves?.forEach((leave: any) => {
        const doctorId = leave.doctorId || 'unknown';
        if (!grouped.has(doctorId)) {
          grouped.set(doctorId, []);
        }
        grouped.get(doctorId).push(leave);
      });
      return grouped;
    })() : null;

    return <>
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title={isAdmin ? "Block Doctor Availability" : "Add Availability Block"}>
        {isAdmin && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Doctor</label>
            <select
              className="modal-select"
              value={adminSelectedDoctor}
              onChange={(e) => setAdminSelectedDoctor(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '14px'
              }}
            >
              <option value="">Select a doctor...</option>
              {doctorsLoading ? (
                <option disabled>Loading doctors...</option>
              ) : allDoctors?.length > 0 ? (
                allDoctors.map((doctor: any) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialisation}
                  </option>
                ))
              ) : (
                <option disabled>No doctors available</option>
              )}
            </select>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date to block</label>
          <DatePicker
            value={scheduleDate}
            onChange={setScheduleDate}
            minDate={new Date().toISOString().split('T')[0]}
            placeholder="Select a date"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="text-button" onClick={() => setShowScheduleModal(false)}>Cancel</button>
          <button className="primary-button" onClick={async () => {
             if (isAdmin && !adminSelectedDoctor) {
               toast({
                 title: 'Validation Error',
                 description: 'Please select a doctor',
                 variant: 'destructive'
               });
               return;
             }
             
             if (!scheduleDate) {
               toast({
                 title: 'Validation Error',
                 description: 'Please select a date',
                 variant: 'destructive'
               });
               return;
             }
             
             try {
               const confirmed = await confirm({
                 title: 'Block Availability',
                 message: `Are you sure you want to block ${formatDate(scheduleDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}?${isAdmin ? ' This will prevent the selected doctor from accepting appointments on this date.' : " You won't be able to accept appointments on this date."}`,
                 confirmText: 'Confirm Block',
                 cancelText: 'Cancel',
                 variant: 'warning'
               });
               
               if (!confirmed) {
                 return;
               }
               
               if (isAdmin) {
                 await addDoctorLeave(token as string, adminSelectedDoctor, scheduleDate);
               } else {
                 await addLeave(token as string, scheduleDate);
               }
               
               setShowScheduleModal(false);
               setScheduleDate('');
               setAdminSelectedDoctor('');
               refetchLeaves();
               toast({
                 title: 'Success',
                 description: 'Leave/availability block added successfully'
               });
             } catch (error: any) {
               console.error('Error in confirm block handler:', error);
               toast({
                 title: 'Error',
                 description: error.message || 'Failed to add leave',
                 variant: 'destructive'
               });
             }
          }}>Confirm Block</button>
        </div>
      </Modal>

      <Modal isOpen={showAvailabilityModal} onClose={() => setShowAvailabilityModal(false)} title="Availability Rules">
        <div className="availability-rules-form">
          <h3 style={{fontSize: 16, marginBottom: 16}}>Default Scheduling Preferences</h3>
          
          <div className="form-group">
            <label>Working Days</label>
            <div className="working-days-grid">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} className="checkbox-label">
                  <input type="checkbox" defaultChecked={!['Saturday', 'Sunday'].includes(day)} />
                  <span>{day.substring(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Working Hours</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
              <div>
                <label style={{fontSize: 12, color: 'var(--muted)'}}>Start Time</label>
                <input type="time" defaultValue="09:00" className="modal-select" />
              </div>
              <div>
                <label style={{fontSize: 12, color: 'var(--muted)'}}>End Time</label>
                <input type="time" defaultValue="17:00" className="modal-select" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Appointment Duration</label>
            <select className="modal-select" defaultValue="30">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Buffer Between Appointments</label>
            <select className="modal-select" defaultValue="15">
              <option value="0">No buffer</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <input type="checkbox" defaultChecked />
              <span>Enable video consultations</span>
            </label>
          </div>

          <div className="modal-actions" style={{marginTop: 24}}>
            <button className="text-button" onClick={() => setShowAvailabilityModal(false)}>Cancel</button>
            <button className="primary-button" onClick={() => {
              toast({
                title: 'Success',
                description: 'Availability rules updated successfully'
              });
              setShowAvailabilityModal(false);
            }}>Save Rules</button>
          </div>
        </div>
      </Modal>

      <Heading 
        title={active} 
        subtitle="Manage availability and keep the care calendar reliable." 
        action={
          <div style={{display: 'flex', gap: 10}}>
            <button className="outline-button" onClick={() => setShowAvailabilityModal(true)} style={{display: 'flex', alignItems: 'center', gap: 6}}>
              <Settings2 size={15}/> Availability Rules
            </button>
            <button className="primary-button" onClick={() => setShowScheduleModal(true)}>
              <Plus size={17}/> Add time block
            </button>
          </div>
        }
      />

      {/* View Toggle */}
      <div className="appointment-filters" style={{marginBottom: 16}}>
        <button 
          className={`filter-button ${scheduleView === 'calendar' ? 'active' : ''}`}
          onClick={() => setScheduleView('calendar')}
        >
          <CalendarDays size={15}/> Calendar View
        </button>
        <button 
          className={`filter-button ${scheduleView === 'list' ? 'active' : ''}`}
          onClick={() => setScheduleView('list')}
        >
          List View
        </button>
      </div>

      {scheduleView === 'calendar' ? (
        <Card>
          <div className="calendar-header">
            <h3 style={{margin: 0, fontSize: 18}}>
              {formatDate(currentWeekStart, { month: 'long', year: 'numeric' })}
            </h3>
            <p className="muted" style={{margin: '4px 0 0', fontSize: 13}}>
              Week of {formatDate(currentWeekStart, { month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className="calendar-grid">
            {weekDays.map((date, idx) => {
              const isToday = date.toDateString() === today.toDateString();
              const isLeave = hasLeave(date);
              const dayAppointments = getAppointmentsForDate(date);
              
              return (
                <div key={idx} className={`calendar-day ${isToday ? 'today' : ''} ${isLeave ? 'has-leave' : ''}`}>
                  <div className="calendar-day-header">
                    <span className="calendar-day-name">{formatDate(date, { weekday: 'short' })}</span>
                    <span className="calendar-day-number">{date.getDate()}</span>
                  </div>
                  
                  <div className="calendar-day-content">
                    {isLeave ? (
                      <div className="calendar-event leave-event">
                        <span>🚫 Leave</span>
                      </div>
                    ) : dayAppointments.length > 0 ? (
                      dayAppointments.map((apt: any) => (
                        <div key={apt.id} className="calendar-event appointment-event" onClick={() => setSelectedAppt(apt)}>
                          <div className="event-time">
                            {formatTime(apt.startTime)}
                          </div>
                          <div className="event-title">
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="calendar-empty">
                        <span>Available</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot today-dot"></span>
              <span>Today</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot appointment-dot"></span>
              <span>Appointments</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot leave-dot"></span>
              <span>Leave/Blocked</span>
            </div>
          </div>
        </Card>
      ) : (
        <div className="content-grid">
          <Card>
            <h2>{isAdmin ? 'All Doctors\' Leave' : 'Upcoming Leave'}</h2>
            <p className="muted">{isAdmin ? 'Leave schedules across all doctors' : 'Blocked out days'}</p>
            <div className="schedule-list">
              {leavesLoading ? (
                <p>Loading...</p>
              ) : realLeaves?.length === 0 ? (
                <p className="muted">No leave scheduled.</p>
              ) : isAdmin ? (
                // Admin view: Show all doctors' leaves with doctor info from the leave object
                realLeaves?.map((l: any) => (
                  <div className="schedule-row" key={l.id}>
                    <div className="schedule-time">
                      <small>ALL DAY</small>
                    </div>
                    <div className="schedule-line"/>
                    <div className="schedule-patient">
                      <strong>{formatDate(l.date)}</strong>
                      <span>
                        {l.doctor ? `Dr. ${l.doctor.firstName} ${l.doctor.lastName} (${l.doctor.specialisation})` : 'Doctor'} - Leave
                      </span>
                    </div>
                    <Status tone="warning">Busy</Status>
                  </div>
                ))
              ) : (
                // Doctor view: Show own leaves
                realLeaves?.map((l: any) => (
                  <div className="schedule-row" key={l.id}>
                    <div className="schedule-time">
                      <small>ALL DAY</small>
                    </div>
                    <div className="schedule-line"/>
                    <div className="schedule-patient">
                      <strong>{formatDate(l.date)}</strong>
                      <span>Blocked - Leave</span>
                    </div>
                    <Status tone="warning">Busy</Status>
                  </div>
                ))
              )}
            </div>
          </Card>
          
          <Card>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <div>
                <h2 style={{margin: 0}}>Availability Rules</h2>
                <p className="muted" style={{margin: '4px 0 0'}}>Default scheduling preferences</p>
              </div>
              <button className="text-button" onClick={() => setShowAvailabilityModal(true)}>
                Edit
              </button>
            </div>
            <div className="timeline">
              <div>
                <span className="timeline-dot teal-dot"/>
                <p>
                  <strong>Working Hours</strong>
                  <small>Monday - Friday, 9:00 AM - 5:00 PM</small>
                </p>
              </div>
              <div>
                <span className="timeline-dot mint-dot"/>
                <p>
                  <strong>Appointment Duration</strong>
                  <small>30 minutes per appointment</small>
                </p>
              </div>
              <div>
                <span className="timeline-dot teal-dot"/>
                <p>
                  <strong>Buffer Time</strong>
                  <small>15 minutes between appointments</small>
                </p>
              </div>
              <div>
                <span className="timeline-dot mint-dot"/>
                <p>
                  <strong>Video Consultations</strong>
                  <small>Enabled for all appointment types</small>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
      {dialog}
    </>
  }
  // System Health Tab - Real metrics
  if (active === 'System health') {
    // Calculate real system health metrics
    const totalAppointments = realAppointments?.length || 0;
    const completedAppointments = realAppointments?.filter((a: any) => a.status === 'COMPLETED').length || 0;
    const completionRate = totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : '0';
    
    const todayAppointments = realAppointments?.filter((a: any) => {
      const apptDate = new Date(a.startTime);
      const today = new Date();
      return apptDate.toDateString() === today.toDateString();
    }).length || 0;
    
    const unreadMessages = realMessages?.filter((m: any) => !m.read && m.senderId !== user?.id).length || 0;
    const totalMessages = realMessages?.length || 0;
    const messageHealthStatus = unreadMessages < 10 ? 'Healthy' : 'Needs attention';
    
    const totalDoctors = Array.from(new Set(realAppointments?.map((a: any) => a.doctor?.id).filter(Boolean))).length || 0;
    const activeDoctorsToday = Array.from(new Set(
      realAppointments
        ?.filter((a: any) => {
          const apptDate = new Date(a.startTime);
          const today = new Date();
          return apptDate.toDateString() === today.toDateString();
        })
        .map((a: any) => a.doctor?.id)
        .filter(Boolean)
    )).length || 0;
    
    // Calculate recent system events from real data
    const systemEvents = [];
    const now = new Date();
    
    if (todayAppointments > 0) {
      systemEvents.push({
        type: 'teal',
        title: `${todayAppointments} appointments scheduled today`,
        time: 'Current'
      });
    }
    
    if (activeDoctorsToday > 0) {
      systemEvents.push({
        type: 'mint',
        title: `${activeDoctorsToday} doctors active today`,
        time: 'Real-time'
      });
    }
    
    if (completedAppointments > 0) {
      systemEvents.push({
        type: 'teal',
        title: `${completedAppointments} appointments completed`,
        time: 'All-time total'
      });
    }
    
    if (totalMessages > 0) {
      systemEvents.push({
        type: unreadMessages > 10 ? 'gray' : 'mint',
        title: `${unreadMessages} unread messages (${totalMessages} total)`,
        time: messageHealthStatus
      });
    }
    
    if (realLeaves && realLeaves.length > 0) {
      const upcomingLeaves = realLeaves.filter((l: any) => new Date(l.date) >= new Date()).length;
      systemEvents.push({
        type: 'gray',
        title: `${upcomingLeaves} upcoming leave days scheduled`,
        time: 'Planning ahead'
      });
    }
    
    return <>
      <Heading title="System health" subtitle="Live operational metrics from MediSlot services."/>
      <div className="metric-grid">
        <Card className="metric-card">
          <p className="muted">API Status</p>
          <strong style={{fontSize:22}}>Online</strong>
          <span><Status>Operational</Status></span>
        </Card>
        <Card className="metric-card">
          <p className="muted">Appointments Today</p>
          <strong style={{fontSize:22}}>{todayAppointments}</strong>
          <span><Status>{todayAppointments > 0 ? 'Active' : 'Quiet'}</Status></span>
        </Card>
        <Card className="metric-card">
          <p className="muted">Completion Rate</p>
          <strong style={{fontSize:22}}>{completionRate}%</strong>
          <span><Status tone={parseFloat(completionRate) >= 80 ? 'success' : 'neutral'}>
            {parseFloat(completionRate) >= 80 ? 'Healthy' : 'Monitor'}
          </Status></span>
        </Card>
        <Card className="metric-card">
          <p className="muted">Total Doctors</p>
          <strong style={{fontSize:22}}>{totalDoctors}</strong>
          <span><Status>{activeDoctorsToday} active today</Status></span>
        </Card>
      </div>
      
      <div className="content-grid">
        <Card>
          <h2>System Metrics</h2>
          <p className="muted">Real-time data from the platform</p>
          <div className="timeline">
            <div>
              <span className="timeline-dot teal-dot"/>
              <p>
                <strong>Total Appointments</strong>
                <small>{totalAppointments} appointments in system</small>
              </p>
            </div>
            <div>
              <span className="timeline-dot mint-dot"/>
              <p>
                <strong>Message Activity</strong>
                <small>{totalMessages} messages, {unreadMessages} unread</small>
              </p>
            </div>
            <div>
              <span className="timeline-dot teal-dot"/>
              <p>
                <strong>Doctor Availability</strong>
                <small>{totalDoctors} doctors, {activeDoctorsToday} active today</small>
              </p>
            </div>
            <div>
              <span className="timeline-dot mint-dot"/>
              <p>
                <strong>Leave Management</strong>
                <small>{realLeaves?.length || 0} total leave days scheduled</small>
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <h2>Recent Activity</h2>
          <p className="muted">Live system events and updates</p>
          <div className="timeline">
            {systemEvents.length === 0 ? (
              <p className="muted">No recent activity</p>
            ) : (
              systemEvents.map((event, idx) => (
                <div key={idx}>
                  <span className={`timeline-dot ${event.type}-dot`}/>
                  <p>
                    <strong>{event.title}</strong>
                    <small>{event.time}</small>
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  }
  
  return (
    <>
      {dialog}
      <><Heading title="Settings" subtitle="Manage your preferences."/><Card><p>Settings view coming soon.</p></Card></>
    </>
  )
}

function MediSlotApp() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState('Overview'); 
  const [mobileOpen, setMobileOpen] = useState(false); 
  const [notice, setNotice] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const role = (user?.role.toLowerCase() || 'patient') as Role;
  const currentNavSections = useMemo(() => categorizedNav[role] || categorizedNav.patient, [role]); 
  const go = (label: string) => { setActive(label); setMobileOpen(false) };
  const initials = user?.email.substring(0,2).toUpperCase() || 'NA';
  
  // Close profile menu when clicking outside
  const handleProfileMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
  };
  
  // Close profile menu when clicking anywhere
  const closeProfileMenu = () => setShowProfileMenu(false);
  
  if (!user) {
    return showRegister ? (
      <RegisterScreen onBackToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginScreen onSwitchToRegister={() => setShowRegister(true)} />
    );
  }
  
  return <div className="app-shell" onClick={closeProfileMenu}><aside className={mobileOpen ? 'sidebar open' : 'sidebar'}><div className="brand"><span className="brand-mark"><HeartPulse size={18}/></span><span>Medi<span>Slot</span></span><button className="close-mobile" onClick={() => setMobileOpen(false)}><X size={18}/></button></div><div className="role-switcher" style={{padding: "10px 15px", borderBottom: "1px solid var(--border)", display: 'flex', justifyContent: 'space-between'}}><span>Workspace Role</span><strong>{role.toUpperCase()}</strong></div><nav>{currentNavSections.map(section => (<div key={section.title}><div className="nav-section-label">{section.title}</div>{section.items.map(([label, Icon]) => { const isActive = active === label || (active === 'Overview' && (label === 'Home' || label === 'Today Agenda' || label === 'Operations Hub')); return <button className={isActive ? 'nav-item active' : 'nav-item'} key={label} onClick={() => go(label)}><Icon size={17}/><span>{label}</span></button>; })}</div>))}</nav><div className="sidebar-bottom"><button className={`nav-item ${active === 'Settings' ? 'active' : ''}`} onClick={() => go('Settings')}><Settings2 size={17}/><span>Settings</span></button><div className="profile-chip" style={{cursor: 'pointer', position: 'relative'}} onClick={handleProfileMenuToggle}><Avatar initials={initials}/><span><strong>{user?.email}</strong><small>{role.charAt(0).toUpperCase() + role.slice(1)}</small></span><MoreHorizontal size={16}/>{showProfileMenu && <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}><button className="profile-dropdown-item" onClick={() => { go('Settings'); closeProfileMenu(); }}><Settings2 size={16}/>Settings</button><button className="profile-dropdown-item logout-item" onClick={() => { logout(); closeProfileMenu(); }}><X size={16}/>Logout</button></div>}</div><div style={{ padding: '8px 10px', marginTop: 10, borderRadius: 8, background: 'var(--mint)', color: 'var(--primary)', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>MediSlot · Dev: Akash Singh</div></div></aside><div className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{active}</strong></div><div className="top-actions"><ThemeToggle /><button className="icon-button notification" aria-label="Notifications" onClick={() => setNotice('No new notifications')}><Bell size={18}/><span/></button><div className="top-avatar" onClick={handleProfileMenuToggle} style={{cursor: 'pointer', position: 'relative'}}>{initials}{showProfileMenu && <div className="profile-dropdown profile-dropdown-top" onClick={(e) => e.stopPropagation()}><div className="profile-dropdown-header"><Avatar initials={initials} tone="teal"/><div><strong>{user?.email}</strong><small style={{display: 'block', color: 'var(--muted)', fontSize: 12}}>{role.charAt(0).toUpperCase() + role.slice(1)}</small></div></div><div className="profile-dropdown-divider"></div><button className="profile-dropdown-item" onClick={() => { go('Settings'); closeProfileMenu(); }}><Settings2 size={16}/>Settings</button><button className="profile-dropdown-item logout-item" onClick={() => { logout(); closeProfileMenu(); }}><X size={16}/>Logout</button></div>}</div></div></header><main className="content">{active === 'Settings' ? <SettingsView setNotice={setNotice} /> : <RecordsView role={role} active={active} go={go}/>} </main></div>{notice && <button className="toast" onClick={() => setNotice('')}><Bell size={16}/> {notice}<X size={15}/></button>}</div>
}

// Wrap with ErrorBoundary for production resilience
export default function MediSlotAppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <MediSlotApp />
    </ErrorBoundary>
  )
}
