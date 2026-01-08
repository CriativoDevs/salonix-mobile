import Constants from "expo-constants";

export const getEnvVar = (key, defaultValue = "") => {
  const extra = Constants.expoConfig?.extra || {};
  return extra[key] || defaultValue;
};

export const API_BASE_URL = getEnvVar(
  "API_BASE_URL",
  "http://localhost:8000/api/"
);
