import React, { useEffect, useMemo, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

import TabNavigator from "./TabNavigator";
import AccountScreen from "../screens/AccountScreen";
import { useAuth } from "../hooks/useAuth";
import { hasSeenOnboarding } from "../utils/onboardingStorage";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  const navigatorKey = useMemo(
    () => (isAuthenticated ? "auth" : hasSeen ? "unauth_seen" : "unauth_new"),
    [isAuthenticated, hasSeen],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const seen = await hasSeenOnboarding();
        if (mounted) setHasSeen(seen);
      } finally {
        if (mounted) setOnboardingChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || !onboardingChecked) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      key={navigatorKey}
      screenOptions={{ headerShown: false }}
      initialRouteName={
        isAuthenticated ? "Home" : hasSeen ? "Login" : "Onboarding"
      }
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Home"
            component={TabNavigator}
          />
          <Stack.Screen
            name="Account"
            component={AccountScreen}
          />
        </>
      ) : hasSeen ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
