import {
  confirmCheckoutSession,
  createCheckoutSession,
  fetchCurrentUser,
  fetchSubscriptionPlans,
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  saveLanguagePreference,
  updateProfile,
  updateSubscriptionPlan,
  type AuthSession,
  type CheckoutConfirmation,
  type CheckoutSession,
  type AuthUser,
  type LanguageCode,
  type Role,
  type SubscriptionCode,
  type SubscriptionPlan,
  type UpdateProfilePayload,
} from "./backendApi";

export type {
  AuthSession,
  AuthUser,
  CheckoutConfirmation,
  CheckoutSession,
  LanguageCode,
  Role,
  SubscriptionCode,
  SubscriptionPlan,
  UpdateProfilePayload,
};

export async function registerAccount(payload: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  return registerUser(payload);
}

export async function loginAccount(payload: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  return loginUser(payload);
}

export async function logoutAccount(): Promise<void> {
  await logoutUser();
}

export async function getAuthenticatedUser(): Promise<AuthUser> {
  return fetchCurrentUser();
}

export async function updateLanguagePreference(language: LanguageCode): Promise<AuthUser> {
  return saveLanguagePreference(language);
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return fetchSubscriptionPlans();
}

export async function switchSubscriptionPlan(planCode: SubscriptionCode): Promise<AuthSession> {
  return updateSubscriptionPlan(planCode);
}

export async function updateProfileAccount(payload: UpdateProfilePayload): Promise<AuthSession> {
  return updateProfile(payload);
}

export async function startCheckout(planCode: SubscriptionCode): Promise<CheckoutSession> {
  return createCheckoutSession(planCode);
}

export async function confirmCheckout(sessionId: string): Promise<CheckoutConfirmation> {
  return confirmCheckoutSession(sessionId);
}

export async function tryRefreshSession(): Promise<boolean> {
  const token = await refreshAccessToken();
  return Boolean(token);
}
