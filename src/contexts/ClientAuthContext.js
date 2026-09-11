import React, { createContext, useCallback, useEffect, useState } from "react";
import {
  initializeClientTokens,
  getClientRefreshToken,
  getClientTenantSlug,
  setClientLogoutHandler,
} from "../utils/clientAuthStorage";
import {
  loginClient,
  getClientProfile,
  logout as logoutService,
} from "../services/auth";

export const ClientAuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  clientInfo: null,
  tenantSlug: null,
  login: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const ClientAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [tenantSlug, setTenantSlug] = useState(null);

  const resetState = useCallback(() => {
    setIsAuthenticated(false);
    setAuthError(null);
    setClientInfo(null);
    setTenantSlug(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // Limpa staff + client tokens (services/auth.js logout() apenas limpa,
      // não chama handlers — evita reentrância, ver AuthContext.js).
      await logoutService();
    } catch (error) {
      console.error("[ClientAuthContext] Logout error:", error);
    }
    resetState();
  }, [resetState]);

  useEffect(() => {
    setClientLogoutHandler(handleLogout);
  }, [handleLogout]);

  const login = useCallback(async (email, password, slug) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await loginClient(email, password, slug);
      const profile = await getClientProfile();
      setIsAuthenticated(true);
      setClientInfo(profile);
      setTenantSlug(slug);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.detail ||
        (Array.isArray(error?.response?.data)
          ? error.response.data[0]
          : null) ||
        error?.message ||
        "Falha no login";
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getClientProfile();
      setClientInfo(profile);
      return profile;
    } catch (error) {
      if (error?.response?.status === 401) {
        await handleLogout();
      }
      throw error;
    }
  }, [handleLogout]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await initializeClientTokens();

        const refresh = getClientRefreshToken();
        if (refresh) {
          try {
            const profile = await getClientProfile();
            setClientInfo(profile);
            setTenantSlug(getClientTenantSlug());
            setIsAuthenticated(true);
          } catch (error) {
            console.warn(
              "[ClientAuthContext] Perfil não restaurado no bootstrap:",
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
    authError,
    clientInfo,
    tenantSlug,
    login,
    logout: handleLogout,
    refreshProfile,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};
