export type AvailabilityWindow = "now" | "today" | "tomorrow" | "next_week";
export type ShiftPreference = "day" | "night" | "rotational";

export interface WorkerAvailabilityUpsert {
  availability_window: AvailabilityWindow;
  shift_preference: ShiftPreference;
  expected_daily_wage?: number | null;
  max_travel_km: number;
  emergency_join: boolean;
  join_within_hours: number;
  lat?: number | null;
  lng?: number | null;
  location_label?: string | null;
}

export interface WorkerAvailabilityStatus {
  is_live: boolean;
  seeker_id: string;
  availability_window?: AvailabilityWindow | null;
  shift_preference?: ShiftPreference | null;
  expected_daily_wage?: number | null;
  max_travel_km?: number | null;
  emergency_join?: boolean;
  join_within_hours?: number | null;
  lat?: number | null;
  lng?: number | null;
  location_label?: string | null;
  expires_at?: string | null;
  updated_at?: string | null;
}

export interface AvailableWorker {
  id: string;
  name: string;
  roleKey: string;
  city: string;
  expYears: number;
  educationKey: string;
  primarySkill?: string | null;
  experience?: string | null;
  trustScore: number;
  shiftPreference: string;
  expectedDailyWage?: number | null;
  maxTravelKm: number;
  emergencyJoin: boolean;
  joinWithinHours: number;
  availabilityWindow: string;
  distanceKm: number;
  lat?: number | null;
  lng?: number | null;
  photoUrl?: string | null;
  expiresAt?: string | null;
}

export interface AvailableWorkersResponse {
  workers: AvailableWorker[];
  total: number;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  refreshed_at: string;
}
