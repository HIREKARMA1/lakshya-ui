"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ContactPageHeader } from "@/components/contact/ContactPageHeader";
import { ContactReachSection } from "@/components/contact/ContactReachSection";
import { ContactHelpSection } from "@/components/contact/ContactHelpSection";
import {
  ContactHoursSection,
  ContactOfficeSection,
  ContactSafetySection,
} from "@/components/contact/ContactInfoSections";
import "@/lib/i18n";

export function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <ContactPageHeader />

      <section className="bg-soft">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="space-y-6 lg:col-span-7">
              <ContactReachSection />
              <ContactHelpSection />
            </div>

            <aside className="space-y-6 lg:col-span-5">
              <ContactOfficeSection />
              <ContactHoursSection />
              <ContactSafetySection />
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
