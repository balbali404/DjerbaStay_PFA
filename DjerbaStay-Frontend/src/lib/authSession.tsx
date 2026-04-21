"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  confirmCheckout,
  getAuthenticatedUser,
  getSubscriptionPlans,
  loginAccount,
  logoutAccount,
  registerAccount,
  startCheckout,
  switchSubscriptionPlan,
  tryRefreshSession,
  updateProfileAccount,
  type CheckoutConfirmation,
  type CheckoutSession,
  type AuthUser,
  type SubscriptionCode,
  type SubscriptionPlan,
  type UpdateProfilePayload,
} from "./authApi";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

type AuthSessionContextValue = {
  user: AuthUser | null;
  plans: SubscriptionPlan[];
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  setPlan: (planCode: SubscriptionCode) => Promise<void>;
  createCheckout: (planCode: SubscriptionCode) => Promise<CheckoutSession>;
  confirmCheckout: (sessionId: string) => Promise<CheckoutConfirmation>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

async function safelyLoadPlans(): Promise<SubscriptionPlan[]> {
  try {
    return await getSubscriptionPlans();
  } catch {
    return [];
  }
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const reloadUser = useCallback(async () => {
    const loadedUser = await getAuthenticatedUser();
    setUser(loadedUser);
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      try {
        const loadedPlans = await safelyLoadPlans();
        if (active) {
          setPlans(loadedPlans);
        }

        const refreshed = await tryRefreshSession();
        if (!refreshed) {
          if (active) {
            setUser(null);
          }
          return;
        }

        const loadedUser = await getAuthenticatedUser();
        if (active) {
          setUser(loadedUser);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginAccount(payload);
    setUser(session.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const session = await registerAccount(payload);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } finally {
      setUser(null);
    }
  }, []);

  const setPlan = useCallback(async (planCode: SubscriptionCode) => {
    const session = await switchSubscriptionPlan(planCode);
    setUser(session.user);

    const loadedPlans = await safelyLoadPlans();
    setPlans(loadedPlans);
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const session = await updateProfileAccount(payload);
    setUser(session.user);
  }, []);

  const createCheckout = useCallback(async (planCode: SubscriptionCode) => {
    return startCheckout(planCode);
  }, []);

  const confirmCheckoutSession = useCallback(async (sessionId: string) => {
    const confirmation = await confirmCheckout(sessionId);
    setUser(confirmation.user);

    const loadedPlans = await safelyLoadPlans();
    setPlans(loadedPlans);

    return confirmation;
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      user,
      plans,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      logout,
      reloadUser,
      updateProfile,
      setPlan,
      createCheckout,
      confirmCheckout: confirmCheckoutSession,
    }),
    [
      user,
      plans,
      isInitializing,
      login,
      register,
      logout,
      reloadUser,
      updateProfile,
      setPlan,
      createCheckout,
      confirmCheckoutSession,
    ]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }

  return context;
}
