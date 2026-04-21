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

export type SubscriptionCode = "FREE" | "PLUS" | "PREMIUM";
export type TransportMode = "taxi" | "car_rental" | "bus";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
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
  latitude: number;
  longitude: number;
  rating?: number | null;
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

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

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return requestJson<SubscriptionPlan[]>("/api/subscription/plans", {}, { requiresAuth: false });
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

export async function fetchAccommodations(): Promise<Accommodation[]> {
  return requestJson<Accommodation[]>("/api/accommodations", {}, { requiresAuth: false });
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
