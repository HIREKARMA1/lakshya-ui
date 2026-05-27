import { PageLoader } from "@/components/ui/Spinner";

/** Default React Suspense fallback — spinner centered in the viewport. */
export function SuspenseLoader({ label }: { label?: string }) {
  return <PageLoader label={label} variant="page" className="bg-soft" />;
}
