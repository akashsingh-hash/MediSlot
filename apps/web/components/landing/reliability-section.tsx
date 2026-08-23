'use client';

import { User, User2, Lock, CheckCircle2, XCircle, Database } from 'lucide-react';

export function ReliabilitySection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — content */}
          <div className="reveal">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Reliability
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Appointments you can trust.
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              MediSlot's booking architecture is designed to prevent
              conflicting appointments. When a slot is requested, the system
              protects the booking so only one appointment is ever confirmed
              for a given time.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="text-sm font-semibold">No double bookings</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    Transaction-level protection ensures each slot is held by one patient at a time.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Consistent state</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    Appointment data stays accurate across patients, doctors, and administrators.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — visualization */}
          <div className="reveal reveal-delay-2">
            <ReliabilityVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}

function ReliabilityVisualization() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-float">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent blur-2xl" aria-hidden />

      <div className="relative space-y-6">
        {/* Two patients requesting the same slot */}
        <div className="grid grid-cols-2 gap-4">
          {/* Patient A */}
          <div className="rounded-xl border border-border bg-background-subtle/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold">Patient A</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Requests Thu 10:30
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3 w-3" />
              Booking confirmed
            </div>
          </div>

          {/* Patient B */}
          <div className="rounded-xl border border-border bg-background-subtle/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold">Patient B</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Requests Thu 10:30
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
              <XCircle className="h-3 w-3" />
              Slot already taken
            </div>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
            <svg
              className="h-4 w-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Transaction layer */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Transaction protection</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            The booking is wrapped in a protected transaction. The slot is
            locked while Patient A's booking completes, so Patient B's request
            is safely rejected rather than creating a conflict.
          </p>
        </div>

        {/* Result */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">One confirmed booking</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="h-3 w-3" />
            No conflict
          </div>
        </div>
      </div>
    </div>
  );
}
