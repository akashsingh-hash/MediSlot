'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './auth-provider'
import { HeartPulse, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'
import { AuthHeader } from './auth-header'

export function RegisterScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
  const { register } = useAuth()
  
  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Validation state
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    firstName: false,
    lastName: false
  })

  // Password strength indicators
  const passwordValidations = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const passwordStrength = Object.values(passwordValidations).filter(Boolean).length
  const isPasswordStrong = passwordStrength >= 3 // At least 3 criteria met

  // Check email availability with debounce
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setEmailAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setEmailChecking(true)
      try {
        const response = await fetch(`http://localhost:3001/auth/check-email?email=${encodeURIComponent(email)}`)
        const data = await response.json()
        setEmailAvailable(data.available)
      } catch (err) {
        console.error('Failed to check email:', err)
      } finally {
        setEmailChecking(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [email])

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/)
    if (match) {
      const formatted = [match[1], match[2], match[3]].filter(Boolean).join('-')
      return formatted
    }
    return value
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
      firstName: true,
      lastName: true
    })

    // Validate all fields
    if (!firstName.trim() || firstName.trim().length < 2) {
      setError('First name must be at least 2 characters')
      return
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (emailAvailable === false) {
      setError('This email is already registered')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!isPasswordStrong) {
      setError('Password must meet at least 3 security requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (phone && phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      await register({
        email: email.toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.replace(/\D/g, '') || undefined
      })
      // Success - AuthProvider will handle navigation
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'var(--border)'
    if (passwordStrength <= 2) return 'var(--coral)'
    if (passwordStrength <= 3) return 'var(--amber)'
    return 'var(--primary)'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return ''
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Fair'
    if (passwordStrength <= 4) return 'Good'
    return 'Strong'
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
      <div className="surface" style={{
        width: '100%',
        maxWidth: 500,
        padding: 40
      }}>
        {/* Header */}
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
          <h1 style={{ fontSize: 26, marginBottom: 8, fontWeight: 700 }}>Create your account</h1>
          <p className="muted">Join MediSlot to manage your healthcare journey</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--foreground)'
              }}>
                First Name <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => setTouched({ ...touched, firstName: true })}
                placeholder="John"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${touched.firstName && firstName.trim().length < 2 ? 'var(--coral)' : 'var(--border)'}`,
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
                Last Name <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => setTouched({ ...touched, lastName: true })}
                placeholder="Doe"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${touched.lastName && lastName.trim().length < 2 ? 'var(--coral)' : 'var(--border)'}`,
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 14
                }}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              Email Address <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${
                    touched.email && emailAvailable === false ? 'var(--coral)' :
                    emailAvailable === true ? 'var(--primary)' :
                    'var(--border)'
                  }`,
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 14
                }}
                required
              />
              <div style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                {emailChecking ? (
                  <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : emailAvailable === true ? (
                  <Check size={16} color="var(--primary)" />
                ) : emailAvailable === false ? (
                  <X size={16} color="var(--coral)" />
                ) : null}
              </div>
            </div>
            {emailAvailable === false && (
              <p style={{ fontSize: 12, color: 'var(--coral)', marginTop: 4 }}>
                This email is already registered
              </p>
            )}
          </div>

          {/* Phone Field (Optional) */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              Phone Number <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>(Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="123-456-7890"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 14
              }}
            />
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              Password <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                placeholder="Create a strong password"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 14
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: 8 }}>
                <div style={{
                  height: 4,
                  background: 'var(--surface)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength / 5) * 100}%`,
                    background: getPasswordStrengthColor(),
                    transition: 'all 0.3s'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Password strength</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>

                {/* Password Requirements */}
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <PasswordRequirement met={passwordValidations.length} text="At least 8 characters" />
                  <PasswordRequirement met={passwordValidations.lowercase} text="One lowercase letter" />
                  <PasswordRequirement met={passwordValidations.uppercase} text="One uppercase letter" />
                  <PasswordRequirement met={passwordValidations.number} text="One number" />
                  <PasswordRequirement met={passwordValidations.special} text="One special character" />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              Confirm Password <span style={{ color: 'var(--coral)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                placeholder="Re-enter your password"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${
                    touched.confirmPassword && confirmPassword && password !== confirmPassword 
                      ? 'var(--coral)' 
                      : 'var(--border)'
                  }`,
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 14
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.confirmPassword && confirmPassword && password !== confirmPassword && (
              <p style={{ fontSize: 12, color: 'var(--coral)', marginTop: 4 }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(197, 90, 81, 0.1)',
              border: '1px solid var(--coral)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}>
              <AlertCircle size={16} color="var(--coral)" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--coral)', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || emailChecking || emailAvailable === false}
            className="primary-button"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: 10,
              opacity: loading || emailChecking || emailAvailable === false ? 0.6 : 1
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          {/* Back to Login */}
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Already have an account? </span>
            <button
              type="button"
              onClick={onBackToLogin}
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
              Sign in
            </button>
          </div>
        </form>

        {/* Terms */}
        <p style={{
          fontSize: 11,
          color: 'var(--muted)',
          textAlign: 'center',
          marginTop: 20,
          lineHeight: 1.5
        }}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 15, marginBottom: 0 }}>
          MediSlot Platform · Developed by Akash Singh
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  )
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: met ? 'var(--primary)' : 'var(--surface)',
        border: `1.5px solid ${met ? 'var(--primary)' : 'var(--border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {met && <Check size={9} color="#fff" strokeWidth={3} />}
      </div>
      <span style={{
        fontSize: 11,
        color: met ? 'var(--foreground)' : 'var(--muted)'
      }}>
        {text}
      </span>
    </div>
  )
}
