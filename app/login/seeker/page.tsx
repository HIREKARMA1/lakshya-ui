import { Suspense } from "react";
import { LoginCard } from "@/components/auth/LoginCard";
import { SuspenseLoader } from "@/components/ui/SuspenseLoader";

export default function LoginSeekerPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <LoginCard role="seeker" />
    </Suspense>
  );
}
