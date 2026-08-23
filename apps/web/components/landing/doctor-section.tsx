'use client';

import {
  CalendarDays,
  History,
  Sparkles,
  Pill,
  CalendarClock,
  MessageSquare,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { Badge } from '@/components/landing-ui/badge';

const features = [
  { icon: CalendarDays, title: "Today's appointments", desc: 'A clear daily schedule with patient context at every step.' },
  { icon: History, title: 'Patient history', desc: 'Review relevant history before each consultation.' },
  { icon: Sparkles, title: 'AI clinical assistant', desc: 'Pre-visit summaries and post-visit note generation.' },
  { icon: Pill, title: 'Prescriptions', desc: 'Create and manage prescriptions directly from the visit.' },
  { icon: CalendarClock, title: 'Schedule & leave management', desc: 'Set availability and plan leave without conflicts.' },
  { icon: MessageSquare, title: 'Patient communication', desc: 'Answer patient questions through secure messaging.' },
];

export function DoctorSection() {
  return (
    <section id="specialties" className="relative py-20 lg:py-28 overflow-hidden">
      {/* Subtle contrasting background */}
      <div className="absolute inset-0 bg-background-subtle/50" aria-hidden />
      <div className="absolute inset-0 bg-dots opacity-30" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — content */}
          <div className="reveal">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              For doctors
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Give clinicians more context, not more clutter.
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              MediSlot surfaces the right information at the right time — so
              clinicians can focus on care, not paperwork.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="group">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{title}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {desc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mockup */}
          <div className="reveal reveal-delay-2">
            <DoctorMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function DoctorMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tl from-primary/8 to-transparent blur-2xl" aria-hidden />

      <div className="relative rounded-2xl border border-border bg-card shadow-float overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-background-subtle/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Dr. Chen's day</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              4 appointments
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Today', value: '4' },
              { label: 'Pending', value: '2' },
              { label: 'Messages', value: '7' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-background-subtle/40 p-2.5 text-center"
              >
                <div className="text-lg font-semibold">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* AI summary card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">AI pre-visit summary</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                Reports fatigue, mild chest discomfort for ~5 days
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                Current meds: Lisinopril, Metformin
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                No known allergies
              </div>
            </div>
          </div>

          {/* Appointment list */}
          <div className="space-y-2">
            {[
              { time: '10:30', name: 'Alex Morgan', status: 'confirmed', active: true },
              { time: '11:15', name: 'Jamie Rivera', status: 'confirmed', active: false },
              { time: '13:00', name: 'Sam Park', status: 'pending', active: false },
            ].map((apt) => (
              <div
                key={apt.name}
                className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                  apt.active
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-subtle/60">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{apt.time} · {apt.name}</div>
                    <div className="text-[10px] text-muted-foreground">Follow-up</div>
                  </div>
                </div>
                {apt.status === 'confirmed' ? (
                  <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Confirmed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                    Pending
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Post-visit summary action */}
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background-subtle/30 p-2.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              Generate post-visit clinical summary
            </span>
            <Badge variant="outline" className="ml-auto text-[10px] border-primary/20 text-primary">
              AI
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
