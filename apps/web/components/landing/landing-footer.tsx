'use client';

import Link from 'next/link';
import { Activity } from 'lucide-react';

const productLinks = [
  { label: 'Platform Capabilities', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'AI Intake Briefing', href: '#ai-intake' },
  { label: 'Security & Control', href: '#security' },
];

const platformLinks = [
  { label: 'Patient Command Center', href: '/app' },
  { label: 'Doctor Clinical Workspace', href: '/app' },
  { label: 'Admin Operations Hub', href: '/app' },
];

const techStack = [
  'Next.js 16 (Turbopack)',
  'NestJS + Fastify REST API',
  'PostgreSQL + Prisma ORM',
  'Google Gemini 1.5 AI',
  'Upstash Redis BullMQ',
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Activity className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground font-heading">
                MediSlot
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Smart Healthcare Appointment & Patient Care Platform. Connecting patients, clinicians, and administrators with intelligent scheduling and AI pre-visit insights.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <div className="text-sm font-semibold text-foreground font-heading">Product</div>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-teal-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <div className="text-sm font-semibold text-foreground font-heading">Workspace</div>
            <ul className="mt-4 space-y-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-teal-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Architecture Tech Stack */}
          <div>
            <div className="text-sm font-semibold text-foreground font-heading">Technology Stack</div>
            <ul className="mt-4 space-y-2">
              {techStack.map((tech) => (
                <li key={tech} className="text-xs font-mono text-muted-foreground bg-secondary/60 px-2.5 py-1.5 rounded-lg border border-border/40 inline-block mr-1.5 mb-1">
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom Strip */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MediSlot · Independent Software Project Developed by Akash Singh.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by Next.js, Fastify, Prisma &amp; Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
