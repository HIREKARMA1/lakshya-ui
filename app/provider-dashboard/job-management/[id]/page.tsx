import { redirect } from "next/navigation";

/** Legacy URL — job view uses the shared `/jobs/[id]` overview page. */
export default function ProviderJobOverviewPage({ params }: { params: { id: string } }) {
  redirect(`/jobs/${params.id}`);
}
