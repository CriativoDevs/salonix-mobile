import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Input } from "../components/ui/Input";

export default function TestInput() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");

  const [emailError, setEmailError] = useState("");

  const handleEmailBlur = () => {
    if (email && !email.includes("@")) {
      setEmailError("Email inválido");
    } else {
      setEmailError("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Test Input Components</Text>

        {/* Input básico com label */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Input Básico com Label</Text>
          <Input
            label="Email"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onBlur={handleEmailBlur}
            error={emailError}
          />
        </View>

        {/* Input com erro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Input com Erro (border vermelho)
          </Text>
          <Input
            label="Senha"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error="Senha muito curta (mínimo 8 caracteres)"
          />
        </View>

        {/* Input com description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Input com Description (helper text)
          </Text>
          <Input
            label="Telefone"
            placeholder="+351 912 345 678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            description="Formato: +351 XXX XXX XXX"
          />
        </View>

        {/* Input sem label */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Input sem Label (busca)</Text>
          <Input
            placeholder="Buscar serviços..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Specs visuais */}
        <View style={styles.specsContainer}>
          <Text style={styles.specsTitle}>
            ✅ Specs Baseadas no FormInput.jsx:
          </Text>
          <Text style={styles.specsText}>
            • Label: text-sm (14px) font-medium (500)
            text-brand-surfaceForeground (#0f172a){"\n"}• Input: rounded-lg
            (8px) border px-3 py-2 text-sm{"\n"}• Border normal:
            border-brand-border (#e2e8f0){"\n"}• Border error: border-rose-400
            (#fb7185){"\n"}• Placeholder: #94a3b8 (text-muted){"\n"}• Error
            text: text-xs (12px) text-rose-600 (#e11d48){"\n"}• Description:
            text-xs (12px) text-brand-muted (#94a3b8)
          </Text>
        </View>
      </ScrollView>
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
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
    color: "#0f172a",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 12,
  },
  specsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  specsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
    marginBottom: 8,
  },
  specsText: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 18,
  },
});
