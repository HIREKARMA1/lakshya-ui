export type UserType = "seeker" | "provider" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  user_type: UserType;
  name?: string;
  profile_complete: boolean;
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
