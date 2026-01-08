import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  triggerLogout,
} from "../utils/authStorage";
import { API_BASE_URL } from "../utils/env";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Accept-Language"] = "pt-PT";
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

    // Handle 401 - Token refresh
    if (response.status === 401 && !config._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addPendingRequest((token) => {
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(client(config));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        const refresh = getRefreshToken();
        if (!refresh) {
          await triggerLogout();
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL}users/token/refresh/`,
          { refresh }
        );

        const newAccessToken = refreshResponse.data.access;
        await setAccessToken(newAccessToken);

        resolvePendingRequests(newAccessToken);
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(config);
      } catch (refreshError) {
        resolvePendingRequests(null);
        await triggerLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 429 - Rate Limit
    if (response.status === 429) {
      console.warn("[API] Rate limit triggered (429)");
      // Emitir evento para UI se necessário
    }

    return Promise.reject(error);
  }
);

export default client;
