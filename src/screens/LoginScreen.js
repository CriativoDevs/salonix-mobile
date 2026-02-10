import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../hooks/useTenant";
import { useToast } from "../contexts/ToastContext";
import { Button, Input, Alert } from "../components/ui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, authError, isLoading, isAuthenticated } = useAuth();
  const { branding } = useTenant();
  const { showToast } = useToast();

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{branding?.name || "TimelyOne"}</Text>
          <Text style={styles.subtitle}>Acesse sua conta</Text>

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
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
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
