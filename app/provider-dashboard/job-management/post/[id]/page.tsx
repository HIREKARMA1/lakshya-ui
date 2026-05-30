import { PostJobWizard } from "@/components/provider-dashboard/PostJobWizard";

export default function EditPostJobPage({ params }: { params: { id: string } }) {
  return <PostJobWizard editJobId={params.id} />;
}
