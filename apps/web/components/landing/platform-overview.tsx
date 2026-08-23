'use client';

import {
  Activity,
  Calendar,
  Clock,
  HeartPulse,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'Atomic Double-Booking Locking',
    description: 'PostgreSQL unique composite constraints prevent concurrent race conditions so time slots can never be double-booked.',
    tag: 'Concurrency',
  },
  {
    icon: Sparkles,
    title: 'Gemini 1.5 AI Pre-Visit Briefs',
    description: 'Patient symptom descriptions are pre-summarized into clinical chief complaints, urgency levels, and suggested questions for doctor prep.',
    tag: 'AI Intake',
  },
  {
    icon: Calendar,
    title: '2-Way Google Calendar OAuth Sync',
    description: 'Appointments and medication reminders synchronize directly to doctor and patient Google Calendars in real-time.',
    tag: 'Calendar API',
  },
  {
    icon: MessageCircle,
    title: 'Direct Patient-Doctor Messaging',
    description: 'In-app clinical communication thread for post-visit follow-ups, prescription queries, and care team questions.',
    tag: 'Messaging',
  },
  {
    icon: HeartPulse,
    title: 'Medication Adherence Tracker',
    description: 'Time-blocked daily medication schedules with dose countdowns, refill notifications, and checkmark adherence tracking.',
    tag: 'Medications',
  },
  {
    icon: ShieldCheck,
    title: 'Admin Operations Hub',
    description: 'Comprehensive metrics analytics, doctor onboarding directory, leave resolution manager, and system health status monitoring.',
    tag: 'Operations',
  },
];

export function PlatformOverview() {
  return (
    <section id="features" className="py-24 bg-card/40 border-y border-border/60 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground mt-4">
            Engineered for Modern Clinical Workflows
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            MediSlot combines bulletproof scheduling architecture with AI support tools and seamless calendar integrations.
          </p>
        </div>

        {/* Bento Box 6-Card Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative rounded-3xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-500/5"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-heading text-foreground group-hover:text-teal-600 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
