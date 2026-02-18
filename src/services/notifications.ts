import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

type ExpoPushTokenResult = {
  token: string | null;
  error?: string;
};

type NotificationListener = (notification: Notifications.Notification) => void;

type NotificationResponseListener = (
  response: Notifications.NotificationResponse
) => void;

type NotificationData = Record<string, unknown>;

type NotificationNavigationHandler = (data: NotificationData) => void;

let foregroundSubscription: Notifications.Subscription | null = null;
let responseSubscription: Notifications.Subscription | null = null;

let navigationHandler: NotificationNavigationHandler | null = null;

export function setNotificationNavigationHandler(
  handler: NotificationNavigationHandler | null,
): void {
  navigationHandler = handler;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<ExpoPushTokenResult> {
  if (!Device.isDevice) {
    return {
      token: null,
      error: "push_not_available_on_emulator",
    };
  }

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

  if (Platform.OS === "android" && Constants?.appOwnership === "expo") {
    return {
      token: null,
      error: "android_expo_go_not_supported",
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
}

export function addNotificationListeners(
  onNotification?: NotificationListener,
  onResponse?: NotificationResponseListener,
): void {
  if (!foregroundSubscription) {
    foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (onNotification) {
          onNotification(notification);
        }
      }
    );
  }

  if (!responseSubscription) {
    responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (onResponse) {
          onResponse(response);
        }
        if (navigationHandler) {
          const data = response.notification.request.content
            .data as NotificationData;
          navigationHandler(data);
        }
      }
    );
  }
}

export function removeNotificationListeners(): void {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }

  if (responseSubscription) {
    responseSubscription.remove();
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
