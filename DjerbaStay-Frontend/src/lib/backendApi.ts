const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:4000";
const ACCESS_TOKEN_STORAGE_KEY = "djerbastay_access_token";

type ApiRequestOptions = {
  requiresAuth?: boolean;
  allowRefresh?: boolean;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type SubscriptionCode = "FREE" | "PLUS" | "PREMIUM" | "UNLIMITED";
export type TransportMode = "taxi" | "car_rental" | "bus";
export type LanguageCode = "en" | "fr" | "de";
export type Role = "CLIENT" | "HOTEL_ADMIN" | "SUPER_ADMIN";
export type HotelStatus = "ACTIVE" | "INACTIVE";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  language: LanguageCode;
  role: Role;
  plan: {
    code: SubscriptionCode;
    name: string;
    monthlyMlRequests: number | null;
    monthlyPriceUsd: number;
  };
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type UpdateProfilePayload = {
  fullName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
};

export type SubscriptionPlan = {
  code: SubscriptionCode;
  name: string;
  description: string;
  monthlyMlRequests: number | null;
  monthlyPriceUsd: number;
  features?: unknown;
};

export type CheckoutSession = {
  sessionId: string;
  checkoutUrl: string;
  accessToken?: string;
};

export type CheckoutConfirmation = AuthSession & {
  checkout: {
    sessionId: string;
    paymentStatus: string | null;
    checkoutStatus: string | null;
  };
};

export type MlUsage = {
  planCode: SubscriptionCode;
  used: number;
  limit: number | null;
  remaining: number | null;
};

export type Accommodation = {
  id: number;
  dbId?: string;
  name: string;
  type?: string | null;
  area?: string | null;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  rating?: number | null;
  status?: HotelStatus;
};

export type TripPlace = {
  name: string;
  type: string;
  category: string;
  latitude: number;
  longitude: number;
  duration_hours: number;
  score: number;
  distance_from_accommodation_km: number;
};

export type TripDay = {
  day: number;
  total_hours: number;
  places: TripPlace[];
};

export type TripPlanResponse = {
  personality: string;
  confidence: number;
  accommodation: {
    name: string;
    latitude: number;
    longitude: number;
  };
  total_days: number;
  requested_days: number;
  itinerary: TripDay[];
  warning?: string | null;
};

export type BudgetResponse = {
  total_cost: number;
  per_day: number;
  activities_cost: number;
  food_cost: number;
  transport_cost: number;
  lr_prediction: number;
  ridge_prediction: number;
};

export type GeneratePlannerPayload = {
  accommodationId: number;
  interests: string;
  days: number;
  persons: number;
  budgetLevel: number;
  transport: TransportMode;
  travelStartDate?: string;
};

export type PlannerGenerationResponse = {
  requestId: string;
  tripPlan: TripPlanResponse;
  budget: BudgetResponse;
  usage: MlUsage;
};

export type PlannerRequestDetails = {
  id: string;
  createdAt: string;
  interests: string;
  days: number;
  persons: number;
  budgetLevel: number;
  transport: TransportMode;
  travelStartDate?: string | null;
  accommodation: {
    id: number;
    name: string;
    area?: string | null;
    latitude: number;
    longitude: number;
  };
  tripPlan: TripPlanResponse;
  budget: BudgetResponse;
};

export type PlannerHistoryItem = {
  id: string;
  createdAt: string;
  interests: string;
  days: number;
  persons: number;
  budgetLevel: number;
  transport: TransportMode;
  accommodation: {
    id: number;
    name: string;
    area?: string | null;
  };
};

export type BestRecommendation = {
  id: string;
  createdAt: string;
  confidence: number;
  personality: string | null;
  interests: string;
  vibe: "luxury" | "authentic" | "beach" | "local" | null;
  days: number;
  transport: TransportMode;
  budgetLevel: number;
  userName: string;
  accommodation: {
    name: string;
    area: string | null;
    imageUrl?: string | null;
  };
  topPlaces: string[];
  estimatedTotalCost: number | null;
};

// ─── Hotel Admin Types ────────────────────────────────────────────────────────

export type HotelAvailabilityPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  createdAt: string;
};

