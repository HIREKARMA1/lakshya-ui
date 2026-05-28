export type UserType = "seeker" | "provider" | "admin";

export interface SeekerProfile {
  full_name?: string;
  photo_url?: string;
  resume_url?: string;
  city?: string;
  district?: string;
  state?: string;
  primary_skill?: string;
  experience?: string;
  preferred_role?: string;
  pincode?: string;
  gender?: string;
  dob?: string;
  age?: string;
  education_key?: string;
}

export interface ProviderProfile {
  provider_type?: string;
  full_name?: string;
  legal_name?: string;
  incorporation?: string;
  search_addr?: string;
  pincode?: string;
  area?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  phone?: string;
  email?: string;
  primary_mode?: string;
  logo_url?: string;
  doc_url?: string;
  verified?: boolean;
}

export interface SeekerProfileUpdatePayload {
  full_name?: string;
  dob?: string;
  age?: string;
  gender?: string;
  education_key?: string;
  primary_skill?: string;
  experience?: string;
  preferred_role?: string;
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_type: UserType;
  name?: string;
  profile_complete: boolean;
  seeker_profile?: SeekerProfile | null;
  provider_profile?: ProviderProfile | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface SendEmailOtpRequest {
  email: string;
  role: "seeker" | "provider";
}

export interface VerifyEmailOtpRequest {
  email: string;
  code: string;
  role: "seeker" | "provider";
}

export interface GoogleAuthRequest {
  id_token: string;
  role: "seeker" | "provider";
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}
