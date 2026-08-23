'use client'

import React from 'react'

export function CardSkeleton() {
  return (
    <div className="surface skeleton-container">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="surface">
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div className="skeleton" style={{ height: 20, width: '25%' }} />
        <div className="skeleton" style={{ height: 20, width: '25%' }} />
        <div className="skeleton" style={{ height: 20, width: '25%' }} />
        <div className="skeleton" style={{ height: 20, width: '25%' }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 16, width: '25%' }} />
          <div className="skeleton" style={{ height: 16, width: '25%' }} />
          <div className="skeleton" style={{ height: 16, width: '25%' }} />
          <div className="skeleton" style={{ height: 16, width: '25%' }} />
        </div>
      ))}
    </div>
  )
}

export function DoctorCardSkeleton() {
  return (
    <div className="surface skeleton-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 12 }} />
      </div>
      <div className="skeleton skeleton-title" style={{ width: '70%' }} />
      <div className="skeleton skeleton-text" style={{ width: '50%' }} />
      <div className="skeleton" style={{ height: 40, marginTop: 16, borderRadius: 8 }} />
    </div>
  )
}

export function AppointmentSkeleton() {
  return (
    <div className="surface skeleton-container">
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 60, height: 60, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-title" style={{ width: '60%', marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="surface skeleton-container">
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 16, width: '30%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '80%' }} />
        </div>
      </div>
    </div>
  )
}

export function MetricSkeleton() {
  return (
    <div className="surface metric-card skeleton-container">
      <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: '50%' }} />
    </div>
  )
}
