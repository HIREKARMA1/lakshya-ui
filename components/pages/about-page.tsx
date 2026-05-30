"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AboutPageHeader } from "@/components/about/AboutPageHeader";
import { AboutStorySection } from "@/components/about/AboutStorySection";
import { AboutHighlightsSection } from "@/components/about/AboutHighlightsSection";
import { AboutImpactSection } from "@/components/about/AboutImpactSection";
import { AboutSectorsSection } from "@/components/about/AboutSectorsSection";
import { AboutJourneySection } from "@/components/about/AboutJourneySection";
import { AboutExploreSection } from "@/components/about/AboutExploreSection";
import "@/lib/i18n";

export function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <AboutPageHeader />
      <AboutStorySection />
      <AboutHighlightsSection />
      <AboutImpactSection />
      <AboutSectorsSection />
      <AboutJourneySection />
      <AboutExploreSection />
      <Footer />
    </main>
  );
}
