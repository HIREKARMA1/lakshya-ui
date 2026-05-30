import type { Job } from "@/types/job";

export type AdminJobRow = {
  id: string;
  title?: string | null;
  roleKey: string;
  company: string;
  city: string;
  state?: string | null;
  status?: string | null;
  salaryMin: number;
  salaryMax: number;
  type: string;
  expKey: string;
  openings: number;
  applied: number;
  postedDays: number;
  urgent: boolean;
  verified: boolean;
  provider_id?: string | null;
  provider_email?: string | null;
  provider_name?: string | null;
};

export type PaginatedAdminJobs = {
  items: AdminJobRow[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminJobDetail = {
  job: Job;
  provider_id?: string | null;
  provider_email?: string | null;
  provider_name?: string | null;
};
