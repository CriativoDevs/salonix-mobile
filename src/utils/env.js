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

export function getWebOrigin(apiBase = getApiBaseUrl()) {
  const envWebOrigin = getEnvVar("WEB_ORIGIN");
  if (envWebOrigin) {
    return envWebOrigin.endsWith("/") ? envWebOrigin.slice(0, -1) : envWebOrigin;
  }

  if (
    apiBase.includes("localhost") ||
    apiBase.includes("0.0.0.0") ||
    apiBase.includes("192.168")
  ) {
    return "http://localhost:5173";
  }

  if (apiBase.includes("timelyonestaging.pythonanywhere.com")) {
    return "https://timelyone-staging.vercel.app";
  }

  return "https://timelyone.today";
}

export function getRegistrationLink(slug, apiBase = getApiBaseUrl()) {
  return `${getWebOrigin(apiBase)}/join/${slug}`;
}

export const API_BASE_URL = getApiBaseUrl();

// O backend não tem storage em S3/CDN configurado — `logo_url`/`favicon_url`
// (e outros campos de ficheiro servidos por Django MEDIA_URL) vêm como paths
// relativos ("/media/logos/xyz.png"), sem protocolo nem domínio. O browser
// resolve isso automaticamente contra o domínio da página, mas o `Image` do
// React Native exige sempre uma URI absoluta — sem isto, o logo nunca aparece.
export function resolveMediaUrl(url, base = API_BASE_URL) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = base.replace(/\/?api\/?$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${path}`;
}
