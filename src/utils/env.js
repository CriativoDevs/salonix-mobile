import Constants from "expo-constants";

export const getEnvVar = (key, defaultValue = undefined) => {
  const value = Constants.expoConfig?.extra?.[key];
  return value !== undefined ? value : defaultValue;
};

export const getApiBaseUrl = () => {
  const envBase = getEnvVar("API_BASE_URL");
  const defaultBase = __DEV__
    ? "http://localhost:8000/api/"
    : "https://production.salonix.com/api/";

  const configuredBase = envBase || defaultBase;
  return configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
};

export const API_BASE_URL = getApiBaseUrl();
