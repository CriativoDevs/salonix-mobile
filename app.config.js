const APP_VARIANT = process.env.APP_VARIANT === "client" ? "client" : "admin";
const IS_CLIENT = APP_VARIANT === "client";

const VARIANT = {
  admin: {
    name: "TimelyOne",
    slug: "salonix-mobile",
    scheme: "timelyone",
    bundleIdentifier: "com.timelyone.app",
    androidPackage: "com.timelyone.app",
    icon: "./assets/icon.png",
    adaptiveIconForeground: "./assets/adaptive-icon.png",
    splashImage: "./assets/splash-native.png",
    notificationIcon: "./assets/notification-icon.png",
    notificationColor: "#2563EB",
    easProjectId: "6642ca0c-7940-4fd3-b2a9-1af204db242b",
    version: "2.3.0",
  },
  client: {
    name: "TimelyOne Client",
    slug: "salonix-mobile-client",
    scheme: "timelyoneclient",
    bundleIdentifier: "com.timelyone.client",
    androidPackage: "com.timelyone.client",
    version: "1.0.0",
    // Placeholders: reaproveita os mesmos assets do admin até haver design
    // próprio para a variante cliente (MOB-CLIENT-01).
    icon: "./assets/icon.png",
    adaptiveIconForeground: "./assets/adaptive-icon.png",
    splashImage: "./assets/splash-native.png",
    notificationIcon: "./assets/notification-icon.png",
    notificationColor: "#2563EB",
    // TODO(MOB-CLIENT-00): criar projeto EAS próprio para a variante cliente
    // (eas project:init) e substituir este placeholder. Buildar
    // production-client sem isto configurado publicaria sob o projeto EAS
    // do admin.
    easProjectId: process.env.EAS_PROJECT_ID_CLIENT || "5578952f-f9b5-4d3a-9af1-971743938639",
  },
}[APP_VARIANT];

if (IS_CLIENT && VARIANT.easProjectId.startsWith("TODO")) {
  const isBuildContext = Boolean(process.env.EAS_BUILD || process.env.CI);
  if (isBuildContext) {
    throw new Error(
      "APP_VARIANT=client requer EAS_PROJECT_ID_CLIENT configurado antes de build/submit."
    );
  }
}

module.exports = ({ config }) => ({
  ...config,
  name: VARIANT.name,
  slug: VARIANT.slug,
  scheme: VARIANT.scheme,
  version: VARIANT.version,
  orientation: "portrait",
  icon: VARIANT.icon,
  userInterfaceStyle: "automatic",
  splash: {
    image: VARIANT.splashImage,
    resizeMode: "contain",
    backgroundColor: "#0D1B2A",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: VARIANT.bundleIdentifier,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: VARIANT.adaptiveIconForeground,
      backgroundColor: "#0D1B2A",
    },
    package: VARIANT.androidPackage,
    googleServicesFile: "./google-services.json",
    permissions: ["NOTIFICATIONS", "VIBRATE"],
  },
  web: { favicon: "./assets/favicon.png" },
  plugins: [
    ["expo-notifications", { icon: VARIANT.notificationIcon, color: VARIANT.notificationColor }],
    "expo-asset",
    "expo-font",
    "expo-secure-store",
    ["expo-build-properties", { android: { usesCleartextTraffic: false } }],
    "expo-web-browser",
  ],
  extra: {
    ...(config.extra || {}),
    APP_VARIANT,
    ...(VARIANT.easProjectId.startsWith("TODO")
      ? {}
      : { eas: { projectId: VARIANT.easProjectId } }),
  },
});
