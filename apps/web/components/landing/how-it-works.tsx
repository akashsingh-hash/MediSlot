'use client';

import { Calendar, CheckCircle2, Search, Sparkles } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Search,
    title: 'Discover Specialist',
    description: 'Filter clinicians by specialty (Cardiology, Dermatology, Neurology, etc.), rating, and experience.',
  },
  {
    step: '02',
    icon: Calendar,
    title: 'Reserve Time Slot',
    description: 'Interactive slot picker with instant database-level locking to prevent double-bookings.',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'AI Symptom Briefing',
    description: 'Provide visit reasons for Gemini 1.5 to structure clinical briefs and questions for your doctor.',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Sync & Attend',
    description: 'Receive instant confirmation and automatic 2-way sync to your Google Calendar.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
            Simple Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground mt-4">
            How MediSlot Delivers Care
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            From specialist discovery to AI intake and Google Calendar sync in 4 seamless steps.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl">
                      {s.step}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-foreground mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
