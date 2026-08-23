'use client';

import {
  Search,
  Calendar,
  Activity,
  Pill,
  MessageSquare,
  Sparkles,
  Stethoscope,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
} from 'lucide-react';

import { Badge } from '@/components/landing-ui/badge';

const features = [
  { icon: Search, title: 'Find a doctor', desc: 'Search by specialty, location, and availability.' },
  { icon: Calendar, title: 'Smart booking', desc: 'Get intelligent slot recommendations that fit your schedule.' },
  { icon: Activity, title: 'Appointment tracking', desc: 'See upcoming, past, and current appointment status at a glance.' },
  { icon: Pill, title: 'Medication management', desc: 'View prescriptions and track your medication schedule.' },
  { icon: MessageSquare, title: 'Secure messaging', desc: 'Message your healthcare providers safely within MediSlot.' },
  { icon: Sparkles, title: 'Pre-visit symptom analysis', desc: 'AI helps structure your symptoms before the visit.' },
];

export function PatientSection() {
  return (
    <section id="patients" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — mockup */}
          <div className="reveal order-2 lg:order-1">
            <PatientMockup />
          </div>

          {/* Right — content */}
          <div className="reveal reveal-delay-2 order-1 lg:order-2">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              For patients
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Healthcare that feels easier.
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Find the right doctor, book with confidence, and keep your whole
              care journey in one place — from symptoms to prescriptions.
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
        </div>
      </div>
    </section>
  );
}

function PatientMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/8 to-transparent blur-2xl" aria-hidden />

      <div className="relative rounded-2xl border border-border bg-card shadow-float overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-background-subtle/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Find a doctor</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cardiology near you...</span>
          </div>

          {/* Doctor result card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Dr. Sarah Chen</div>
                  <div className="flex items-center gap-0.5 text-xs text-warning">
                    <Star className="h-3 w-3 fill-current" />
                    4.9
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Cardiology · 8 years exp</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Riverside Health Center
                </div>
              </div>
            </div>

            {/* Available slots */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Next available:</span>
              {['Thu 10:30', 'Fri 2:00', 'Mon 9:00'].map((slot, i) => (
                <div
                  key={slot}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    i === 0
                      ? 'gradient-primary text-primary-foreground'
                      : 'border border-border bg-background text-muted-foreground'
                  }`}
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>

          {/* AI symptom analysis card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Pre-visit symptom analysis</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              You described: fatigue, mild chest discomfort. AI has structured
              this into a summary your doctor will see before your visit.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Summary ready for Dr. Chen
            </div>
          </div>

          {/* Upcoming appointment */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Upcoming appointment</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Thu, Aug 28 · 10:30 AM
                </div>
              </div>
            </div>
            <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
              Confirmed
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
