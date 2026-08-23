'use client'

import Link from 'next/link'
import { Activity, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

export function AuthHeader() {
  return (
    <header className="auth-header">
      <div className="auth-header-content">
        {/* Left: Logo + Back Link */}
        <div className="auth-header-left">
          <Link href="/" className="auth-logo">
            <span className="auth-logo-icon">
              <Activity size={20} strokeWidth={2.5} />
            </span>
            <span className="auth-logo-text">MediSlot</span>
          </Link>
          <Link href="/" className="auth-back-link">
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Right: Theme Toggle */}
        <div className="auth-header-right">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
