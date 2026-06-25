import { ProviderWorkerOverviewContent } from "@/components/provider-dashboard/ProviderWorkerOverviewContent";

export default function ProviderWorkerProfilePage({ params }: { params: { id: string } }) {
  return <ProviderWorkerOverviewContent workerId={params.id} />;
}
