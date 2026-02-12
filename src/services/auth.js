/**
 * auth.js - Authentication Service
 *
 * Service wrapper para endpoints de autenticação do backend.
 * Suporta dual authentication: Staff (owner/manager/professional) + Client (users).
 *
 * Baseado em: salonix-frontend-web/src/api/auth.js + clientAccess.js
 * Adaptado para React Native com dual auth support.
 *
 * AUTH TYPES:
 * ============
 * 1. STAFF AUTHENTICATION
 *    - Endpoint: POST /api/users/token/
 *    - Params: { email, password }
 *    - Response: { access, refresh, user, tenant }
 *    - Storage: authStorage.js
 *
 * 2. CLIENT AUTHENTICATION
 *    - Endpoint: POST /api/clients/login/
 *    - Params: { email, password, tenant_slug }
 *    - Response: { access, refresh, client }
 *    - Storage: clientAuthStorage.js
 *
 * TOKEN REFRESH:
 * ==============
 * - Staff: POST /api/users/token/refresh/ (params: { refresh })
 * - Client: POST /api/clients/token/refresh/ (params: { refresh })
 * - Automático via client.js interceptors (MOB-API-01)
 *
 * LOGOUT:
 * =======
 * - Limpa ambos tokens (staff + client)
 * - Chama handlers de logout (AuthContext, etc)
 *
 * PROFILES:
 * =========
 * - Staff: GET /api/users/me/profile/
 * - Client: GET /api/clients/me/
 *
 * PUBLIC ENDPOINTS:
 * =================
 * - Tenant Info: GET /api/users/tenant/meta/?tenant={slug}
 *   (sem autenticação necessária)
 */

import client from "../api/client";
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  triggerLogout,
  setLogoutHandler,
} from "../utils/authStorage";
import {
  getClientAccessToken,
  setClientAccessToken,
  setClientRefreshToken,
  getClientRefreshToken,
  clearClientTokens,
  triggerClientLogout,
  setClientLogoutHandler,
} from "../utils/clientAuthStorage";

// ============================================================
// STAFF AUTHENTICATION (Owner/Manager/Professional)
// ============================================================

/**
 * Login como staff (owner/manager/professional)
 * Salva tokens automaticamente em SecureStore
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, tenant}>}
 * @throws {Error} 401 Invalid credentials, network error, etc
 */
export const loginStaff = async (email, password) => {
  try {
    // Make POST request to /users/token/ with X-App-Type header
    const response = await client.post(
      "users/token/",
      {
        email,
        password,
      },
      {
        headers: {
          "X-App-Type": "admin", // Identify Admin App for backend plan validation
        },
      },
    );

    const { access, refresh, user, tenant } = response.data;

    // Validate response has required fields
    if (!access || !refresh) {
      throw new Error("Invalid response from server: missing tokens");
    }

    // Save tokens to SecureStore
    await setAccessToken(access);
    await setRefreshToken(refresh);

    return { user, tenant };
  } catch (error) {
    console.error("[auth] Staff login failed:", {
      email,
      status: error?.response?.status,
      message: error?.message,
      detail: error?.response?.data?.detail,
    });

    // Handle plan upgrade required (HTTP 403 from backend)
    if (error?.response?.status === 403) {
      const data = error.response.data;

      // Check if it's a plan upgrade error
      if (data?.plan_required) {
        // Create custom error with upgrade context
        const upgradeError = new Error(
          data.detail ||
            "Seu plano não permite acesso ao Admin App. Faça upgrade para continuar.",
        );
        upgradeError.code = "PLAN_UPGRADE_REQUIRED";
        upgradeError.planRequired = data.plan_required;
        upgradeError.currentPlan = data.current_plan;
        upgradeError.upgradeUrl = data.upgrade_url || "/pricing";

        console.warn("[auth] Plan upgrade required:", {
          planRequired: data.plan_required,
          currentPlan: data.current_plan,
        });

        throw upgradeError;
      }
    }

    // Re-throw with context for LoginScreen to handle
    throw error;
  }
};

/**
 * Get staff profile
 * Requer autenticação (staff token)
 *
 * @returns {Promise<{user, tenant, permissions}>}
 * @throws {Error} 401 Token expired/invalid, network error, etc
 */
export const getStaffProfile = async () => {
  try {
    const response = await client.get("users/me/profile/");
    return response.data; // { user, tenant, permissions }
  } catch (error) {
    console.error("[auth] ❌ Erro ao obter staff profile:", {
      status: error?.response?.status,
      message: error?.message,
      detail: error?.response?.data?.detail,
    });

    // Re-throw - tela de profile deve tratar 401 (redirect para login)
    throw error;
  }
};

