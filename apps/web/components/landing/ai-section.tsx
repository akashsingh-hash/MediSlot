'use client';

import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AISection() {
  return (
    <section id="ai-intake" className="py-24 bg-card/60 border-y border-border/60 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left Description */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Google Gemini 1.5
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground leading-tight">
              Intelligent Pre-Visit Summaries for Better Consultation Prep
            </h2>

            <p className="text-muted-foreground text-base leading-relaxed">
              When patients book appointments, MediSlot's Gemini AI pipeline automatically analyzes symptom notes to generate structured clinical briefs for doctors before the visit starts.
            </p>

            <ul className="space-y-3 text-sm text-foreground">
              {[
                'Automatic Urgency Categorization (HIGH / MEDIUM / LOW)',
                'Structured Chief Complaint Summaries',
                'Pre-generated Consultation Question Suggestions',
                'Zero Medical Diagnosis Claims — Built strictly for clinician preparation',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 text-white px-6 py-3 text-xs font-bold shadow-md hover:bg-teal-500 transition-all"
              >
                Try AI Intake in App
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Card Feature Preview */}
          <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 p-7 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
                Gemini AI Clinical Briefing #4092
              </span>
              <span className="text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30 font-bold">
                Urgency: High
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">CHIEF COMPLAINT</span>
              <p className="text-sm text-slate-100 leading-relaxed font-medium">
                "Patient reports recurrent chest tightness during light exercise for 3 days. No shortness of breath. Taking Lisinopril 10mg."
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-xs text-teal-400 font-bold block uppercase tracking-wider">
                SUGGESTED DIAGNOSTIC QUESTIONS
              </span>
              <div className="flex flex-col gap-2">
                <span className="text-xs bg-white/5 p-2.5 rounded-xl border border-white/10 text-slate-200">
                  1. Does pain radiate down the left arm or back?
                </span>
                <span className="text-xs bg-white/5 p-2.5 rounded-xl border border-white/10 text-slate-200">
                  2. Evaluate blood pressure adherence and medication dosage.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
