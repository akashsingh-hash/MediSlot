'use client';

import * as React from 'react';
import {
  User,
  Stethoscope,
  ShieldCheck,
  Calendar,
  Search,
  Pill,
  MessageSquare,
  Sparkles,
  CalendarDays,
  History,
  FileText,
  CalendarClock,
  Users,
  Activity,
  BarChart3,
  CheckSquare,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type Role = 'patient' | 'doctor' | 'admin';

const roles: Record<
  Role,
  {
    label: string;
    icon: typeof User;
    headline: string;
    desc: string;
    capabilities: { icon: typeof Calendar; label: string }[];
  }
> = {
  patient: {
    label: 'Patient',
    icon: User,
    headline: 'Manage your care, all in one place',
    desc: 'Find doctors, book appointments, track medications, and message your care team — all from a single, connected experience.',
    capabilities: [
      { icon: Search, label: 'Find a doctor' },
      { icon: Calendar, label: 'Book appointments' },
      { icon: Activity, label: 'Track care pulse' },
      { icon: Pill, label: 'Manage medications' },
      { icon: MessageSquare, label: 'Message providers' },
      { icon: Sparkles, label: 'Pre-visit symptom analysis' },
    ],
  },
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    headline: 'Focus on care, not paperwork',
    desc: 'Review patient history, generate clinical summaries, manage prescriptions, and coordinate your schedule — with AI-assisted context.',
    capabilities: [
      { icon: CalendarDays, label: "Today's appointments" },
      { icon: History, label: 'Patient history' },
      { icon: Sparkles, label: 'AI clinical assistant' },
      { icon: FileText, label: 'Clinical summaries' },
      { icon: CalendarClock, label: 'Schedule & leave' },
      { icon: MessageSquare, label: 'Patient communication' },
    ],
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    headline: 'Keep the system running smoothly',
    desc: 'Manage doctors, monitor appointments, oversee availability, and view system-wide analytics across the healthcare platform.',
    capabilities: [
      { icon: Users, label: 'Manage doctors' },
      { icon: Calendar, label: 'Monitor appointments' },
      { icon: CalendarClock, label: 'Leave & availability' },
      { icon: BarChart3, label: 'System analytics' },
      { icon: Activity, label: 'System activity' },
      { icon: CheckSquare, label: 'Performance monitoring' },
    ],
  },
};

export function RoleShowcase() {
  const [activeRole, setActiveRole] = React.useState<Role>('patient');
  const current = roles[activeRole];

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            One platform, three roles
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for everyone in the care journey.
          </h2>
          <p className="mt-5 text-pretty text-lg text-muted-foreground">
            Select a role to see how MediSlot supports each part of the
            healthcare experience.
          </p>
        </div>

        {/* Role selector */}
        <div className="reveal reveal-delay-2 mt-10 flex justify-center">
          <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-soft">
            {(Object.keys(roles) as Role[]).map((role) => {
              const Icon = roles[role].icon;
              return (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all sm:px-6',
                    activeRole === role
                      ? 'gradient-primary text-primary-foreground shadow-glow'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {roles[role].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Role preview */}
        <div className="reveal reveal-delay-3 mt-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left — text */}
            <div key={activeRole} className="animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                  <current.icon className="h-6 w-6" />
                </div>
                <div className="text-xl font-semibold">{current.label}</div>
              </div>
              <h3 className="text-balance text-2xl font-semibold tracking-tight">
                {current.headline}
              </h3>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                {current.desc}
              </p>
            </div>

            {/* Right — capabilities grid */}
            <div key={`${activeRole}-caps`} className="animate-fade-in">
              <div className="grid gap-3 sm:grid-cols-2">
                {current.capabilities.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
