'use client';

import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { TrustStrip } from '@/components/landing/trust-strip';
import { PlatformOverview } from '@/components/landing/platform-overview';
import { PatientSection } from '@/components/landing/patient-section';
import { DoctorSection } from '@/components/landing/doctor-section';
import { AISection } from '@/components/landing/ai-section';
import { ReliabilitySection } from '@/components/landing/reliability-section';
import { SecuritySection } from '@/components/landing/security-section';
import { RoleShowcase } from '@/components/landing/role-showcase';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FinalCTA } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function Home() {
  useScrollReveal();

  return (
    <>
      <LandingNavbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <PlatformOverview />
        <PatientSection />
        <DoctorSection />
        <AISection />
        <ReliabilitySection />
        <SecuritySection />
        <RoleShowcase />
        <HowItWorks />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
