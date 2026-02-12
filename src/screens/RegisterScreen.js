import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../hooks/useTheme";
import { Button, Input, Alert } from "../components/ui";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const { colors } = useTheme();

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) newErrors.name = "Nome e obrigatorio";
    if (!email.trim()) newErrors.email = "Email e obrigatorio";
    else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Email invalido";
    }
    if (!password) newErrors.password = "Senha e obrigatoria";
    else if (password.length < 8) {
      newErrors.password = "Senha deve ter no minimo 8 caracteres";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Senhas nao conferem";
    }
    if (!acceptTerms) {
      newErrors.terms = "Voce deve aceitar os termos de uso";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Registro de staff nao e exposto no app neste momento.
      showToast({
        type: "info",
        message:
          "Registro disponivel apenas no painel web. Acesse pelo navegador.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation?.goBack?.()}
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
            Criar Conta
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Preencha os dados para criar sua conta
        </Text>

        <View style={styles.alertContainer}>
          <Alert
            type="info"
            message="Registro disponivel apenas para tenants com plano Standard. Para criar uma conta, acesse nossa plataforma web."
          />
        </View>

        <Input
          label="Nome completo"
          placeholder="Seu nome"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Telefone (opcional)"
          placeholder="(00) 00000-0000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Input
          label="Senha"
          placeholder="Minimo 8 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <Input
          label="Confirmar senha"
          placeholder="Digite a senha novamente"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
          onSubmitEditing={handleRegister}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAcceptTerms((prev) => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptTerms }}
        >
          <Ionicons
            name={acceptTerms ? "checkbox" : "square-outline"}
            size={24}
            color={acceptTerms ? colors.brandPrimary : colors.textSecondary}
          />
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            Aceito os{" "}
            <Text style={{ color: colors.brandPrimary }}>Termos de Uso</Text> e
            Politica de Privacidade
          </Text>
        </TouchableOpacity>
        {errors.terms && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.terms}
          </Text>
        )}

        <Button
          variant="link"
          onPress={handleRegister}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Criar Conta
        </Button>

        <View style={styles.loginLinkContainer}>
          <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
            Ja tem uma conta?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.("Login")}>
            <Text style={[styles.linkText, { color: colors.brandPrimary }]}>
              Fazer login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    marginBottom: 8,
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
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  alertContainer: {
    marginBottom: 24,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  termsText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
