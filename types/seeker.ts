export interface SeekerListItem {
  id: string;
  name: string;
  roleKey: string;
  city: string;
  lastSalary: number;
  expYears: number;
  educationKey: "10th" | "12th" | "iti";
  activeDays: number;
}

export interface SeekerSearchResponse {
  seekers: SeekerListItem[];
  total: number;
  page: number;
  limit: number;
}