export type HotelInfo = {
  id: number;
  dbId: string;
  name: string;
  type?: string | null;
  area?: string | null;
  rating?: number | null;
  priceEuro?: number | null;
  status: HotelStatus;
};

export type HotelDashboardStats = {
  hotel: HotelInfo;
  stats: {
    totalReservations: number;
    thisMonthReservations: number;
    upcomingInactivePeriods: number;
  };
};

export type HotelReservation = {
  id: string;
  createdAt: string;
  interests: string;
  days: number;
  persons: number;
  budgetLevel: number;
  transport: TransportMode;
  travelStartDate?: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvalNotes?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  tripPlan: TripPlanResponse;
  budget: BudgetResponse;
};

export type HotelReservationsResponse = {
  data: HotelReservation[];
  total: number;
  page: number;
  limit: number;
};

export type HotelMlResult = {
  id: string;
  createdAt: string;
  interests: string;
  days: number;
  travelStartDate?: string | null;
  user: {
    fullName: string;
    email: string;
  };
  tripPlan: TripPlanResponse;
  budget: BudgetResponse;
};

// ─── Token storage ────────────────────────────────────────────────────────────

let inMemoryAccessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function readStoredAccessToken(): string | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function persistAccessToken(token: string | null): void {
  inMemoryAccessToken = token;

  if (!canUseBrowserStorage()) {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }

  const storedToken = readStoredAccessToken();
  if (storedToken) {
    inMemoryAccessToken = storedToken;
  }

  return inMemoryAccessToken;
}

export function clearAuthSession(): void {
  persistAccessToken(null);
}

// ─── Request helpers ──────────────────────────────────────────────────────────

function buildError(payload: unknown, status: number): ApiError {
  const fallbackMessage = `Request failed with status ${status}`;

  if (payload && typeof payload === "object") {
    const data = payload as ApiErrorPayload;
    const message = data.error || data.message || fallbackMessage;
    return new ApiError(message, status, data.code);
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return new ApiError(payload, status);
  }

  return new ApiError(fallbackMessage, status);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshAccessTokenInternal(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    clearAuthSession();
    return null;
  }

  const session = payload as AuthSession;
  if (!session?.accessToken) {
    clearAuthSession();
    return null;
  }

  persistAccessToken(session.accessToken);
  return session.accessToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessTokenInternal().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, allowRefresh = true } = options;

  const token = getAccessToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Network request failed";
    throw new ApiError(
      `Unable to reach backend API at ${API_BASE_URL}. ${message}`,
      0,
      "NETWORK_ERROR"
    );
  }

  if (response.status === 401 && requiresAuth && allowRefresh) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return requestJson<T>(path, init, {
        requiresAuth,
        allowRefresh: false,
      });
    }
  }

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw buildError(payload, response.status);
  }

  return payload as T;
}

function storeSessionAndReturn(session: AuthSession): AuthSession {
  persistAccessToken(session.accessToken);
  return session;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function registerUser(payload: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const session = await requestJson<AuthSession>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      requiresAuth: false,
      allowRefresh: false,
    }
  );

  return storeSessionAndReturn(session);
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const session = await requestJson<AuthSession>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      requiresAuth: false,
      allowRefresh: false,
    }
  );

  return storeSessionAndReturn(session);
}

export async function logoutUser(): Promise<void> {
  await requestJson<{ message: string }>(
    "/api/auth/logout",
    {
      method: "POST",
    },
    {
      requiresAuth: false,
      allowRefresh: false,
    }
  );

  clearAuthSession();
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await requestJson<{ user: AuthUser }>("/api/auth/me", {}, { requiresAuth: true });
  return response.user;
}

