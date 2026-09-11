import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useClientAuth } from "../../hooks/useClientAuth";
import { useToast } from "../../contexts/ToastContext";
import { useTheme } from "../../hooks/useTheme";
import { Button, Input, Alert } from "../../components/ui";

export default function ClientLoginScreen() {
  const [tenantSlug, setTenantSlugInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, authError, isLoading } = useClientAuth();
  const { showToast } = useToast();
  const { theme, colors, toggleTheme } = useTheme();

  const [tenantError, setTenantError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const tenantInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const validateEmail = (text) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(text && !emailRegex.test(text.trim()) ? "Email inválido" : "");
  };

  const handleLogin = async () => {
    if (!tenantSlug) {
      setTenantError("Identificador do estabelecimento é obrigatório");
      return;
    }
    if (!email) {
      setEmailError("Email é obrigatório");
      return;
    }
    if (!password) {
      setPasswordError("Senha é obrigatória");
      return;
    }
    if (emailError) return;

    const result = await login(email, password, tenantSlug.trim());

    if (result.success) {
      showToast({ type: "success", message: "Bem-vindo! 👋", duration: 3000 });
    } else {
      showToast({
        type: "error",
        message: result.error || "Erro ao fazer login. Verifique os dados.",
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    if (authError) {
      showToast({ type: "error", message: authError, duration: 5000 });
    }
  }, [authError]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.themeToggle}
            accessibilityLabel={`Alternar para modo ${theme === "light" ? "escuro" : "claro"}`}
            accessibilityRole="button"
          >
            <Ionicons
              name={theme === "light" ? "moon-outline" : "sunny-outline"}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            TimelyOne Client
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Acesse a sua conta de cliente
          </Text>

          <View style={styles.alertContainer}>
            <Alert
              type="info"
              message="Use o email e senha definidos no link de acesso enviado pelo estabelecimento."
            />
          </View>

          <Input
            ref={tenantInputRef}
            label="Identificador do estabelecimento"
            placeholder="ex.: nome-do-salao"
            value={tenantSlug}
            onChangeText={(text) => {
              setTenantSlugInput(text);
              setTenantError("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            error={tenantError}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
          />

          <Input
            ref={emailInputRef}
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={validateEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />

          <Input
            ref={passwordInputRef}
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
            secureTextEntry
            error={passwordError}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <Button
            variant="link"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          >
            Entrar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  themeToggle: { padding: 8, borderRadius: 8 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: { fontSize: 16, marginBottom: 24, textAlign: "center" },
  alertContainer: { marginBottom: 24 },
});
