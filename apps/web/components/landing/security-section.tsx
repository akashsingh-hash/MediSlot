'use client';

import {
  ShieldCheck,
  KeyRound,
  Users,
  Lock,
  CheckCircle2,
  MessageSquareLock,
  FileCheck,
} from 'lucide-react';

const securityFeatures = [
  {
    icon: KeyRound,
    title: 'JWT authentication',
    desc: 'Stateless, signed tokens protect every session.',
  },
  {
    icon: Users,
    title: 'Role-based access control',
    desc: 'Patients, doctors, and admins each see only what they should.',
  },
  {
    icon: Lock,
    title: 'Argon2 password hashing',
    desc: 'Passwords are hashed with a modern, memory-hard algorithm.',
  },
  {
    icon: FileCheck,
    title: 'Input validation',
    desc: 'Every request is validated before it reaches the system.',
  },
  {
    icon: MessageSquareLock,
    title: 'Secure messaging',
    desc: 'Patient-doctor communication stays within controlled access.',
  },
  {
    icon: ShieldCheck,
    title: 'Controlled access',
    desc: 'Access is scoped by role throughout the platform.',
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="relative overflow-hidden py-20 lg:py-28"
    >
      {/* Dark navy/teal background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, hsl(215 45% 12%), hsl(200 35% 8%))',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
      <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Security
            </span>
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Built with trust at the foundation.
          </h2>
          <p className="mt-5 text-pretty text-lg text-white/60">
            MediSlot is designed with layered security — from authentication
            to role-based access to secure communication — so the right people
            see the right information.
          </p>
        </div>

        <div className="reveal reveal-delay-2 mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary/25">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-base font-semibold text-white">{title}</div>
              <p className="mt-2 text-sm text-white/55">{desc}</p>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="reveal reveal-delay-3 mx-auto mt-10 flex max-w-2xl items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-white/55">
            MediSlot uses industry-standard security practices, including JWT authentication, bcrypt password hashing, and encrypted communication channels.
          </p>
        </div>
      </div>
    </section>
  );
}
