'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface DatePickerProps {
  value: string // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void
  minDate?: string
  maxDate?: string
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({ 
  value, 
  onChange, 
  minDate, 
  maxDate, 
  placeholder = 'Select date',
  disabled = false 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date()
  })

  const selectedDate = value ? new Date(value) : null

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    const dateString = newDate.toISOString().split('T')[0]
    
    // Check min/max constraints
    if (minDate && dateString < minDate) return
    if (maxDate && dateString > maxDate) return
    
    onChange(dateString)
    setIsOpen(false)
  }

  const isDateDisabled = (day: number) => {
    const dateString = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
      .toISOString().split('T')[0]
    
    if (minDate && dateString < minDate) return true
    if (maxDate && dateString > maxDate) return true
    return false
  }

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getFullYear() === viewDate.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    )
  }

  const formatDisplayDate = () => {
    if (!selectedDate) return placeholder
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="date-picker-day empty" />)
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const disabled = isDateDisabled(day)
    const selected = isDateSelected(day)
    const today = isToday(day)
    
    calendarDays.push(
      <button
        key={day}
        type="button"
        className={`date-picker-day ${selected ? 'selected' : ''} ${today ? 'today' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && handleDateSelect(day)}
        disabled={disabled}
      >
        {day}
      </button>
    )
  }

  return (
    <div className="date-picker-wrapper">
      <button
        type="button"
        className="date-picker-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Calendar size={16} />
        <span>{formatDisplayDate()}</span>
      </button>

      {isOpen && (
        <>
          <div className="date-picker-backdrop" onClick={() => setIsOpen(false)} />
          <div className="date-picker-dropdown">
            <div className="date-picker-header">
              <button type="button" onClick={handlePrevMonth} className="date-picker-nav">
                <ChevronLeft size={18} />
              </button>
              <div className="date-picker-month">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <button type="button" onClick={handleNextMonth} className="date-picker-nav">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="date-picker-weekdays">
              {dayNames.map(day => (
                <div key={day} className="date-picker-weekday">{day}</div>
              ))}
            </div>

            <div className="date-picker-days">
              {calendarDays}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
