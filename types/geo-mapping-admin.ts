export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type PincodeRow = {
  pincode: string;
  district?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  mapping_count: number;
};

export type ConstituencyRow = {
  id: string;
  code: string;
  name: string;
  constituency_type: string;
  state: string;
  district?: string | null;
  parent_lok_sabha_id?: string | null;
  parent_lok_sabha_name?: string | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  is_active: boolean;
  mapping_count: number;
};

export type MappingRow = {
  id: string;
  pincode: string;
  constituency_id: string;
  constituency_code: string;
  constituency_name: string;
  constituency_type: string;
  state: string;
  weight: number;
  effective_from?: string | null;
  effective_to?: string | null;
};

export type PincodeResolveResult = {
  pincode?: string | null;
  valid: boolean;
  mappings: Array<{
    constituency_id: string;
    code: string;
    name: string;
    type: string;
    state: string;
    weight: number;
  }>;
  pincode_meta?: { district?: string; state?: string } | null;
  primary_lok_sabha?: { name?: string; state?: string } | null;
  primary_vidhan_sabha?: { name?: string; state?: string } | null;
};
