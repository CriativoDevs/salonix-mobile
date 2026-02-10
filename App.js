import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/contexts/AuthContext";
import { TenantProvider } from "./src/contexts/TenantContext";
import { RateLimitProvider } from "./src/contexts/RateLimitContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ActivityIndicator, View, Text } from "react-native";
import TestBarrelExport from "./src/screens/TestBarrelExport";

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Temporário: Testar LoginScreen atualizado
  const [testMode] = useState(false);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator
          size="large"
          color="#3b82f6"
        />
        <Text style={{ marginTop: 10 }}>Carregando fontes...</Text>
      </View>
    );
  }

  // TESTE: Mostrar TestBarrelExport
  if (testMode) {
    return <TestBarrelExport />;
  }

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
