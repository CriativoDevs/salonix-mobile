/**
 * authStorage.js
 *
 * Sistema de armazenamento para tokens de autenticacao de STAFF (B2B).
 * Tokens de Owner, Manager e Professional (funcionarios do salao).
 *
 * Para tokens de CLIENTES (B2C), veja: clientAuthStorage.js
 *
 * Baseado em: salonix-frontend-web/src/utils/authStorage.js
 * Adaptado para React Native usando expo-secure-store.
 */

import * as SecureStore from "expo-secure-store";

const REFRESH_KEY = "salonix_refresh_token";
const ACCESS_KEY = "salonix_access_token";

// In-memory cache para performance
let accessToken = null;
let refreshToken = null;
let logoutHandler = null;

/**
 * Initialize staff tokens from SecureStore
 * MUST be called on app startup (App.js useEffect)
 *
 * @returns {Promise<void>}
 */
export const initializeTokens = async () => {
  try {
    accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);

    if (accessToken || refreshToken) {
      console.log("[authStorage] Staff tokens loaded from SecureStore");
    }
  } catch (error) {
    console.error("[authStorage] Error loading tokens:", error);
  }
};

/**
 * Set staff access token (memory + SecureStore)
 *
 * @param {string|null} token - JWT access token or null to clear
 * @returns {Promise<void>}
 */
export const setAccessToken = async (token) => {
  accessToken = token || null;
  try {
    if (token) {
      await SecureStore.setItemAsync(ACCESS_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_KEY);
    }
  } catch (error) {
    console.error("[authStorage] Error saving access token:", error);
  }
};

/**
 * Set staff refresh token (memory + SecureStore)
 *
 * @param {string|null} token - JWT refresh token or null to clear
 * @returns {Promise<void>}
 */
export const setRefreshToken = async (token) => {
  refreshToken = token || null;
  try {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
  } catch (error) {
    console.error("[authStorage] Error saving refresh token:", error);
  }
};

/**
 * Get staff access token (from memory cache)
 *
 * @returns {string|null} JWT access token or null
 */
export const getAccessToken = () => accessToken;

/**
 * Get staff refresh token (from memory cache)
 *
 * @returns {string|null} JWT refresh token or null
 */
export const getRefreshToken = () => refreshToken;

/**
 * Clear all staff tokens (logout)
 *
 * @returns {Promise<void>}
 */
export const clearTokens = async () => {
  await setAccessToken(null);
  await setRefreshToken(null);
  console.log("[authStorage] Staff tokens cleared");
};

/**
 * Set logout handler callback
 * AuthContext usa isso para limpar estado quando tokens expiram
 *
 * @param {Function} handler - Callback function to execute on logout
 */
export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

/**
 * Trigger staff logout
 * Clears tokens + calls registered logout handler
 *
 * @returns {Promise<void>}
 */
export const triggerLogout = async () => {
  await clearTokens();

  if (typeof logoutHandler === "function") {
    console.log("[authStorage] Triggering staff logout handler");
    logoutHandler();
  }
};
