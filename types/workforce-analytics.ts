export type HeatmapMetric = "supply" | "demand" | "salary" | "shortage" | "applications";

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  cell_key: string;
  city?: string | null;
  state?: string | null;
  metrics: Record<string, unknown>;
}

export interface WorkforceDashboard {
  generated_at: string;
  filters: Record<string, unknown>;
  heatmap_points: HeatmapPoint[];
  cells: Record<string, unknown>[];
  skill_demand: { role_key: string; count: number }[];
  skill_supply: { role_key: string; count: number }[];
  regional_by_state: {
    region: string;
    worker_supply: number;
    job_demand: number;
    shortage_score: number;
    cell_count: number;
  }[];
  regional_by_city: {
    region: string;
    worker_supply: number;
    job_demand: number;
    shortage_score: number;
    cell_count: number;
  }[];
  time_trends: {
    job_postings: { period: string; count: number; openings?: number }[];
    new_seekers: { period: string; count: number }[];
    applications: { period: string; count: number }[];
  };
  migration: { type: string; items: { route?: string; city?: string; count: number }[] }[];
  employer_demand: {
    role_key: string;
    active_jobs: number;
    openings: number;
    avg_salary_max: number;
  }[];
  shortage_prediction: {
    cell_key: string;
    center_lat: number;
    center_lng: number;
    city?: string | null;
    predicted_shortage_score: number;
    confidence: number;
  }[];
  totals: {
    cells: number;
    worker_supply: number;
    worker_available: number;
    job_postings: number;
    total_shortage: number;
  };
}
