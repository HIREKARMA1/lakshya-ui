import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { config } from "./config";
import type {
  AdminLoginRequest,
  AuthUser,
  GoogleAuthRequest,
  SendEmailOtpRequest,
  TokenResponse,
  VerifyEmailOtpRequest,
} from "@/types/auth";
import type { Job, JobSearchResponse } from "@/types/job";
import type { SeekerListItem, SeekerSearchResponse } from "@/types/seeker";

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.fullUrl,
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use((cfg) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          cfg.headers.Authorization = `Bearer ${token}`;
        }
      }
      return cfg;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("refresh_token", response.refresh_token);
              originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
              return this.client(originalRequest);
            }
          } catch {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            if (typeof window !== "undefined") {
              window.location.href = "/login/seeker";
            }
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private setTokens(data: TokenResponse) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  async sendEmailOtp(data: SendEmailOtpRequest) {
    const res = await this.client.post("/auth/send-email-otp", data);
    return res.data;
  }

  async verifyEmailOtp(data: VerifyEmailOtpRequest): Promise<TokenResponse> {
    const res: AxiosResponse<TokenResponse> = await this.client.post("/auth/verify-email-otp", data);
    this.setTokens(res.data);
    return res.data;
  }

  async googleAuth(data: GoogleAuthRequest): Promise<TokenResponse> {
    const res: AxiosResponse<TokenResponse> = await this.client.post("/auth/google", data);
    this.setTokens(res.data);
    return res.data;
  }

  async adminLogin(data: AdminLoginRequest): Promise<TokenResponse> {
    const res: AxiosResponse<TokenResponse> = await this.client.post("/auth/login", data);
    this.setTokens(res.data);
    return res.data;
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const res: AxiosResponse<TokenResponse> = await this.client.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return res.data;
  }

  async getMe(): Promise<AuthUser> {
    const res: AxiosResponse<AuthUser> = await this.client.get("/auth/me");
    return res.data;
  }

  async logout() {
    try {
      await this.client.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  }

  async registerSeeker(formData: FormData) {
    const res = await this.client.post("/auth/register/seeker", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  async registerProvider(formData: FormData) {
    const res = await this.client.post("/auth/register/provider", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  async searchPublicJobs(params?: Record<string, string | number | boolean | undefined>) {
    const res: AxiosResponse<JobSearchResponse> = await this.client.get("/public/jobs", { params });
    return res.data;
  }

  async getPublicJob(id: string) {
    const res: AxiosResponse<Job> = await this.client.get(`/public/jobs/${id}`);
    return res.data;
  }

  async applyToJob(jobId: string) {
    const res = await this.client.post(`/jobs/${jobId}/apply`);
    return res.data;
  }

  async bookmarkJob(jobId: string) {
    const res = await this.client.post(`/jobs/${jobId}/bookmark`);
    return res.data;
  }

  async unbookmarkJob(jobId: string) {
    const res = await this.client.delete(`/jobs/${jobId}/bookmark`);
    return res.data;
  }

  async searchPublicSeekers(params?: Record<string, string | number | undefined>) {
    const res: AxiosResponse<SeekerSearchResponse> = await this.client.get("/public/seekers", {
      params,
    });
    return res.data;
  }

  async searchSeekers(params?: Record<string, string | number | undefined>) {
    const res: AxiosResponse<SeekerSearchResponse> = await this.client.get("/seekers", { params });
    return res.data;
  }

  async getSeeker(id: string): Promise<SeekerListItem> {
    const res: AxiosResponse<SeekerListItem> = await this.client.get(`/seekers/${id}`);
    return res.data;
  }
}

export const api = new ApiClient();
