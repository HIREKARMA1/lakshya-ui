import type { Job } from "@/types/job";

export interface PublicCompanyProfile {
  id: string;
  displayName: string;
  legalName?: string;
  providerType?: string;
  incorporation?: string;
  logoUrl?: string;
  verified?: boolean;
  fullName?: string;
  phone?: string;
  email?: string;
  primaryMode?: string;
  searchAddr?: string;
  area?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  workplacePhotoUrls?: string[];
  memberSince?: string;
  activeJobsCount: number;
  activeJobs: Job[];
}

export interface PublicEmployerSummary {
  id: string;
  name: string;
}

export interface PublicEmployerNamesResponse {
  employers: PublicEmployerSummary[];
  total: number;
}
