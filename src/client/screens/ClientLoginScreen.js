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
import { useLanguage } from "../../contexts/LanguageContext";
import { Button, Input, Alert } from "../../components/ui";
import { LanguageToggle } from "../../components/LanguageToggle";

const COPY = {
  pt: {
    title: "TimelyOne Client",
    subtitle: "Acesse a sua conta de cliente",
    hint: "Use o email e senha definidos no link de acesso enviado pelo estabelecimento.",
    tenantLabel: "Identificador do estabelecimento",
    tenantPlaceholder: "ex.: nome-do-salao",
    tenantRequired: "Identificador do estabelecimento é obrigatório",
    emailLabel: "Email",
    emailRequired: "Email é obrigatório",
    emailInvalid: "Email inválido",
    passwordLabel: "Senha",
    passwordRequired: "Senha é obrigatória",
    submit: "Entrar",
    welcome: "Bem-vindo! 👋",
    loginFailed: "Erro ao fazer login. Verifique os dados.",
  },
  en: {
    title: "TimelyOne Client",
    subtitle: "Sign in to your client account",
    hint: "Use the email and password set in the access link sent by the business.",
    tenantLabel: "Business identifier",
    tenantPlaceholder: "e.g.: salon-name",
    tenantRequired: "Business identifier is required",
    emailLabel: "Email",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email",
    passwordLabel: "Password",
    passwordRequired: "Password is required",
    submit: "Sign in",
    welcome: "Welcome! 👋",
    loginFailed: "Login failed. Check your details.",
  },
};

export default function ClientLoginScreen() {
  const [tenantSlug, setTenantSlugInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, authError, isLoading } = useClientAuth();
  const { showToast } = useToast();
  const { theme, colors, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = COPY[language] || COPY.pt;

  const [tenantError, setTenantError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const tenantInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const validateEmail = (text) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(text && !emailRegex.test(text.trim()) ? t.emailInvalid : "");
  };

  const handleLogin = async () => {
    if (!tenantSlug) {
      setTenantError(t.tenantRequired);
      return;
    }
    if (!email) {
      setEmailError(t.emailRequired);
      return;
    }
    if (!password) {
      setPasswordError(t.passwordRequired);
      return;
    }
    if (emailError) return;

    const result = await login(email, password, tenantSlug.trim());

    if (result.success) {
      showToast({ type: "success", message: t.welcome, duration: 3000 });
    } else {
      showToast({
        type: "error",
        message: result.error || t.loginFailed,
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
          <LanguageToggle
            language={language}
            onToggle={() => setLanguage(language === "pt" ? "en" : "pt")}
            size={18}
          />
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.subtitle}
          </Text>

          <View style={styles.alertContainer}>
            <Alert type="info" message={t.hint} />
          </View>

          <Input
            ref={tenantInputRef}
            label={t.tenantLabel}
            placeholder={t.tenantPlaceholder}
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
            label={t.emailLabel}
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
            label={t.passwordLabel}
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
            {t.submit}
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
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
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
