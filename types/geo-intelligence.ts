export interface GeoIntelligenceDashboard {
  summary: {
    constituency_count: number;
    avg_wri: number;
    high_risk_count: number;
  };
  constituencies: ConstituencyCard[];
  heatmap_points: { lat: number; lng: number; weight: number; label?: string; wri?: number }[];
  migration_flows: MigrationFlow[];
  claim_vs_reality: ClaimComparison[];
  wage_by_skill: { skill: string; avg_wage: number }[];
  alerts: GeoAlert[];
  wri_leaderboard: ConstituencyCard[];
}

export interface ConstituencyCard {
  constituency_id: string;
  code: string;
  name: string;
  type: string;
  state: string;
  district?: string | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  jobs_posted: number;
  openings: number;
  applications: number;
  active_workers: number;
  inactive_workers: number;
  unemployment_risk_score: number;
  median_wage: number;
  workforce_reality_index: number;
  employers: number;
}

export interface MigrationFlow {
  origin_id: string;
  origin_name: string;
  dest_id: string;
  dest_name: string;
  flow_count: number;
}

export interface ClaimComparison {
  constituency_id: string;
  constituency_name: string;
  claimed_employed: number;
  platform_employed: number;
  delta: number;
  accuracy_score: number;
  over_reporting: boolean;
  under_reporting: boolean;
  claim_source?: string | null;
  effective_date: string;
}

export interface GeoAlert {
  constituency_id?: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message?: string | null;
  metric_value?: number | null;
  threshold_value?: number | null;
}
