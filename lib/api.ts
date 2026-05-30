import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { config } from "./config";
import type {
  AdminLoginRequest,
  AuthUser,
  GoogleAuthRequest,
  ProviderProfileUpdatePayload,
  SeekerProfileUpdatePayload,
  SendEmailOtpRequest,
  TokenResponse,
  VerifyEmailOtpRequest,
} from "@/types/auth";
import type { AdminJobDetail, AdminJobRow, PaginatedAdminJobs } from "@/types/admin-job";
import type { Job, JobSearchResponse, ProviderJobUpsertPayload } from "@/types/job";
import type { PublicCompanyProfile, PublicEmployerNamesResponse } from "@/types/company";
import type { JobNearbySearchResponse } from "@/types/nearby-jobs";
import type { GeoIntelligenceDashboard } from "@/types/geo-intelligence";
import type {
  ConstituencyRow,
  MappingRow,
  PincodeResolveResult,
  PincodeRow,
} from "@/types/geo-mapping-admin";
import type { WorkforceDashboard } from "@/types/workforce-analytics";
import type {
  AvailableWorkersResponse,
  WorkerAvailabilityStatus,
  WorkerAvailabilityUpsert,
} from "@/types/worker-availability";
import type {
  AdminAnalytics,
  AdminUserRow,
  Paginated,
  ProviderAdminRow,
  SeekerAdminRow,
} from "@/types/admin";
import type { SeekerListItem, SeekerSearchResponse } from "@/types/seeker";

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.fullUrl,
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use((cfg) => {
      if (cfg.data instanceof FormData) {
        delete cfg.headers["Content-Type"];
      }
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
            const cachedUser = localStorage.getItem("user");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            if (typeof window !== "undefined") {
              let loginPath = "/login/seeker";
              if (cachedUser) {
                try {
                  const parsed = JSON.parse(cachedUser) as { user_type?: string };
                  if (parsed.user_type === "provider") loginPath = "/login/provider";
                  else if (parsed.user_type === "admin") loginPath = "/login/admin";
                } catch {
                  // fallback to seeker login
                }
              }
              window.location.href = loginPath;
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
    const res = await this.client.post("/auth/register/seeker", formData);
    return res.data;
  }

  async uploadSeekerProfilePhoto(file: File) {
    const fd = new FormData();
    fd.append("photo", file);
    const res = await this.client.post<{ photo_url: string }>("/auth/me/seeker/photo", fd);
    return res.data;
  }

  async uploadSeekerResume(file: File) {
    const fd = new FormData();
    fd.append("resume", file);
    const res = await this.client.post<{ resume_url: string }>("/auth/me/seeker/resume", fd);
    return res.data;
  }

  async deleteSeekerResume() {
    const res = await this.client.delete<{ message: string }>("/auth/me/seeker/resume");
    return res.data;
  }

  async getSeekerResumeViewUrl() {
    const res = await this.client.get<{ view_url: string | null }>("/auth/me/seeker/resume/view");
    return res.data;
  }

  async fetchSeekerResumeFile() {
    const res = await this.client.get<Blob>("/auth/me/seeker/resume/file", { responseType: "blob" });
    return res.data;
  }

  async updateSeekerProfile(payload: SeekerProfileUpdatePayload) {
    const res = await this.client.patch<AuthUser>("/auth/me/seeker", payload);
    return res.data;
  }

  async updateProviderProfile(payload: ProviderProfileUpdatePayload) {
    const res = await this.client.patch<AuthUser>("/auth/me/provider", payload);
    return res.data;
  }

  async uploadProviderLogo(logo: File) {
    const fd = new FormData();
    fd.append("logo", logo);
    const res = await this.client.post<{ photo_url: string }>("/auth/me/provider/logo", fd);
    return res.data;
  }

  async uploadProviderDoc(doc: File) {
    const fd = new FormData();
    fd.append("doc", doc);
    const res = await this.client.post("/auth/me/provider/doc", fd);
    return res.data;
  }

  async addProviderWorkplacePhotos(photos: File[]) {
    const fd = new FormData();
    photos.forEach((file) => fd.append("photos", file));
    const res = await this.client.post<AuthUser>("/auth/me/provider/workplace-photos", fd);
    return res.data;
  }

  async deleteProviderWorkplacePhoto(index: number) {
    const res = await this.client.delete<AuthUser>("/auth/me/provider/workplace-photos", {
      params: { index },
    });
    return res.data;
  }

  async registerProvider(formData: FormData) {
    const res = await this.client.post("/auth/register/provider", formData);
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

  async getPublicCompany(providerId: string) {
    const res: AxiosResponse<PublicCompanyProfile> = await this.client.get(
      `/public/companies/${providerId}`,
    );
    return res.data;
  }

  async listPublicEmployerNames(limit = 50) {
    const res: AxiosResponse<PublicEmployerNamesResponse> = await this.client.get(
      "/public/companies/employers/names",
      { params: { limit } },
    );
    return res.data;
  }

  /** Public job first; if missing and user is provider, load own posting (draft/closed). */
  async fetchJobDetail(jobId: string, options?: { allowProviderFallback?: boolean }) {
    try {
      return await this.getPublicJob(jobId);
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404 && options?.allowProviderFallback) {
        return await this.getProviderJob(jobId);
      }
      throw err;
    }
  }

  async searchNearbyJobs(params?: {
    lat?: number;
    lng?: number;
    q?: string;
    radius_km?: number;
    limit?: number;
    travel_mode?: string;
  }) {
    const res: AxiosResponse<JobNearbySearchResponse> = await this.client.get("/public/jobs/nearby", {
      params,
    });
    return res.data;
  }

  async searchNearbyJobsForMe(params?: {
    lat?: number;
    lng?: number;
    q?: string;
    radius_km?: number;
    limit?: number;
    travel_mode?: string;
  }) {
    const res: AxiosResponse<JobNearbySearchResponse> = await this.client.get("/jobs/nearby/me", {
      params,
    });
    return res.data;
  }

  async fetchJobTravelTimes(payload: {
    origin_lat: number;
    origin_lng: number;
    job_ids: string[];
    travel_mode: string;
  }) {
    const res: AxiosResponse<{ travel_mode: string; jobs: JobNearbySearchResponse["jobs"] }> =
      await this.client.post("/public/jobs/nearby/travel-times", payload);
    return res.data;
  }

  async getJobApplicationStatus(jobId: string) {
    const res = await this.client.get<{ applied: boolean; bookmarked: boolean }>(
      `/jobs/${jobId}/application-status`,
    );
    return res.data;
  }

  async applyToJob(jobId: string) {
    const res = await this.client.post<{ message: string; applied?: boolean }>(`/jobs/${jobId}/apply`);
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

  async listBookmarkedJobs() {
    const res: AxiosResponse<JobSearchResponse> = await this.client.get("/jobs/bookmarks");
    return res.data;
  }

  async listAppliedJobs() {
    const res: AxiosResponse<JobSearchResponse> = await this.client.get("/jobs/applications");
    return res.data;
  }

  async getSeekerJobsStatus() {
    const res = await this.client.get<{ applied_job_ids: string[]; bookmarked_job_ids: string[] }>(
      "/jobs/my-status",
    );
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

  async listProviderJobs(params?: Record<string, string | number | undefined>) {
    const res: AxiosResponse<JobSearchResponse> = await this.client.get("/jobs/provider", { params });
    return res.data;
  }

  async getProviderJob(jobId: string) {
    const res: AxiosResponse<Job> = await this.client.get(`/jobs/provider/${jobId}`);
    return res.data;
  }

  async createProviderJob(payload: ProviderJobUpsertPayload) {
    const res: AxiosResponse<Job> = await this.client.post("/jobs/provider", payload);
    return res.data;
  }

  async updateProviderJob(jobId: string, payload: Partial<ProviderJobUpsertPayload>) {
    const res: AxiosResponse<Job> = await this.client.patch(`/jobs/provider/${jobId}`, payload);
    return res.data;
  }

  async deleteProviderJob(jobId: string) {
    const res = await this.client.delete(`/jobs/provider/${jobId}`);
    return res.data;
  }

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res: AxiosResponse<AdminAnalytics> = await this.client.get("/admin/analytics");
    return res.data;
  }

  async listAdminJobs(params?: {
    page?: number;
    page_size?: number;
    q?: string;
    status?: string;
    city?: string;
    role_key?: string;
  }) {
    const res: AxiosResponse<PaginatedAdminJobs> = await this.client.get("/admin/jobs", { params });
    return res.data;
  }

  async getAdminJob(jobId: string) {
    const res: AxiosResponse<AdminJobDetail> = await this.client.get(`/admin/jobs/${jobId}`);
    return res.data;
  }

  async createAdminJob(payload: ProviderJobUpsertPayload & { provider_id: string }) {
    const res: AxiosResponse<AdminJobDetail> = await this.client.post("/admin/jobs", payload);
    return res.data;
  }

  async updateAdminJob(jobId: string, payload: Partial<ProviderJobUpsertPayload & { provider_id: string }>) {
    const res: AxiosResponse<AdminJobDetail> = await this.client.patch(`/admin/jobs/${jobId}`, payload);
    return res.data;
  }

  async deleteAdminJob(jobId: string) {
    const res = await this.client.delete(`/admin/jobs/${jobId}`);
    return res.data;
  }

  async listAdminSeekers(params?: { page?: number; page_size?: number; q?: string }) {
    const res: AxiosResponse<Paginated<SeekerAdminRow>> = await this.client.get("/admin/users/seekers", {
      params,
    });
    return res.data;
  }

  async listAdminProviders(params?: { page?: number; page_size?: number; q?: string }) {
    const res: AxiosResponse<Paginated<ProviderAdminRow>> = await this.client.get(
      "/admin/users/providers",
      { params },
    );
    return res.data;
  }

  async listAdmins(params?: { page?: number; page_size?: number }) {
    const res: AxiosResponse<Paginated<AdminUserRow>> = await this.client.get("/admin/admins", {
      params,
    });
    return res.data;
  }

  async createAdmin(payload: { email: string; password: string; full_name: string }) {
    const res = await this.client.post("/admin/admins", payload);
    return res.data;
  }

  async updateAdmin(
    id: string,
    payload: Partial<{ email: string; password: string; full_name: string; is_active: boolean }>,
  ) {
    const res = await this.client.patch(`/admin/admins/${id}`, payload);
    return res.data;
  }

  async deleteAdmin(id: string) {
    const res = await this.client.delete(`/admin/admins/${id}`);
    return res.data;
  }

  async createAdminSeeker(payload: Record<string, unknown>) {
    const res = await this.client.post("/admin/users/seekers", payload);
    return res.data;
  }

  async updateAdminSeeker(id: string, payload: Record<string, unknown>) {
    const res = await this.client.patch(`/admin/users/seekers/${id}`, payload);
    return res.data;
  }

  async deleteAdminSeeker(id: string) {
    const res = await this.client.delete(`/admin/users/seekers/${id}`);
    return res.data;
  }

  async createAdminProvider(payload: Record<string, unknown>) {
    const res = await this.client.post("/admin/users/providers", payload);
    return res.data;
  }

  async updateAdminProvider(id: string, payload: Record<string, unknown>) {
    const res = await this.client.patch(`/admin/users/providers/${id}`, payload);
    return res.data;
  }

  async deleteAdminProvider(id: string) {
    const res = await this.client.delete(`/admin/users/providers/${id}`);
    return res.data;
  }

  async setUserActive(id: string, is_active: boolean) {
    const res = await this.client.patch(`/admin/users/${id}/active`, { is_active });
    return res.data;
  }

  async getMyWorkerAvailability() {
    const res: AxiosResponse<WorkerAvailabilityStatus> = await this.client.get(
      "/seekers/me/availability",
    );
    return res.data;
  }

  async setMyWorkerAvailability(payload: WorkerAvailabilityUpsert) {
    const res: AxiosResponse<WorkerAvailabilityStatus> = await this.client.put(
      "/seekers/me/availability",
      payload,
    );
    return res.data;
  }

  async clearMyWorkerAvailability() {
    const res: AxiosResponse<WorkerAvailabilityStatus> = await this.client.delete(
      "/seekers/me/availability",
    );
    return res.data;
  }

  async getWorkforceDashboard(params?: Record<string, string | number | undefined>) {
    const res: AxiosResponse<WorkforceDashboard> = await this.client.get("/admin/workforce/dashboard", {
      params,
    });
    return res.data;
  }

  async exportWorkforceCsv(params?: Record<string, string | number | undefined>) {
    const res = await this.client.get("/admin/workforce/export", {
      params,
      responseType: "blob",
    });
    return res.data as Blob;
  }

  async persistWorkforceSnapshot(params?: Record<string, string | undefined>) {
    const res = await this.client.post("/admin/workforce/snapshot", null, { params });
    return res.data;
  }

  async getGeoIntelligenceDashboard(params?: Record<string, string | undefined>) {
    const res: AxiosResponse<GeoIntelligenceDashboard> = await this.client.get(
      "/admin/geo-intelligence/overview",
      { params },
    );
    return res.data;
  }

  async persistGeoIntelligenceSnapshot() {
    const res = await this.client.post("/admin/geo-intelligence/snapshot");
    return res.data as { saved: number };
  }

  async backfillGeoTags() {
    const res = await this.client.post("/admin/geo-intelligence/backfill-geo-tags");
    return res.data as { counts: Record<string, number> };
  }

  async resolveConstituency(pincode: string) {
    const res = await this.client.get("/geo/resolve-constituency", { params: { pincode } });
    return res.data;
  }

  // --- Admin geo mapping CRUD ---

  async listAdminPincodes(params?: { page?: number; page_size?: number; q?: string; state?: string }) {
    const res: AxiosResponse<Paginated<PincodeRow>> = await this.client.get("/admin/geo-mapping/pincodes", {
      params,
    });
    return res.data;
  }

  async createAdminPincode(payload: {
    pincode: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    is_active?: boolean;
  }) {
    const res: AxiosResponse<PincodeRow> = await this.client.post("/admin/geo-mapping/pincodes", payload);
    return res.data;
  }

  async updateAdminPincode(
    pincode: string,
    payload: Partial<{
      district: string;
      state: string;
      latitude: number;
      longitude: number;
      is_active: boolean;
    }>,
  ) {
    const res: AxiosResponse<PincodeRow> = await this.client.patch(`/admin/geo-mapping/pincodes/${pincode}`, payload);
    return res.data;
  }

  async deleteAdminPincode(pincode: string) {
    const res = await this.client.delete(`/admin/geo-mapping/pincodes/${pincode}`);
    return res.data;
  }

  async listAdminConstituencies(params?: {
    page?: number;
    page_size?: number;
    q?: string;
    state?: string;
    constituency_type?: string;
  }) {
    const res: AxiosResponse<Paginated<ConstituencyRow>> = await this.client.get(
      "/admin/geo-mapping/constituencies",
      { params },
    );
    return res.data;
  }

  async createAdminConstituency(payload: Record<string, unknown>) {
    const res: AxiosResponse<ConstituencyRow> = await this.client.post(
      "/admin/geo-mapping/constituencies",
      payload,
    );
    return res.data;
  }

  async updateAdminConstituency(id: string, payload: Record<string, unknown>) {
    const res: AxiosResponse<ConstituencyRow> = await this.client.patch(
      `/admin/geo-mapping/constituencies/${id}`,
      payload,
    );
    return res.data;
  }

  async deleteAdminConstituency(id: string) {
    const res = await this.client.delete(`/admin/geo-mapping/constituencies/${id}`);
    return res.data;
  }

  async listAdminMappings(params?: {
    page?: number;
    page_size?: number;
    pincode?: string;
    constituency_id?: string;
  }) {
    const res: AxiosResponse<Paginated<MappingRow>> = await this.client.get("/admin/geo-mapping/mappings", {
      params,
    });
    return res.data;
  }

  async createAdminMapping(payload: {
    pincode: string;
    constituency_id: string;
    weight?: number;
    effective_from?: string;
    effective_to?: string;
  }) {
    const res: AxiosResponse<MappingRow> = await this.client.post("/admin/geo-mapping/mappings", payload);
    return res.data;
  }

  async updateAdminMapping(
    id: string,
    payload: Partial<{ weight: number; effective_from: string; effective_to: string }>,
  ) {
    const res: AxiosResponse<MappingRow> = await this.client.patch(`/admin/geo-mapping/mappings/${id}`, payload);
    return res.data;
  }

  async deleteAdminMapping(id: string) {
    const res = await this.client.delete(`/admin/geo-mapping/mappings/${id}`);
    return res.data;
  }

  async testAdminPincodeResolve(pincode: string) {
    const res: AxiosResponse<PincodeResolveResult> = await this.client.get("/admin/geo-mapping/resolve", {
      params: { pincode },
    });
    return res.data;
  }

  async searchAvailableWorkers(params?: {
    lat?: number;
    lng?: number;
    q?: string;
    radius_km?: number;
    join_within_hours?: number;
    role_key?: string;
    shift_preference?: string;
    emergency_only?: boolean;
    limit?: number;
  }) {
    const res: AxiosResponse<AvailableWorkersResponse> = await this.client.get(
      "/seekers/available/nearby",
      { params },
    );
    return res.data;
  }
}

export const api = new ApiClient();
