import * as SecureStore from "expo-secure-store";

const REFRESH_KEY = "salonix_refresh_token";
const ACCESS_KEY = "salonix_access_token";

let accessToken = null;
let refreshToken = null;
let logoutHandler = null;

// Inicializar tokens do SecureStore
export const initializeTokens = async () => {
  try {
    accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  } catch (error) {
    console.error("[authStorage] Error loading tokens:", error);
  }
};

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

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const clearTokens = async () => {
  await setAccessToken(null);
  await setRefreshToken(null);
};

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const triggerLogout = async () => {
  await clearTokens();
  if (typeof logoutHandler === "function") {
    logoutHandler();
  }
};
