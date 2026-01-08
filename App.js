import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/contexts/AuthContext";
import { TenantProvider } from "./src/contexts/TenantContext";
import { RateLimitProvider } from "./src/contexts/RateLimitContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <TenantProvider>
      <RateLimitProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </RateLimitProvider>
    </TenantProvider>
  );
}
