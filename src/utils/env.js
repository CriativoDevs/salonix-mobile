import Constants from "expo-constants";

export const getEnvVar = (key, defaultValue = undefined) => {
  // 1. Try process.env (EAS Build injects variables here)
  if (process.env[key] !== undefined) {
    return process.env[key];
  }
  // 2. Try Constants.expoConfig.extra (Fallback for local dev)
  const value = Constants.expoConfig?.extra?.[key];
  return value !== undefined ? value : defaultValue;
};

export const getApiBaseUrl = () => {
  const envBase = getEnvVar("API_BASE_URL");

  // Se não houver variável, usar fallback baseado no ambiente
  if (!envBase) {
    return __DEV__
      ? "http://localhost:8000/api/"
      : "https://salonix-backend-production.up.railway.app/api/";
  }

  // Se houver variável, mas for localhost e não estivermos em DEV,
  // usar o fallback de produção (prevenção contra builds mal configurados)
  if (!__DEV__ && envBase.includes("localhost")) {
    console.warn(
      "[ENV] Localhost detectado em build de produção! Usando fallback do Railway.",
    );
    return "https://salonix-backend-production.up.railway.app/api/";
  }

  return envBase.endsWith("/") ? envBase : `${envBase}/`;
};

export const getResetUrl = () => {
  const envResetUrl = getEnvVar("RESET_URL");
  if (envResetUrl) {
    return envResetUrl;
  }

  const apiBase = getApiBaseUrl();
  if (apiBase.includes("localhost")) {
    return "http://localhost:5173/reset-password";
  }
  if (apiBase.includes("timelyonestaging.pythonanywhere.com")) {
    return "https://timelyonestaging.pythonanywhere.com/reset-password";
  }

  return "https://timelyone.com/reset-password";
};

export const API_BASE_URL = getApiBaseUrl();
