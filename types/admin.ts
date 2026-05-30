export type AdminRole = "super_admin" | "admin";

export interface AdminAnalyticsOverview {
  total_jobs: number;
  active_jobs: number;
  closed_jobs: number;
  draft_jobs: number;
  total_applications: number;
  total_seekers: number;
  active_seekers: number;
  total_providers: number;
  active_providers: number;
  total_admins: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface SalaryRoleTrend {
  role_key: string;
  avg_min: number;
  avg_max: number;
  count: number;
}

export interface JobDurationStats {
  avg_days_open_active: number;
  avg_days_to_close: number;
}

export interface AdminAnalytics {
  overview: AdminAnalyticsOverview;
  jobs_by_status: LabelCount[];
  jobs_over_time: LabelCount[];
  applications_by_status: LabelCount[];
  applications_over_time: LabelCount[];
  salary_buckets: LabelCount[];
  salary_by_role: SalaryRoleTrend[];
  skills_trends: LabelCount[];
  experience_on_jobs: LabelCount[];
  seeker_experience: LabelCount[];
  gender_distribution: LabelCount[];
  job_types: LabelCount[];
  job_duration: JobDurationStats;
  days_open_histogram: LabelCount[];
  selection_funnel: LabelCount[];
}

export interface SeekerAdminRow {
  id: string;
  email: string;
  is_active: boolean;
  profile_complete: boolean;
  full_name?: string | null;
  city?: string | null;
  primary_skill?: string | null;
  gender?: string | null;
  exp_years?: number | null;
  created_at?: string | null;
}

export interface ProviderAdminRow {
  id: string;
  email: string;
  is_active: boolean;
  profile_complete: boolean;
  full_name?: string | null;
  legal_name?: string | null;
  city?: string | null;
  provider_type?: string | null;
  phone?: string | null;
  verified?: boolean | null;
  created_at?: string | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name?: string | null;
  admin_role: AdminRole;
  is_active: boolean;
  created_at?: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
