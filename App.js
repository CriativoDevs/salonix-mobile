import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/contexts/AuthContext";
import { TenantProvider } from "./src/contexts/TenantContext";
import { RateLimitProvider } from "./src/contexts/RateLimitContext";
import { ToastProvider } from "./src/contexts/ToastContext";
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
import {
  ActivityIndicator,
  View,
  Text,
  SafeAreaView,
  Pressable,
} from "react-native";
import TestToast from "./src/components/TestToast";
import TestModal from "./src/components/TestModal";
import TestAlert from "./src/components/TestAlert";

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Temporário: Testar componentes
  // Altere para true para ver telas de teste, false para usar o app real
  const [testMode] = useState(false);
  const [testComponent, setTestComponent] = useState("menu"); // 'toast', 'modal', 'alert' ou 'menu'

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

  // TESTE: Mostrar TestToast
  if (testMode) {
    if (testComponent === "menu") {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#f8fafc",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Escolha o componente para testar
          </Text>
          <Pressable
            onPress={() => setTestComponent("toast")}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#2563eb" : "#3b82f6",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            })}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Toast Component
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTestComponent("modal")}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#2563eb" : "#3b82f6",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            })}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Modal Component
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTestComponent("alert")}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#2563eb" : "#3b82f6",
              padding: 16,
              borderRadius: 12,
            })}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Alert Component
            </Text>
          </Pressable>
        </SafeAreaView>
      );
    }

    return (
      <ToastProvider>
        {testComponent === "toast" ? (
          <TestToast />
        ) : testComponent === "modal" ? (
          <TestModal />
        ) : (
          <TestAlert />
        )}
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
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
    </ToastProvider>
  );
}
