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

  // Se estivermos em DEV (Expo GO), precisamos de lógica para Android e iOS
  if (__DEV__) {
    // Se houver uma variável de ambiente definida (ex: via .env local), usamos ela
    if (envBase) return envBase.endsWith("/") ? envBase : `${envBase}/`;

    // IMPORTANTE:
    // Android Emulator usa 10.0.2.2 para acessar localhost da máquina host
    // Dispositivo Físico Android precisa do IP da sua máquina na rede local (ex: 192.168.x.x)
    // iOS Simulator usa localhost normalmente

    // Tenta detectar se está rodando no Android
    const { Platform } = require("react-native");
    if (Platform.OS === "android") {
      // Se estiver usando dispositivo físico Android via Expo GO,
      // o ideal é colocar o IP da sua máquina aqui.
      // Tentativa automática: usar 10.0.2.2 (emulador) ou tentar um IP comum de rede local se necessário.
      // Para garantir que funcione no seu celular físico, use o IP da sua máquina:
      return "http://192.168.0.203:8000/api/";
    }

    // Fallback padrão para iOS Simulator / Web
    return "http://0.0.0.0:8000/api/";
  }

  // Lógica de Produção (Builds oficiais)
  if (!envBase || envBase.includes("localhost")) {
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
    return "https://salonix-backend-production.up.railway.app/reset-password";
  }

  return "https://salonix-backend-production.up.railway.app/reset-password";
};

export const API_BASE_URL = getApiBaseUrl();
