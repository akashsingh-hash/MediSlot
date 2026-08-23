'use client';

import {
  Calendar,
  Sparkles,
  MessageSquare,
  Pill,
  UserCog,
  ShieldCheck,
} from 'lucide-react';

const items = [
  { icon: Calendar, label: 'Appointments' },
  { icon: Sparkles, label: 'AI-assisted care' },
  { icon: MessageSquare, label: 'Secure messaging' },
  { icon: Pill, label: 'Prescriptions' },
  { icon: UserCog, label: 'Doctor management' },
  { icon: ShieldCheck, label: 'Role-based workflows' },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border/60 bg-background-subtle/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-6 sm:grid-cols-3 lg:grid-cols-6">
          {items.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className={`reveal reveal-delay-${i + 1} flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground`}
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
