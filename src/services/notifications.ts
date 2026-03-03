// import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

type ExpoPushTokenResult = {
  token: string | null;
  error?: string;
};

// Tipos adaptados para evitar dependência direta do tipo Notifications
type NotificationListener = (notification: any) => void;
type NotificationResponseListener = (response: any) => void;
type NotificationData = Record<string, unknown>;
type NotificationNavigationHandler = (data: NotificationData) => void;

let foregroundSubscription: any = null;
let responseSubscription: any = null;

let navigationHandler: NotificationNavigationHandler | null = null;

// Função auxiliar para carregar o módulo de forma segura
const getNotificationsModule = () => {
  try {
    // No Expo Go Android, isso pode falhar ou emitir warning, mas o require é mais seguro que import estático
    if (Platform.OS === "android" && Constants?.appOwnership === "expo") {
      return null;
    }
    return require("expo-notifications");
  } catch (e) {
    console.warn("expo-notifications not available:", e);
    return null;
  }
};

export function setNotificationNavigationHandler(
  handler: NotificationNavigationHandler | null,
): void {
  navigationHandler = handler;
}

// Configuração inicial segura
const Notifications = getNotificationsModule();
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<ExpoPushTokenResult> {
  const Notifications = getNotificationsModule();

  // Se o módulo não estiver disponível (Expo Go Android), aborta graciosamente
  if (!Notifications) {
    console.log("[Push] Expo Go Android detectado ou módulo indisponível. Push ignorado.");
    return {
      token: null,
      error: "android_expo_go_not_supported",
    };
  }

  if (!Device.isDevice) {
    return {
      token: null,
      error: "push_not_available_on_emulator",
    };
  }

  try {
    const existingStatus = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus.status;

    if (finalStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return {
        token: null,
        error: "push_permission_denied",
      };
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      return {
        token: null,
        error: "eas_project_id_missing",
      };
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return {
      token: pushToken.data ?? null,
    };
  } catch (error) {
    console.error("[Push] Erro ao registrar notificações:", error);
    return {
      token: null,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

export function addNotificationListeners(
  onNotification?: NotificationListener,
  onResponse?: NotificationResponseListener,
): void {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  if (!foregroundSubscription) {
    foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        if (onNotification) {
          onNotification(notification);
        }
      }
    );
  }

  if (!responseSubscription) {
    responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        if (onResponse) {
          onResponse(response);
        }

        const data = response.notification.request.content.data;
        if (navigationHandler && data) {
          navigationHandler(data);
        }
      }
    );
  }
}

export function removeNotificationListeners(): void {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  if (foregroundSubscription) {
    Notifications.removeNotificationSubscription(foregroundSubscription);
    foregroundSubscription = null;
  }
  if (responseSubscription) {
    Notifications.removeNotificationSubscription(responseSubscription);
    responseSubscription = null;
  }
}

export async function handleInitialNotificationNavigation(): Promise<void> {
  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse && navigationHandler) {
    const data = lastResponse.notification.request.content
      .data as NotificationData;
    navigationHandler(data);
  }
}

export function getPlatformInfo() {
  return {
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? "1.0.0",
  };
}
