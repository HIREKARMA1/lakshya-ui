import type { WorkerAvailabilityStatus } from "@/types/worker-availability";

export interface SeekerWorkerProfile {
  id: string;
  full_name?: string | null;
  photo_url?: string | null;
  has_resume: boolean;
  gender?: string | null;
  dob?: string | null;
  age?: string | null;
  education_key?: string | null;
  primary_skill?: string | null;
  preferred_role?: string | null;
  experience?: string | null;
  exp_years: number;
  role_key: string;
  pincode?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  exact_location?: string | null;
  verified: boolean;
  aadhaar_verified: boolean;
  availability: WorkerAvailabilityStatus;
}
