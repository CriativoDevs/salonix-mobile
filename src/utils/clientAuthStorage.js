/**
 * clientAuthStorage.js
 *
 * Sistema de armazenamento para tokens de autenticação de CLIENTES (B2C).
 * Separado de authStorage.js para suportar dual authentication (staff + client).
 *
 * Baseado em: salonix-frontend-web/src/utils/clientAuthStorage.js
 * Adaptado para React Native usando expo-secure-store.
 *
 * TOKEN TYPES:
 * - Client Tokens: Clientes finais que fazem agendamentos
 *   - Access: salonix_client_access_token
 *   - Refresh: salonix_client_refresh_token
 *   - Endpoints: POST /api/clients/login/, POST /api/clients/token/refresh/
 *
 * - Staff Tokens: Owner/Manager/Professional (authStorage.js)
 *   - Access: salonix_access_token
 *   - Refresh: salonix_refresh_token
 *   - Endpoints: POST /api/users/token/, POST /api/users/token/refresh/
 */

import * as SecureStore from "expo-secure-store";

// ===== CONSTANTS =====
const CLIENT_REFRESH_KEY = "salonix_client_refresh_token";
const CLIENT_ACCESS_KEY = "salonix_client_access_token";

// ===== IN-MEMORY CACHE =====
// Tokens ficam em memória após load inicial (performance)
let clientAccessToken = null;
let clientRefreshToken = null;

/**
 * Initialize client tokens from SecureStore
 * MUST be called on app startup (App.js useEffect)
 *
 * @returns {Promise<void>}
 */
export const initializeClientTokens = async () => {
  try {
    clientAccessToken = await SecureStore.getItemAsync(CLIENT_ACCESS_KEY);
    clientRefreshToken = await SecureStore.getItemAsync(CLIENT_REFRESH_KEY);

    if (clientAccessToken || clientRefreshToken) {
      console.log("[clientAuthStorage] Client tokens loaded from SecureStore");
    }
  } catch (error) {
    console.error("[clientAuthStorage] Error loading tokens:", error);
    // Fallback: tokens permanecem null (user precisa fazer login)
  }
};

/**
 * Set client access token (memory + SecureStore)
 *
 * @param {string|null} token - JWT access token or null to clear
 * @returns {Promise<void>}
 */
export const setClientAccessToken = async (token) => {
  clientAccessToken = token || null;

  try {
    if (token) {
      await SecureStore.setItemAsync(CLIENT_ACCESS_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(CLIENT_ACCESS_KEY);
    }
  } catch (error) {
    console.error("[clientAuthStorage] Error saving access token:", error);
  }
};

/**
 * Set client refresh token (memory + SecureStore)
 *
 * @param {string|null} token - JWT refresh token or null to clear
 * @returns {Promise<void>}
 */
export const setClientRefreshToken = async (token) => {
  clientRefreshToken = token || null;

  try {
    if (token) {
      await SecureStore.setItemAsync(CLIENT_REFRESH_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(CLIENT_REFRESH_KEY);
    }
  } catch (error) {
    console.error("[clientAuthStorage] Error saving refresh token:", error);
  }
};

/**
 * Get client access token (from memory cache)
 *
 * @returns {string|null} JWT access token or null
 */
export const getClientAccessToken = () => clientAccessToken;

/**
 * Get client refresh token (from memory cache)
 *
 * @returns {string|null} JWT refresh token or null
 */
export const getClientRefreshToken = () => clientRefreshToken;

/**
 * Clear all client tokens (logout)
 *
 * @returns {Promise<void>}
 */
export const clearClientTokens = async () => {
  await setClientAccessToken(null);
  await setClientRefreshToken(null);
  console.log("[clientAuthStorage] Client tokens cleared");
};

// ===== LOGOUT HANDLER =====
// AuthContext pode registrar um handler para ser chamado no logout
let clientLogoutHandler = null;

/**
 * Set logout handler callback
 * AuthContext usa isso para limpar estado quando tokens expiram
 *
 * @param {Function} handler - Callback function to execute on logout
 */
export const setClientLogoutHandler = (handler) => {
  clientLogoutHandler = handler;
};

/**
 * Trigger client logout
 * Clears tokens + calls registered logout handler
 *
 * @returns {Promise<void>}
 */
export const triggerClientLogout = async () => {
  await clearClientTokens();

  if (clientLogoutHandler) {
    console.log("[clientAuthStorage] Triggering client logout handler");
    clientLogoutHandler();
  }
};
