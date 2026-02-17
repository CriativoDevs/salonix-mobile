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
  login: async () => { },
  logout: () => { },
  refreshSession: async () => { },
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const { applyTenantBootstrap, setTenantSlug } = useTenant();

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
        // Usa loginStaff() do services/auth.js
        // Retorna: { user, tenant }
        // Tokens já são salvos automaticamente pelo loginStaff()
        const { user, tenant } = await loginStaff(email, password);

        setIsAuthenticated(true);
        setUserInfo(user);
        setTenantInfo(tenant);

        // Aplicar tenant no TenantContext
        if (tenant?.slug) {
          applyTenantBootstrap(tenant);
          await storeTenantSlug(tenant.slug);
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
            console.warn("[AuthContext] Perfil não restaurado no bootstrap:", error?.message || error);
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
