import client from "./client";

export async function login(email, password, { captchaBypassToken } = {}) {
  const headers = {};
  if (captchaBypassToken) {
    headers["X-Captcha-Token"] = captchaBypassToken;
  }
  const response = await client.post(
    "users/token/",
    { email, password },
    { headers }
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

export async function registerPushToken(token, platform) {
  const response = await client.post("notifications/register_device/", {
    token,
    platform,
    device_type: "mobile",
  });
  return response.data;
}