export async function saveLanguagePreference(language: LanguageCode): Promise<AuthUser> {
  const response = await requestJson<{ user: AuthUser }>(
    "/api/auth/preferences/language",
    {
      method: "PATCH",
      body: JSON.stringify({ language }),
    },
    {
      requiresAuth: true,
    }
  );

  return response.user;
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return requestJson<SubscriptionPlan[]>("/api/subscription/plans", {}, { requiresAuth: false });
}

export async function fetchBestRecommendation(): Promise<BestRecommendation | null> {
  const response = await requestJson<{ recommendation: BestRecommendation | null }>(
    "/api/recommendations/best",
    {},
    { requiresAuth: true }
  );

  return response.recommendation;
}

export async function updateSubscriptionPlan(planCode: SubscriptionCode): Promise<AuthSession> {
  const session = await requestJson<AuthSession>(
    "/api/subscription/plan",
    {
      method: "POST",
      body: JSON.stringify({ planCode }),
    },
    {
      requiresAuth: true,
    }
  );

  return storeSessionAndReturn(session);
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthSession> {
  const session = await requestJson<AuthSession>(
    "/api/auth/profile",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    {
      requiresAuth: true,
    }
  );

  return storeSessionAndReturn(session);
}

export async function createCheckoutSession(planCode: SubscriptionCode): Promise<CheckoutSession> {
  return requestJson<CheckoutSession>(
    "/api/billing/create-checkout-session",
    {
      method: "POST",
      body: JSON.stringify({ planCode }),
    },
    {
      requiresAuth: true,
    }
  );
}

export async function fetchCheckoutSessionStatus(sessionId: string): Promise<{
  status: string;
  paymentStatus: string;
  targetPlan: string | null;
}> {
  return requestJson<{ status: string; paymentStatus: string; targetPlan: string | null }>(
    `/api/billing/session/${sessionId}`,
    {},
    { requiresAuth: false, allowRefresh: false }
  );
}

export async function confirmCheckoutSession(sessionId: string): Promise<CheckoutConfirmation> {
  const response = await requestJson<CheckoutConfirmation>(
    "/api/billing/confirm-checkout",
    {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    },
    {
      requiresAuth: true,
    }
  );

  persistAccessToken(response.accessToken);
  return response;
}

export async function fetchMlUsage(): Promise<MlUsage> {
  return requestJson<MlUsage>("/api/ml/usage", {}, { requiresAuth: true });
}

export async function fetchAccommodations(params?: {
  startDate?: string;
  days?: number;
}): Promise<Accommodation[]> {
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set("startDate", params.startDate);
  if (params?.days) qs.set("days", String(params.days));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return requestJson<Accommodation[]>(`/api/accommodations${query}`, {}, { requiresAuth: false });
}

export async function generatePlannerRequest(
  payload: GeneratePlannerPayload
): Promise<PlannerGenerationResponse> {
  return requestJson<PlannerGenerationResponse>(
    "/api/planner/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      requiresAuth: true,
    }
  );
}

export async function fetchPlannerHistory(limit = 10): Promise<PlannerHistoryItem[]> {
  return requestJson<PlannerHistoryItem[]>(`/api/planner/history?limit=${limit}`, {}, { requiresAuth: true });
}

export async function fetchPlannerRequestById(requestId: string): Promise<PlannerRequestDetails> {
  return requestJson<PlannerRequestDetails>(`/api/planner/${requestId}`, {}, { requiresAuth: true });
}

// ─── Hotel Admin API ──────────────────────────────────────────────────────────

export async function claimHotel(externalId: number): Promise<{ message: string; hotel: HotelInfo }> {
  return requestJson(
    `/api/hotel/claim/${externalId}`,
    { method: "PATCH" },
    { requiresAuth: true }
  );
}

export async function fetchHotelDashboard(): Promise<HotelDashboardStats> {
  return requestJson<HotelDashboardStats>("/api/hotel/dashboard", {}, { requiresAuth: true });
}

export async function updateHotelStatus(status: HotelStatus): Promise<{ status: HotelStatus }> {
  return requestJson<{ status: HotelStatus }>(
    "/api/hotel/status",
    { method: "PATCH", body: JSON.stringify({ status }) },
    { requiresAuth: true }
  );
}

