import React, { useState } from "react";
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
import { Button, Input } from "../components/ui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, authError, isLoading } = useAuth();
  const { branding } = useTenant();

  // Validação básica de email
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
      return;
    }
    if (!password) {
      setPasswordError("Senha é obrigatória");
      return;
    }
    if (emailError || passwordError) return;

    await login(email, password);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{branding?.name || "TimelyOne"}</Text>
          <Text style={styles.subtitle}>Acesse sua conta</Text>

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

          {authError && <Text style={styles.authError}>{authError}</Text>}

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
  authError: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
});
