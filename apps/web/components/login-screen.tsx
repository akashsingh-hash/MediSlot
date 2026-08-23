'use client'

import { useState } from 'react'
import { useAuth } from './auth-provider'
import { HeartPulse } from 'lucide-react'
import { AuthHeader } from './auth-header'

export function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo123')
  }

  return (
    <>
      <AuthHeader />
      <div className="auth-screen-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--background)',
        padding: '20px'
      }}>
      <div className="surface" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: 12,
            background: 'var(--primary)',
            marginBottom: 16
          }}>
            <HeartPulse size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, marginBottom: 8, fontWeight: 700 }}>Welcome back</h1>
          <p className="muted">Sign in to your MediSlot account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 14
              }}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 14
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(197, 90, 81, 0.1)',
              border: '1px solid var(--coral)'
            }}>
              <p style={{ color: 'var(--coral)', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary-button"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: 10,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Don't have an account? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Create account
            </button>
          </div>
        </form>

        {/* Demo Accounts - Only visible in development */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={{
            marginTop: 30,
            paddingTop: 24,
            borderTop: '1px solid var(--border)'
          }}>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--muted)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Demo Accounts (Dev Only)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { email: 'patient@demo.local', role: 'Patient' },
                { email: 'doctor@demo.local', role: 'Doctor' },
                { email: 'admin@demo.local', role: 'Admin' }
              ].map(demo => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleDemoLogin(demo.email)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{demo.email}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{demo.role}</span>
                </button>
              ))}
            </div>
            <p style={{
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 8,
              lineHeight: 1.4
            }}>
              All demo accounts use password: <code style={{ background: 'var(--surface)', padding: '2px 4px', borderRadius: 3 }}>demo123</code>
            </p>
          </div>
        )}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 20, marginBottom: 0 }}>
          MediSlot Platform · Developed by Akash Singh
        </p>
      </div>
    </div>
    </>
  )
}
