import React, { createContext, useCallback, useEffect, useState } from "react";
import {
  clearTokens,
  initializeTokens,
  setAccessToken,
  setLogoutHandler,
  setRefreshToken,
} from "../utils/authStorage";
import {
  fetchCurrentUser,
  fetchFeatureFlags,
  fetchTenantBootstrap,
  login as loginRequest,
} from "../api/auth";
import { parseApiError } from "../utils/apiError";
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
    await clearTokens();
    await resetState();
  }, [resetState]);

  useEffect(() => {
    setLogoutHandler(handleLogout);
  }, [handleLogout]);

  const loadFeatureFlags = useCallback(async () => {
    try {
      const flags = await fetchFeatureFlags();
      setFeatureFlags(flags);
    } catch (error) {
      console.warn("[Auth] Failed to load feature flags:", error);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUserInfo(profile);
      return true;
    } catch (error) {
      console.warn("[Auth] Failed to load user profile:", error);
      return false;
    }
  }, []);

  const loadTenantBootstrap = useCallback(async () => {
    try {
      const tenant = await fetchTenantBootstrap();
      if (tenant?.slug) {
        applyTenantBootstrap(tenant);
        await storeTenantSlug(tenant.slug);
        setTenantInfo(tenant);
        return true;
      }
    } catch (error) {
      console.warn("[Auth] Failed to load tenant bootstrap:", error);
    }
    return false;
  }, [applyTenantBootstrap]);

  const login = useCallback(
    async (email, password, options = {}) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const data = await loginRequest(email, password, options);

        await setAccessToken(data.access);
        await setRefreshToken(data.refresh);

        setIsAuthenticated(true);

        await Promise.all([
          loadFeatureFlags(),
          loadTenantBootstrap(),
          loadCurrentUser(),
        ]);

        return { success: true };
      } catch (error) {
        const errorMessage = parseApiError(error, "Falha no login");
        setAuthError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [loadFeatureFlags, loadTenantBootstrap, loadCurrentUser]
  );

  const refreshSession = useCallback(async () => {
    await Promise.all([
      loadFeatureFlags(),
      loadTenantBootstrap(),
      loadCurrentUser(),
    ]);
  }, [loadFeatureFlags, loadTenantBootstrap, loadCurrentUser]);

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
