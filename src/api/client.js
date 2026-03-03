import axios from "axios";
import { DeviceEventEmitter } from "react-native";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  triggerLogout,
} from "../utils/authStorage";
import {
  getClientAccessToken,
  getClientRefreshToken,
  setClientAccessToken,
  setClientRefreshToken,
  triggerClientLogout,
} from "../utils/clientAuthStorage";
import { API_BASE_URL } from "../utils/env";

console.log("[API] Client initialized with Base URL:", API_BASE_URL);

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  // Endpoints publicos nao devem enviar token
  const isPublicEndpoint =
    config.url?.includes("public/") ||
    config.url?.includes("users/tenant/meta/") ||
    config.url?.includes("users/password/reset/") ||
    config.url?.includes("users/password/reset/confirm/") ||
    config.url?.includes("users/token/");

  if (!isPublicEndpoint) {
    const clientToken = getClientAccessToken();
    const staffToken = getAccessToken();
    const token = clientToken || staffToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config._isClientToken = Boolean(clientToken);
    }
  }

  const locale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale || "pt-PT";
  const lang = locale.toLowerCase().startsWith("pt") ? "pt-PT" : "en";
  config.headers["Accept-Language"] = lang;
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

const addPendingRequest = (callback) => {
  pendingRequests.push(callback);
};

const resolvePendingRequests = (token) => {
  pendingRequests.forEach((callback) => callback(token));
  pendingRequests = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response) {
      return Promise.reject(error);
    }

    // Handle 429 - Rate Limit
    if (response.status === 429) {
      const retryAfterHeader = response.headers?.["retry-after"];
      let seconds = 60;

      if (retryAfterHeader) {
        seconds = parseInt(retryAfterHeader, 10);
      } else if (response.data?.detail) {
        const match = response.data.detail.match(/available in (\d+) seconds/);
        if (match) {
          seconds = parseInt(match[1], 10);
        }
      }

      DeviceEventEmitter.emit("api-rate-limit", { retryAfter: seconds });
      return Promise.reject(error);
    }

    // Handle 401 - Token refresh
    if (
      response.status !== 401 ||
      config._retry ||
      config.url?.includes("token/")
    ) {
      return Promise.reject(error);
    }

    const isClientToken = config._isClientToken;
    const refresh = isClientToken ? getClientRefreshToken() : getRefreshToken();

    if (!refresh) {
      if (isClientToken) {
        await triggerClientLogout();
      } else {
        await triggerLogout();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addPendingRequest((token) => {
          if (!token) {
            reject(error);
            return;
          }
          config.headers.Authorization = `Bearer ${token}`;
          resolve(client(config));
        });
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      const refreshEndpoint = isClientToken
        ? "clients/token/refresh/"
        : "users/token/refresh/";

      const { data } = await refreshClient.post(refreshEndpoint, { refresh });
      const { access, refresh: newRefresh } = data || {};

      if (isClientToken) {
        if (access) {
          await setClientAccessToken(access);
        }
        if (newRefresh) {
          await setClientRefreshToken(newRefresh);
        }
      } else {
        if (access) {
          await setAccessToken(access);
        }
        if (newRefresh) {
          await setRefreshToken(newRefresh);
        }
      }

      resolvePendingRequests(access || null);
      config.headers.Authorization = access ? `Bearer ${access}` : undefined;
      return client(config);
    } catch (refreshError) {
      resolvePendingRequests(null);
      if (isClientToken) {
        await triggerClientLogout();
      } else {
        await triggerLogout();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }

    return Promise.reject(error);
  },
);

export default client;
