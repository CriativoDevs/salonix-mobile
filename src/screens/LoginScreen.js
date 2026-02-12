import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert as NativeAlert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../hooks/useTenant";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../hooks/useTheme";
import { Button, Input, Alert } from "../components/ui";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, authError, isLoading, isAuthenticated } = useAuth();
  const { branding } = useTenant();
  const { showToast } = useToast();
  const { theme, colors, toggleTheme } = useTheme();

  // Validação de email
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);

  // Refs para auto-focus
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const validateEmail = (text) => {
    setEmail(text);
    // Regex completo para validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text.trim())) {
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
      // Check if plan upgrade is required
      if (result.requiresPlanUpgrade) {
        NativeAlert.alert(
          "Upgrade Necessário",
          result.error ||
            "Seu plano não permite acesso ao Admin App. Faça upgrade para continuar.",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Ver Planos",
              onPress: () => {
                const url = result.upgradeUrl
                  ? `https://timelyone.com${result.upgradeUrl}`
                  : "https://timelyone.com/pricing";
                Linking.openURL(url).catch((err) => {
                  console.error("[LoginScreen] Erro ao abrir URL:", err);
                  showToast({
                    type: "error",
                    message: "Não foi possível abrir o link",
                    duration: 3000,
                  });
                });
              },
              style: "default",
            },
          ],
          { cancelable: true },
        );
        return;
      }

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

  // Auto-focus no campo email ao montar
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
            onChangeText={validatePassword}
            secureTextEntry
            error={passwordError}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          {/* Link Esqueci minha senha */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotPassword}
          >
            <Text style={[styles.linkText, { color: colors.brandPrimary }]}>
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          {/* Botão usa variant="link" (padrão no FEW - 90% dos casos) */}
          <Button
            variant="link"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading || !!emailError || !!passwordError}
          >
            Entrar
          </Button>

          {/* Link Cliente (futuro - comentado para MOB-CTX-02) */}
          {/*
          <View style={styles.clientLinkContainer}>
            <Text style={[styles.clientLinkText, { color: colors.textSecondary }]}>
              É cliente?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('ClientLogin')}>
              <Text style={[styles.linkText, { color: colors.brandPrimary }]}>
                Acesse sua área
              </Text>
            </TouchableOpacity>
          </View>
          */}
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 16,
    padding: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clientLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  clientLinkText: {
    fontSize: 14,
  },
});
