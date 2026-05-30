"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProgressiveHeroJobs } from "@/hooks/useProgressiveHeroJobs";
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
import "@/lib/i18n";

export function HomePage() {
  const { jobs: heroJobs, isInitialLoading: isHeroLoading } = useProgressiveHeroJobs();
  const { data: categoriesData } = useQuery({
    queryKey: ["public-jobs", "home-categories"],
    queryFn: () => api.searchPublicJobs({ limit: 50, page: 1 }),
    retry: false,
    staleTime: 60_000,
  });
  const categoryJobs =
    categoriesData?.jobs && categoriesData.jobs.length > 0 ? categoriesData.jobs : heroJobs;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero jobs={heroJobs} isLoading={isHeroLoading} />
      <Categories jobs={categoryJobs} />
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
