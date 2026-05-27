import { Suspense } from "react";
import { JobsContent } from "@/components/dashboard/JobsContent";
import { SectionLoader } from "@/components/ui/Spinner";

export default function DashboardJobsPage() {
  return (
    <Suspense fallback={<SectionLoader />}>
      <JobsContent />
    </Suspense>
  );
}