export async function fetchHotelAvailabilities(): Promise<HotelAvailabilityPeriod[]> {
  return requestJson<HotelAvailabilityPeriod[]>("/api/hotel/availability", {}, { requiresAuth: true });
}

export async function createHotelAvailability(payload: {
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<HotelAvailabilityPeriod> {
  return requestJson<HotelAvailabilityPeriod>(
    "/api/hotel/availability",
    { method: "POST", body: JSON.stringify(payload) },
    { requiresAuth: true }
  );
}

export async function deleteHotelAvailability(id: string): Promise<void> {
  await requestJson<{ message: string }>(
    `/api/hotel/availability/${id}`,
    { method: "DELETE" },
    { requiresAuth: true }
  );
}

export async function fetchHotelReservations(params?: {
  limit?: number;
  page?: number;
}): Promise<HotelReservationsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.page) qs.set("page", String(params.page));
  return requestJson<HotelReservationsResponse>(
    `/api/hotel/reservations?${qs.toString()}`,
    {},
    { requiresAuth: true }
  );
}

export async function fetchHotelMlResults(params?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<HotelMlResult[]> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.startDate) qs.set("startDate", params.startDate);
  if (params?.endDate) qs.set("endDate", params.endDate);
  return requestJson<HotelMlResult[]>(
    `/api/hotel/ml-results?${qs.toString()}`,
    {},
    { requiresAuth: true }
  );
}

// ─── Hotel Reservations (Approval Workflow) ───────────────────────────────────

export async function fetchHotelPendingReservations(params?: {
  limit?: number;
  page?: number;
}): Promise<HotelReservationsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.page) qs.set("page", String(params.page));
  return requestJson<HotelReservationsResponse>(
    `/api/hotel-reservations/pending?${qs.toString()}`,
    {},
    { requiresAuth: true }
  );
}

export async function fetchReservationDetails(requestId: string): Promise<HotelReservation> {
  return requestJson<HotelReservation>(
    `/api/hotel-reservations/${requestId}`,
    {},
    { requiresAuth: true }
  );
}

export async function approveReservation(requestId: string, notes?: string): Promise<{
  message: string;
  reservation: { id: string; approvalStatus: string; approvalNotes?: string; approvedAt: string };
}> {
  return requestJson(
    `/api/hotel-reservations/${requestId}/approve`,
    { method: "POST", body: JSON.stringify({ notes }) },
    { requiresAuth: true }
  );
}

export async function rejectReservation(requestId: string, reason?: string): Promise<{
  message: string;
  reservation: { id: string; approvalStatus: string; approvalNotes?: string; rejectedAt: string };
}> {
  return requestJson(
    `/api/hotel-reservations/${requestId}/reject`,
    { method: "POST", body: JSON.stringify({ reason }) },
    { requiresAuth: true }
  );
}

// ─── Hotel Guides ─────────────────────────────────────────────────────────────

export type HotelGuide = {
  id: string;
  name: string;
  specialty?: string | null;
  phone?: string | null;
  isAvailable: boolean;
  createdAt: string;
};

export async function fetchHotelGuides(): Promise<HotelGuide[]> {
  return requestJson<HotelGuide[]>("/api/hotel/guides", {}, { requiresAuth: true });
}

export async function createHotelGuide(payload: {
  name: string;
  specialty?: string;
  phone?: string;
}): Promise<HotelGuide> {
  return requestJson<HotelGuide>("/api/hotel/guides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, { requiresAuth: true });
}

export async function updateHotelGuide(
  id: string,
  patch: { isAvailable?: boolean; name?: string; specialty?: string; phone?: string }
): Promise<HotelGuide> {
  return requestJson<HotelGuide>(`/api/hotel/guides/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }, { requiresAuth: true });
}

export async function deleteHotelGuide(id: string): Promise<void> {
  await requestJson<{ message: string }>(`/api/hotel/guides/${id}`, {
    method: "DELETE",
  }, { requiresAuth: true });
}
