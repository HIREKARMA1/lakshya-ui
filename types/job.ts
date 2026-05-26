export type JobType = "fullTime" | "partTime";
export type ExpKey = "fresher" | "exp12" | "exp35";

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
}

export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}
