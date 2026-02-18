import client from "./client";
import { getAccessToken } from "../utils/authStorage";

export async function login(email, password, { captchaBypassToken } = {}) {
  const headers = {};
  if (captchaBypassToken) {
    headers["X-Captcha-Token"] = captchaBypassToken;
  }
  const response = await client.post(
    "users/token/",
    { email, password },
    { headers },
  );
  return response.data;
}

export async function refreshToken(refresh) {
  const response = await client.post("users/token/refresh/", { refresh });
  return response.data;
}

export async function fetchFeatureFlags() {
  const response = await client.get("users/me/features/");
  return response.data;
}

export async function fetchTenantBootstrap() {
  const response = await client.get("users/me/tenant/");
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await client.get("users/me/profile/");
  return response.data;
}

export async function registerPushToken(token, platform, appVersion, slug) {
  const payload = {
    token,
    platform,
    device_type: "mobile",
  };

  if (appVersion) {
    payload.app_version = appVersion;
  }

  const headers = {};
  if (slug) {
    headers["X-Tenant-Slug"] = slug;
  }

  const access = getAccessToken();
  if (access) {
    headers["Authorization"] = `Bearer ${access}`;
  }

  const tokenPreview = token ? `${String(token).slice(0, 12)}...` : null;
  console.log("[MOB] registerPushToken request", {
    platform,
    appVersion,
    slug,
    hasAuthHeader: Boolean(headers.Authorization),
    tokenPreview,
  });

  try {
    const response = await client.post(
      "notifications/register_device/",
      payload,
      { headers },
    );
    console.log("[MOB] registerPushToken success", {
      status: response.status,
      platform,
      slug,
    });
    return response.data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.log("[MOB] registerPushToken error", {
      status,
      data,
      message: err?.message,
    });
    if (status === 401) {
      // Retry uma vez re-lendo o token (race após login)
      const retryAccess = getAccessToken();
      if (retryAccess && retryAccess !== access) {
        headers["Authorization"] = `Bearer ${retryAccess}`;
        const response = await client.post(
          "notifications/register_device/",
          payload,
          { headers },
        );
        console.log("[MOB] registerPushToken retry success", {
          status: response.status,
          platform,
          slug,
        });
        return response.data;
      }
    }
    throw err;
  }
}
