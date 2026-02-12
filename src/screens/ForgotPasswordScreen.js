import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../hooks/useTheme";
import { Button, Input, Alert } from "../components/ui";
import { forgotPassword } from "../services/auth";
import { getResetUrl } from "../utils/env";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { showToast } = useToast();
  const { colors } = useTheme();

  const validateEmail = (text) => {
    setEmail(text.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text.trim())) {
      setEmailError("Email invalido");
    } else {
      setEmailError("");
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setEmailError("Email e obrigatorio");
      showToast({
        type: "error",
        message: "Por favor, preencha o email",
      });
      return;
    }
    if (emailError) return;

    setIsLoading(true);
    try {
      const resetUrl = getResetUrl();
      await forgotPassword(email.trim(), resetUrl);

      setEmailSent(true);
      showToast({
        type: "success",
        message:
          "Email de recuperacao enviado. Verifique sua caixa de entrada.",
        duration: 5000,
      });
    } catch (error) {
      showToast({
        type: "error",
        message:
          error?.response?.data?.detail ||
          "Erro ao enviar email. Tente novamente.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackToLogin}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Recuperar Senha
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {!emailSent ? (
            <>
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
              >
                Digite seu email cadastrado. Enviaremos um link para redefinir
                sua senha.
              </Text>

              <Input
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={validateEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                error={emailError}
                onSubmitEditing={handleSendEmail}
                returnKeyType="send"
              />

              <Button
                variant="link"
                onPress={handleSendEmail}
                loading={isLoading}
                disabled={isLoading || !!emailError}
              >
                Enviar Email
              </Button>
            </>
          ) : (
            <>
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={colors.success}
                />
                <Text
                  style={[styles.successTitle, { color: colors.textPrimary }]}
                >
                  Email Enviado
                </Text>
                <Text
                  style={[
                    styles.successDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Verifique sua caixa de entrada e siga as instrucoes para
                  redefinir sua senha.
                </Text>

                <Alert
                  type="info"
                  message="Nao recebeu o email? Verifique o spam ou tente novamente em alguns minutos."
                />
              </View>

              <Button
                variant="link"
                onPress={handleBackToLogin}
              >
                Voltar para Login
              </Button>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 20,
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
});
