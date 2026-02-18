import React, { createContext, useCallback, useEffect, useState } from "react";
import {
  getRefreshToken,
  initializeTokens,
  setLogoutHandler,
} from "../utils/authStorage";
import {
  loginStaff,
  logout as logoutService,
  getStaffProfile,
  getTenantInfo,
} from "../services/auth";
import { registerPushToken } from "../api/auth";
import {
  registerForPushNotificationsAsync,
  getPlatformInfo,
} from "../services/notifications";
import { useTenant } from "../hooks/useTenant";
import { DEFAULT_TENANT_META } from "../utils/tenant";
import { clearStoredTenantSlug, storeTenantSlug } from "../utils/tenantStorage";

export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  featureFlags: null,
  authError: null,
  tenantInfo: null,
  userInfo: null,
  login: async () => {},
  logout: () => {},
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const { applyTenantBootstrap, setTenantSlug, slug } = useTenant();

  const resetState = useCallback(async () => {
    setIsAuthenticated(false);
    setFeatureFlags(null);
    setAuthError(null);
    setTenantInfo(null);
    setUserInfo(null);
    setTenantSlug(DEFAULT_TENANT_META.slug);
    await clearStoredTenantSlug();
  }, [setTenantSlug]);

  const handleLogout = useCallback(async () => {
    try {
      // Usa logout() do services/auth.js
      // Limpa staff + client tokens
      // Chama logoutHandlers automaticamente
      await logoutService();

      // Reset state local
      await resetState();
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      // Mesmo com erro, fazer reset
      await resetState();
    }
  }, [resetState]);

  useEffect(() => {
    setLogoutHandler(handleLogout);
  }, [handleLogout]);

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const { user, tenant } = await loginStaff(email, password);

        setIsAuthenticated(true);
        setUserInfo(user);
        setTenantInfo(tenant);

        // Aplicar tenant no TenantContext
        if (tenant?.slug) {
          applyTenantBootstrap(tenant);
          await storeTenantSlug(tenant.slug);
        }

        try {
          await getStaffProfile();
          console.log(
            "[AuthContext] Profile check before push registration ok",
          );
        } catch (e) {
          console.warn(
            "[AuthContext] Profile check before push registration failed:",
            e?.message || e,
          );
        }

        const { token, error } = await registerForPushNotificationsAsync();

        if (token) {
          const { platform, appVersion } = getPlatformInfo();
          try {
            const effectiveSlug = tenant?.slug || slug || null;
            console.log("[AuthContext] Starting push token registration", {
              platform,
              appVersion,
              slug: effectiveSlug,
            });
            let attempt = 0;
            let lastErr = null;
            const delays = [200, 600, 1200];
            while (attempt < delays.length) {
              try {
                await registerPushToken(
                  token,
                  platform,
                  appVersion,
                  effectiveSlug,
                );
                console.log("[AuthContext] Push token registration completed", {
                  attempt,
                });
                lastErr = null;
                break;
              } catch (pushErr) {
                const status = pushErr?.response?.status;
                const body = pushErr?.response?.data;
                const bodyStr =
                  typeof body === "string" ? body : JSON.stringify(body || {});
                const isTenantUserMissing =
                  status === 400 && bodyStr.includes("tenant_or_user_missing");
                if (!isTenantUserMissing) {
                  lastErr = pushErr;
                  break;
                }
                console.log(
                  "[AuthContext] Push token registration tenant_or_user_missing, retrying",
                  {
                    attempt,
                    status,
                    body: bodyStr,
                  },
                );
                await getStaffProfile().catch(() => {});
                await new Promise((res) => setTimeout(res, delays[attempt]));
                attempt += 1;
                lastErr = pushErr;
              }
            }
            if (lastErr) throw lastErr;
          } catch (pushError) {
            console.warn(
              "[AuthContext] Failed to register push token:",
              pushError?.message || pushError,
            );
          }
        } else if (error) {
          console.warn("[AuthContext] Push registration skipped:", error);
        }

        return { success: true };
      } catch (error) {
        // Check for plan upgrade required error
        if (error?.code === "PLAN_UPGRADE_REQUIRED") {
          const errorMessage = error.message;
          setAuthError(errorMessage);
          return {
            success: false,
            error: errorMessage,
            requiresPlanUpgrade: true,
            planRequired: error.planRequired,
            currentPlan: error.currentPlan,
            upgradeUrl: error.upgradeUrl,
          };
        }

        const errorMessage =
          error?.response?.data?.detail || error?.message || "Falha no login";
        setAuthError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [applyTenantBootstrap],
  );

  const refreshSession = useCallback(async () => {
    try {
      // Re-fetch user profile
      const userProfile = await getStaffProfile();

      // Handle both formats: { user, tenant } or just user object
      const user = userProfile.user || userProfile;
      const tenant = userProfile.tenant || null;

      setUserInfo(user);
      setTenantInfo(tenant);

      // Atualizar TenantContext se tenant mudou
      if (userProfile.tenant?.slug) {
        applyTenantBootstrap(userProfile.tenant);
        await storeTenantSlug(userProfile.tenant.slug);
      }
    } catch (error) {
      console.error("[AuthContext] refreshSession failed:", error);
      // Se 401, forçar logout
      if (error?.response?.status === 401) {
        await handleLogout();
      }
    }
  }, [applyTenantBootstrap, handleLogout]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await initializeTokens();

        const refresh = await getRefreshToken();
        if (refresh) {
          try {
            const userProfile = await getStaffProfile();

            // Handle both formats: { user, tenant } or just user object
            const user = userProfile.user || userProfile;
            const tenant = userProfile.tenant || null;

            setUserInfo(user);
            setTenantInfo(tenant);
            setIsAuthenticated(true);

            if (userProfile.tenant?.slug) {
              applyTenantBootstrap(userProfile.tenant);
              await storeTenantSlug(userProfile.tenant.slug);
            }
          } catch (error) {
            // Não autentica se perfil falhar; mantém usuário na tela de login
            console.warn(
              "[AuthContext] Perfil não restaurado no bootstrap:",
              error?.message || error,
            );
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    featureFlags,
    authError,
    tenantInfo,
    userInfo,
    login,
    logout: handleLogout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
