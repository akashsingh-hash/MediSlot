'use client'

import { useState, useEffect } from 'react'
import { Check, Calendar, X, Loader2 } from 'lucide-react'
import { useAuth } from './auth-provider'
import { getCalendarStatus, disconnectCalendar, API_URL } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string, style?: React.CSSProperties }) {
  return <section className={`surface ${className}`} style={style}>{children}</section>
}

function Status({ children, tone = 'success' }: { children: React.ReactNode; tone?: 'success' | 'warning' | 'neutral' | 'danger' }) {
  return <span className={`status status-${tone}`}><span className="status-dot" />{children}</span>
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
    </div>
  )
}

export function SettingsView({ setNotice }: { setNotice: (msg: string) => void }) {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const [emailReminders, setEmailReminders] = useState(true)
  const [privacyMode, setPrivacyMode] = useState(true)

  // Fetch calendar connection status
  const { data: calendarStatus, isLoading: calendarLoading, refetch: refetchCalendar } = useQuery({
    queryKey: ['calendarStatus'],
    queryFn: () => getCalendarStatus(token as string),
    enabled: !!token,
  })

  // Handle calendar connection callback from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('calendar') === 'connected') {
        setNotice('✅ Google Calendar connected successfully!')
        refetchCalendar()
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)
      } else if (params.get('calendar') === 'error') {
        const message = params.get('message') || 'Failed to connect calendar'
        setNotice(`❌ ${message}`)
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [refetchCalendar, setNotice])

  // Disconnect calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: () => disconnectCalendar(token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarStatus'] })
      setNotice('Google Calendar disconnected')
    },
    onError: () => {
      setNotice('Failed to disconnect calendar')
    },
  })

  const handleConnectCalendar = () => {
    if (!token) return
    // Redirect to backend OAuth endpoint - it will handle the full flow
    window.location.href = `${API_URL}/calendar/connect?token=${token}`
  }

  const handleDisconnectCalendar = async () => {
    if (confirm('Are you sure you want to disconnect Google Calendar? Future appointments will not sync.')) {
      disconnectMutation.mutate()
    }
  }

  const handleSaveSettings = () => {
    // In a real app, these would persist to backend
    setNotice('Settings saved successfully')
  }

  return (
    <>
      <Heading title="Settings" subtitle="Manage your MediSlot workspace preferences." />

      {/* Calendar Integration Section */}
      <Card>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Calendar size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0 }}>Google Calendar Integration</h2>
          </div>
          <p className="muted" style={{ marginBottom: 20 }}>
            Sync your appointments automatically to Google Calendar. Events are created for both you and your doctor.
          </p>
        </div>

        {calendarLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span className="muted">Loading calendar status...</span>
          </div>
        ) : calendarStatus?.connected ? (
          <>
            <div className="med-list" style={{ marginBottom: 20 }}>
              <div className="med-row">
                <div className="med-copy">
                  <strong>Status</strong>
                  <span>Connected to {calendarStatus.provider}</span>
                </div>
                <Status tone="success">Active</Status>
              </div>
              <div className="med-row">
                <div className="med-copy">
                  <strong>Connected since</strong>
                  <span>{new Date(calendarStatus.connectedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--mint)',
                padding: 15,
                borderRadius: 8,
                marginBottom: 20,
                border: '1px solid #b8d8d1',
              }}
            >
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--foreground)' }}>
                <strong>✓ Automatic sync enabled</strong>
                <br />
                All new appointments will appear in your Google Calendar. Calendar events update automatically when appointments are rescheduled or cancelled.
              </p>
            </div>

            <button
              className="text-button"
              onClick={handleDisconnectCalendar}
              disabled={disconnectMutation.isPending}
              style={{ color: 'var(--coral)' }}
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect Google Calendar'}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                background: 'var(--surface)',
                padding: 15,
                borderRadius: 8,
                marginBottom: 20,
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
                Connect your Google Calendar to automatically sync appointments. You'll receive reminders and can view your schedule across all your devices.
              </p>
            </div>

            <button className="primary-button" onClick={handleConnectCalendar}>
              <Calendar size={17} />
              Connect Google Calendar
            </button>

            <div style={{ marginTop: 15, padding: 12, background: 'var(--background)', borderRadius: 6 }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                <strong>Privacy note:</strong> Calendar events only include appointment time and doctor/patient name. Medical details are never shared to your calendar.
              </p>
            </div>
          </>
        )}
      </Card>

      {/* General Preferences */}
      <Card style={{ marginTop: 20 }}>
        <h2>Notification preferences</h2>
        <div className="med-list">
          <div className="med-row">
            <div className="med-copy">
              <strong>Email reminders</strong>
              <span>Receive appointment and medication updates</span>
            </div>
            <button
              onClick={() => setEmailReminders(!emailReminders)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {emailReminders ? <Status>Enabled</Status> : <Status tone="neutral">Disabled</Status>}
            </button>
          </div>
          <div className="med-row">
            <div className="med-copy">
              <strong>Privacy mode</strong>
              <span>Extra confirmation for clinical records</span>
            </div>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {privacyMode ? <Status>Enabled</Status> : <Status tone="neutral">Disabled</Status>}
            </button>
          </div>
        </div>
        <button className="primary-button" style={{ marginTop: 20 }} onClick={handleSaveSettings}>
          <Check size={17} /> Save changes
        </button>
      </Card>

      {/* Account Information */}
      <Card style={{ marginTop: 20 }}>
        <h2>Account information</h2>
        <div className="med-list">
          <div className="med-row">
            <div className="med-copy">
              <strong>Email</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <div className="med-row">
            <div className="med-copy">
              <strong>Account type</strong>
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}
