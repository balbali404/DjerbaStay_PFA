export type Accommodation = {
  id: number;
  name: string;
  type?: string;
  area?: string;
  latitude: number;
  longitude: number;
  rating?: number;
};

export type PlanTripPayload = {
  interests: string;
  days: number;
  accommodation_name: string;
  accommodation_lat: number;
  accommodation_lon: number;
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

export type BudgetPayload = {
  days: number;
  persons: number;
  budget_level: number;
  transport: string;
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

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_API_BASE || "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${AI_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function getAccommodations(): Promise<Accommodation[]> {
  return apiFetch<Accommodation[]>("/api/ai/accommodations", { method: "GET" });
}

export async function planTrip(
  payload: PlanTripPayload
): Promise<TripPlanResponse> {
  return apiFetch<TripPlanResponse>("/api/ai/plan-trip", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function estimateBudget(
  payload: BudgetPayload
): Promise<BudgetResponse> {
  return apiFetch<BudgetResponse>("/api/ai/estimate-budget", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
