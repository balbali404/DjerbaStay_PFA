import {
  fetchAccommodations,
  fetchMlUsage,
  fetchPlannerHistory,
  fetchPlannerRequestById,
  generatePlannerRequest,
  type Accommodation,
  type BudgetResponse,
  type GeneratePlannerPayload,
  type MlUsage,
  type PlannerGenerationResponse,
  type PlannerHistoryItem,
  type PlannerRequestDetails,
  type TripDay,
  type TripPlanResponse,
} from "./backendApi";

export type {
  Accommodation,
  BudgetResponse,
  MlUsage,
  PlannerGenerationResponse,
  PlannerHistoryItem,
  PlannerRequestDetails,
  TripDay,
  TripPlanResponse,
};

export type PlannerPayload = GeneratePlannerPayload;

export async function getAccommodations(): Promise<Accommodation[]> {
  return fetchAccommodations();
}

export async function generatePlanner(payload: PlannerPayload): Promise<PlannerGenerationResponse> {
  return generatePlannerRequest(payload);
}

export async function getPlannerHistory(limit = 10): Promise<PlannerHistoryItem[]> {
  return fetchPlannerHistory(limit);
}

export async function getPlannerById(requestId: string): Promise<PlannerRequestDetails> {
  return fetchPlannerRequestById(requestId);
}

export async function getMlUsage(): Promise<MlUsage> {
  return fetchMlUsage();
}
