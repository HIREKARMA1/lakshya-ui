import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Categories } from "@/components/landing/Categories";
import { Nearby } from "@/components/landing/Nearby";
import { ReferEarn } from "@/components/landing/ReferEarn";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Vision } from "@/components/landing/Vision";
import { WhatWeDo } from "@/components/landing/WhatWeDo";
import { Employers } from "@/components/landing/Employers";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Categories />
      <Nearby />
      <ReferEarn />
      <HowItWorks />
      <Vision />
      <WhatWeDo />
      <Employers />
      <Footer />
    </main>
  );
}
