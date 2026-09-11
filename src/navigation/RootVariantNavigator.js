import Constants from "expo-constants";
import AdminNavigator from "../admin/navigation/AdminNavigator";
import ClientNavigator from "../client/navigation/ClientNavigator";

// APP_VARIANT vem de app.config.js -> extra.APP_VARIANT (ver env.js para o
// mesmo padrão de leitura via Constants.expoConfig.extra já usado no app).
const APP_VARIANT =
  Constants.expoConfig?.extra?.APP_VARIANT === "client" ? "client" : "admin";

export default function RootVariantNavigator() {
  return APP_VARIANT === "client" ? <ClientNavigator /> : <AdminNavigator />;
}
