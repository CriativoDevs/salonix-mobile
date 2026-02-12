import React, { useState, useEffect } from "react";
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
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../hooks/useTenant";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../hooks/useTheme";
import { Button, Input, Alert } from "../components/ui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, authError, isLoading, isAuthenticated } = useAuth();
  const { branding } = useTenant();
  const { showToast } = useToast();
  const { theme, colors, toggleTheme } = useTheme();

  // Validação básica de email
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);

  const validateEmail = (text) => {
    setEmail(text);
    if (text && !text.includes("@")) {
      setEmailError("Email inválido");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (text) => {
    setPassword(text);
    if (text && text.length < 6) {
      setPasswordError("Senha muito curta (mínimo 6 caracteres)");
    } else {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    // Validação antes de submeter
    if (!email) {
      setEmailError("Email é obrigatório");
      showToast({
        type: "error",
        message: "Por favor, preencha o email",
      });
      return;
    }
    if (!password) {
      setPasswordError("Senha é obrigatória");
      showToast({
        type: "error",
        message: "Por favor, preencha a senha",
      });
      return;
    }
    if (emailError || passwordError) return;

    const result = await login(email, password);

    if (result.success) {
      showToast({
        type: "success",
        message: `Bem-vindo de volta! 👋`,
        duration: 3000,
      });
    } else {
      showToast({
        type: "error",
        message:
          result.error || "Erro ao fazer login. Verifique suas credenciais.",
        duration: 5000,
      });
    }
  };

  // Mostrar toast de erro quando authError mudar
  useEffect(() => {
    if (authError) {
      showToast({
        type: "error",
        message: authError,
        duration: 5000,
      });
    }
  }, [authError]);

  // Mostrar toast de sucesso quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      showToast({
        type: "success",
        message: "Login realizado com sucesso!",
        duration: 3000,
      });
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Toggle de tema no canto superior direito */}
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
            {branding?.name || "TimelyOne"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Acesse sua conta
          </Text>

          {/* Alert de boas-vindas (closable) */}
          {showWelcomeAlert && (
            <View style={styles.alertContainer}>
              <Alert
                type="info"
                message="Use o email e senha fornecidos pelo administrador do sistema."
                closable
                onClose={() => setShowWelcomeAlert(false)}
              />
            </View>
          )}

          <Input
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={validateEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Input
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChangeText={validatePassword}
            secureTextEntry
            error={passwordError}
          />

          {/* Botão usa variant="link" (padrão no FEW - 90% dos casos) */}
          <Button
            variant="link"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading || !!emailError || !!passwordError}
          >
            Entrar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor removido (dinâmico via colors.background)
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  themeToggle: {
    padding: 8,
    borderRadius: 8,
    // Sem background para manter clean (apenas ícone)
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    // color removido (dinâmico via colors.textPrimary)
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    // color removido (dinâmico via colors.textSecondary)
    marginBottom: 32,
    textAlign: "center",
  },
  alertContainer: {
    marginBottom: 24,
  },
  authError: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
});
