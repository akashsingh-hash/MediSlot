'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-foreground font-heading">
            Medi<span className="text-teal-600 dark:text-teal-400">Slot</span>
          </span>
        </Link>

        {/* Center Links — Explicit Flex Row Layout */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px' }} className="hidden md:flex">
          {[
            ['Features', '#features'],
            ['Specialties', '#specialties'],
            ['How It Works', '#how-it-works'],
            ['AI Pre-Visit', '#ai-intake'],
            ['Security', '#security'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-xs font-semibold text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              style={{ whiteSpace: 'nowrap' }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/app"
            className="hidden sm:inline-flex text-xs font-semibold text-foreground hover:text-teal-600 px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-4 py-2 text-xs font-bold shadow-md shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Launch Workspace
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card/95 px-4 py-5 shadow-xl md:hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-3">
            {[
              ['Features', '#features'],
              ['Specialties', '#specialties'],
              ['How It Works', '#how-it-works'],
              ['AI Pre-Visit', '#ai-intake'],
              ['Security', '#security'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-teal-600 hover:bg-secondary/50 rounded-xl transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md"
              >
                Launch Workspace
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
