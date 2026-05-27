import { Suspense } from "react";
import { RegisterSeeker } from "@/components/auth/RegisterSeeker";
import { SuspenseLoader } from "@/components/ui/SuspenseLoader";

export default function RegisterSeekerPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <RegisterSeeker />
    </Suspense>
  );
}
