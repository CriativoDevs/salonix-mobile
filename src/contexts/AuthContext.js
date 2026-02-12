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
      setUserInfo(userProfile.user);
      setTenantInfo(userProfile.tenant);

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
      await initializeTokens();
      setIsLoading(false);
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