// ============================================================
// CLIENT AUTHENTICATION (End Users - Clientes)
// ============================================================

/**
 * Login como cliente (agendamento)
 * Salva tokens automaticamente em SecureStore
 *
 * @param {string} email
 * @param {string} password
 * @param {string} tenantSlug - Identificador único do salão
 * @returns {Promise<{client}>}
 * @throws {Error} 400 Invalid tenant, 401 Invalid credentials, network error, etc
 */
export const loginClient = async (email, password, tenantSlug) => {
  try {
    // Validate tenant slug is provided
    if (!tenantSlug) {
      throw new Error("Tenant slug is required for client login");
    }

    // Make POST request to /clients/login/
    const response = await client.post("clients/login/", {
      email,
      password,
      tenant_slug: tenantSlug,
    });

    const { access, refresh, client: clientData } = response.data;

    // Validate response has required fields
    if (!access || !refresh || !clientData) {
      throw new Error(
        "Invalid response from server: missing tokens or client data",
      );
    }

    // Save tokens to SecureStore (client-specific storage)
    await setClientAccessToken(access);
    await setClientRefreshToken(refresh);

    return clientData;
  } catch (error) {
    console.error("[auth] Client login failed:", {
      email,
      tenantSlug,
      status: error?.response?.status,
      message: error?.message,
      detail: error?.response?.data?.detail,
    });

    // Re-throw with context for LoginScreen to handle
    throw error;
  }
};

/**
 * Get client profile
 * Requer autenticação (client token)
 *
 * @returns {Promise<{client, appointments}>}
 * @throws {Error} 401 Token expired/invalid, network error, etc
 */
export const getClientProfile = async () => {
  try {
    const response = await client.get("clients/me/");
    return response.data; // { client, appointments }
  } catch (error) {
    console.error("[auth] ❌ Erro ao obter client profile:", {
      status: error?.response?.status,
      message: error?.message,
      detail: error?.response?.data?.detail,
    });

    // Re-throw - tela de profile deve tratar 401 (redirect para login)
    throw error;
  }
};

// ============================================================
// LOGOUT (Both Staff + Client)
// ============================================================

/**
 * Logout - Limpa todos os tokens (staff + client)
 * Chama logout handlers para atualizar UI (AuthContext, etc)
 *
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await clearTokens();
    await clearClientTokens();
    triggerLogout();
    triggerClientLogout();
  } catch (error) {
    console.error("[auth] ❌ Erro ao fazer logout:", error);
  }
};

// ============================================================
// TENANT INFORMATION (Public - No Auth Required)
// ============================================================

/**
 * Get tenant information
 * Endpoint público - não requer autenticação
 *
 * Use para buscar info de um salão pelo slug (nome, logo, serviços, etc)
 * Útil antes do login para validar tenant e mostrar branding
 *
 * @param {string} tenantSlug - Identificador único do salão
 * @returns {Promise<{name, logo, services, contact, ...}>}
 * @throws {Error} 404 Tenant not found, network error, etc
 */
export const getTenantInfo = async (tenantSlug) => {
  if (!tenantSlug || tenantSlug.trim() === "") {
    throw new Error("Tenant slug é obrigatório");
  }

  try {
    // Public endpoint - não precisa de token
    const response = await client.get(
      `users/tenant/meta/?tenant=${encodeURIComponent(tenantSlug)}`,
    );

    return response.data; // { name, logo, services, contact, ... }
  } catch (error) {
    console.error("[auth] ❌ Erro ao obter tenant info:", {
      tenantSlug,
      status: error?.response?.status,
      message: error?.message,
      detail: error?.response?.data?.detail,
    });

    // Re-throw - tela de login deve tratar 404 (tenant não existe)
    throw error;
  }
};

// ============================================================
// LOGOUT HANDLERS (Optional - for AuthContext integration)
// ============================================================

/**
 * Set logout handler para staff
 * Chamado quando logout() é executado
 *
 * @param {Function} handler - callback que AuthContext pode usar
 */
export const setStaffLogoutHandler = (handler) => {
  setLogoutHandler(handler);
};

/**
 * Set logout handler para client
 * Chamado quando logout() é executado
 *
 * @param {Function} handler - callback que ClientAuthContext pode usar
 */
export const setClientLogoutHandlerCallback = (handler) => {
  setClientLogoutHandler(handler);
};
