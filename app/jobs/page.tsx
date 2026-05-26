import { Suspense } from "react";
import { JobsPage } from "@/components/pages/jobs-page";

export const metadata = {
  title: "Find Jobs Near You — LAKSHYA",
  description: "Browse verified blue-collar jobs across Bharat on LAKSHYA.",
};

export default function JobsRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-soft" />}>
      <JobsPage />
    </Suspense>
  );
}
