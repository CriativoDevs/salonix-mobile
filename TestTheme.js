/**
 * TestTheme - Tela de teste para validar sistema de temas
 *
 * Exibe:
 * - ThemeToggle funcionando
 * - Cores atuais do tema (light/dark)
 * - Todas as cores da paleta
 * - Preview dos componentes UI com tema aplicado
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "./src/hooks/useTheme";
import ThemeToggle from "./src/components/ThemeToggle";

export default function TestTheme() {
  const { theme, colors, isLoading } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>Carregando tema...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Sistema de Temas
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tema atual: {theme === "dark" ? "Escuro 🌙" : "Claro ☀️"}
            </Text>
          </View>
          <ThemeToggle size={28} />
        </View>

        {/* Paleta de Cores */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Paleta de Cores
          </Text>

          {/* Backgrounds */}
          <ColorBox
            label="background"
            color={colors.background}
            textColor={colors.textPrimary}
          />
          <ColorBox
            label="surface"
            color={colors.surface}
            textColor={colors.textPrimary}
          />
          <ColorBox
            label="surfaceVariant"
            color={colors.surfaceVariant}
            textColor={colors.textPrimary}
          />

          {/* Text Colors */}
          <View style={[styles.colorRow, { backgroundColor: colors.surface }]}>
            <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>
              Text Colors:
            </Text>
            <View style={styles.colorSamples}>
              <View style={styles.textSample}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Primary
                </Text>
              </View>
              <View style={styles.textSample}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                  Secondary
                </Text>
              </View>
              <View style={styles.textSample}>
                <Text style={{ color: colors.textTertiary, fontSize: 16 }}>
                  Tertiary
                </Text>
              </View>
            </View>
          </View>

          {/* Brand Colors */}
          <ColorBox
            label="brandPrimary"
            color={colors.brandPrimary}
            textColor="#ffffff"
          />
          <ColorBox
            label="brandSecondary"
            color={colors.brandSecondary}
            textColor="#ffffff"
          />

          {/* Semantic Colors */}
          <ColorBox
            label="success"
            color={colors.success}
            textColor="#ffffff"
          />
          <ColorBox
            label="error"
            color={colors.error}
            textColor="#ffffff"
          />
          <ColorBox
            label="warning"
            color={colors.warning}
            textColor="#ffffff"
          />
          <ColorBox
            label="info"
            color={colors.info}
            textColor="#ffffff"
          />

          {/* Borders */}
          <View
            style={[
              styles.colorRow,
              {
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.colorLabel, { color: colors.textPrimary }]}>
              border
            </Text>
            <Text style={[styles.colorValue, { color: colors.textSecondary }]}>
              {colors.border}
            </Text>
          </View>
        </View>

        {/* Preview de Componentes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Preview de Componentes
          </Text>

          {/* Card Preview */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Card Component
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Este é um exemplo de card com tema aplicado. As cores mudam
              automaticamente.
            </Text>
          </View>

          {/* Button Previews */}
          <View
            style={[styles.button, { backgroundColor: colors.brandPrimary }]}
          >
            <Text style={styles.buttonText}>Primary Button</Text>
          </View>

          <View
            style={[
              styles.button,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: colors.brandPrimary,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.brandPrimary }]}>
              Outline Button
            </Text>
          </View>

          {/* Alert Previews */}
          <View
            style={[
              styles.alert,
              { backgroundColor: colors.successBackground },
            ]}
          >
            <Text style={[styles.alertText, { color: colors.success }]}>
              ✓ Success Alert
            </Text>
          </View>

          <View
            style={[styles.alert, { backgroundColor: colors.errorBackground }]}
          >
            <Text style={[styles.alertText, { color: colors.error }]}>
              ✕ Error Alert
            </Text>
          </View>

          <View
            style={[
              styles.alert,
              { backgroundColor: colors.warningBackground },
            ]}
          >
            <Text style={[styles.alertText, { color: colors.warning }]}>
              ⚠ Warning Alert
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Teste o toggle no canto superior para ver as mudanças
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente auxiliar para exibir caixas de cor
const ColorBox = ({ label, color, textColor }) => (
  <View style={[styles.colorRow, { backgroundColor: color }]}>
    <Text style={[styles.colorLabel, { color: textColor }]}>{label}</Text>
    <Text style={[styles.colorValue, { color: textColor }]}>{color}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  colorValue: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  colorSamples: {
    flexDirection: "row",
    gap: 12,
  },
  textSample: {
    paddingVertical: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  alert: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
