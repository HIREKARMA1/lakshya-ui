import { JobDetailPage } from "@/components/pages/job-detail-page";

export default function JobDetailRoute({ params }: { params: { jobId: string } }) {
  return <JobDetailPage jobId={params.jobId} />;
}
