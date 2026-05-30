export type JobType = "fullTime" | "partTime";
export type ExpKey = "fresher" | "exp12" | "exp35" | "exp57" | "exp10plus";
export type EmploymentLabel = "fullTime" | "partTime" | "internship" | "contractual" | "freelancer";

export interface JobExtra {
  display_exp_key?: string;
  questions?: { id: string; question: string; required: boolean }[];
  publishMode?: "postNow" | "scheduleLater";
  scheduledAt?: string;
  videoUrl?: string;
  searchAddr?: string;
}

export interface Job {
  id: string;
  roleKey: string;
  company: string;
  verified: boolean;
  urgent: boolean;
  city: string;
  salaryMin: number;
  salaryMax: number;
  type: JobType;
  expKey: ExpKey;
  postedDays: number;
  applied: number;
  openings: number;
  description?: string;
  requirements?: string[];
  responsibilities?: (string | { title: string; body: string })[];
  industry?: string;
  skills?: string[];
  education?: string;
  hours?: string;
  shifts?: string[];
  status?: string;
  title?: string;
  pincode?: string;
  state?: string;
  contactPhone?: string;
  contactEmail?: string;
  applicationDeadline?: string;
  benefits?: string[];
  joiningProcess?: string;
  workFromHome?: boolean;
  employmentLabel?: string;
  extra?: JobExtra;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  providerId?: string;
  companyLogoUrl?: string;
}

export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface ProviderJobUpsertPayload {
  role_key: string;
  city: string;
  salary_min: number;
  salary_max: number;
  job_type: JobType;
  exp_key: ExpKey;
  openings: number;
  company?: string;
  urgent?: boolean;
  verified?: boolean;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  industry?: string;
  skills?: string[];
  education?: string;
  hours?: string;
  shifts?: string[];
  status?: string;
  title?: string;
  pincode?: string;
  state?: string;
  contact_phone?: string;
  contact_email?: string;
  application_deadline?: string;
  benefits?: string[];
  joining_process?: string;
  work_from_home?: boolean;
  employment_label?: string;
  extra?: JobExtra;
}
