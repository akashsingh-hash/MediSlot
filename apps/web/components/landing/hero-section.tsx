'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'ai' | 'admin'>('patient');

  return (
    <section className="relative overflow-hidden pt-36 pb-24 lg:pt-44 lg:pb-32">
      {/* Dynamic Background Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-background to-background pointer-events-none" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-6 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
          Healthcare Operating System
        </div>

        {/* Giant Centered Headline */}
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl font-heading text-foreground max-w-5xl mx-auto leading-[1.08]">
          Modern Healthcare Scheduling & Patient Care,{' '}
          <span className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
            Reimagined.
          </span>
        </h1>

        {/* Centered Subtitle */}
        <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
          MediSlot connects patients, clinicians, and administrators into one unified platform with real-time slot booking, Gemini 1.5 AI pre-visit insights, medication tracking, and 2-way Google Calendar synchronization.
        </p>

        {/* Dual CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-7 py-3.5 text-sm font-bold shadow-xl shadow-teal-600/30 transition-all hover:scale-105 active:scale-95"
          >
            Launch MediSlot Workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 hover:bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-teal-500/50 shadow-sm"
          >
            Explore Features
          </a>
        </div>

        {/* Live Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            100% Race-Condition Protected
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            &lt; 1s Slot Locking
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            2-Way Google Calendar Sync
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Gemini 1.5 AI Powered
          </span>
        </div>

        {/* Interactive Multi-Role Showcase Frame */}
        <div className="mt-16 mx-auto max-w-5xl rounded-3xl border border-border/80 bg-card/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* Showcase Role Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline">
                medislot.app/workspace
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-secondary/60 rounded-full p-1 border border-border/40">
              {[
                ['patient', 'Patient Portal', HeartPulse],
                ['doctor', 'Doctor Workspace', Stethoscope],
                ['ai', 'AI Pre-Visit Intake', Sparkles],
                ['admin', 'Admin Hub', ShieldCheck],
              ].map(([key, label, Icon]: any) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === key
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="rounded-2xl border border-border/60 bg-background/80 p-6 text-left min-h-[360px] flex flex-col justify-between">
            {activeTab === 'patient' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Patient Command Center
                    </span>
                    <h3 className="text-xl font-bold font-heading text-foreground mt-0.5">
                      Good morning, Akash
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 1 Upcoming Appointment Today
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-900/90 to-slate-900 text-white p-5 shadow-lg">
                    <div className="flex items-center justify-between text-xs text-teal-300 font-semibold mb-2">
                      <span>NEXT APPOINTMENT</span>
                      <span className="bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-400/30">
                        Confirmed
                      </span>
                    </div>
                    <h4 className="text-lg font-bold font-heading">Dr. Sarah Smith</h4>
                    <p className="text-sm text-teal-200">Cardiology Specialist</p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-teal-100">
                      <span className="bg-white/10 px-3 py-1.5 rounded-lg font-mono font-bold">
                        Today · 10:30 AM
                      </span>
                      <span>Google Calendar Synced 💊</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Care Pulse &amp; Adherence
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Medication Routine</span>
                      <span className="text-sm font-bold text-teal-600">92% On Track</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full w-[92%]" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Next dose: Lisinopril (10mg) at 08:00 PM
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'doctor' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Doctor Clinical Workspace
                    </span>
                    <h3 className="text-xl font-bold font-heading text-foreground mt-0.5">
                      Dr. Sarah Smith's Daily Queue
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-600">
                    <Users className="h-3.5 w-3.5" /> 8 Patients Scheduled Today
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { time: '09:00 AM', name: 'John Doe', type: 'Follow-up Consultation', status: 'Completed', tone: 'emerald' },
                    { time: '10:30 AM', name: 'Akash Singh', type: 'Chest Pain Evaluation (AI Briefed)', status: 'Confirmed', tone: 'teal' },
                    { time: '02:00 PM', name: 'Emily Davis', type: 'Annual Cardiovascular Checkup', status: 'Pending Notes', tone: 'amber' },
                  ].map((item) => (
                    <div
                      key={item.time}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono bg-secondary px-2.5 py-1 rounded-md text-foreground">
                          {item.time}
                        </span>
                        <div>
                          <strong className="text-sm block">{item.name}</strong>
                          <span className="text-xs text-muted-foreground">{item.type}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Gemini 1.5 AI Clinical Briefing
                    </span>
                    <h3 className="text-xl font-bold font-heading text-foreground mt-0.5">
                      Pre-Visit Intake Summarizer
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600">
                    <Sparkles className="h-3.5 w-3.5" /> High Priority Intake Brief
                  </span>
                </div>

                <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      Chief Complaint Summary
                    </span>
                    <span>Patient: Akash Singh</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    Patient reports recurrent mild chest discomfort during exertion for the last 3 days. No acute shortness of breath. History of mild hypertension.
                  </p>
                  <div className="pt-3 border-t border-border/60 flex flex-wrap gap-2">
                    <span className="text-xs font-semibold bg-teal-500/10 text-teal-600 px-3 py-1 rounded-full border border-teal-500/20">
                      Suggested Question: Duration of discomfort?
                    </span>
                    <span className="text-xs font-semibold bg-teal-500/10 text-teal-600 px-3 py-1 rounded-full border border-teal-500/20">
                      Check current Lisinopril dosage
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Admin Operations Center
                    </span>
                    <h3 className="text-xl font-bold font-heading text-foreground mt-0.5">
                      Platform System Health
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All Services Operational
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['Fastify REST API', 'Healthy (Port 3001)'],
                    ['PostgreSQL Database', 'Neon Cloud Connected'],
                    ['Redis Queue', 'Upstash Active'],
                    ['Gemini AI Service', 'Ready (1.5 Flash)'],
                  ].map(([title, desc]) => (
                    <div key={title} className="p-3.5 rounded-xl border border-border bg-card">
                      <span className="text-xs font-bold block text-foreground">{title}</span>
                      <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>Independent Software Project · Developed by Akash Singh</span>
              <Link href="/app" className="text-teal-600 hover:underline font-bold">
                Enter Live App Workspace &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
