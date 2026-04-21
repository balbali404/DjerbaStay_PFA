import { DATE_FORMAT } from "./constants";
import type { PlannerState } from "./types";

export function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDateRange(startDate: Date | null, days: number) {
  if (!startDate) {
    return "Select a start date above";
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  return `${startDate.toLocaleDateString("en-US", DATE_FORMAT)} -> ${endDate.toLocaleDateString("en-US", DATE_FORMAT)} (${days} days)`;
}

export function formatTripPeriod(startDate: Date | null, days: number) {
  if (!startDate) {
    return "Dates TBD";
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  return `${startDate.toLocaleDateString("en-US", DATE_FORMAT)} - ${endDate.toLocaleDateString("en-US", DATE_FORMAT)}`;
}

export function formatPrice(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return "---";
  }

  return `EUR${Math.round(value)}`;
}

export function buildInterests(state: PlannerState) {
  const budgetWord =
    state.budgetLevel === 1
      ? "budget"
      : state.budgetLevel === 2
        ? "standard"
        : "premium";
  return `${state.vibe} ${state.groupType} ${budgetWord}`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to communicate with server.";
}
