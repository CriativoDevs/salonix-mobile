/**
 * TestComponents - Tela de teste para validar componentes UI com tema
 *
 * Testa os componentes REAIS que foram modificados:
 * - Button (primary, secondary, link)
 * - Input (normal, com erro)
 * - Card (default, elevated, clicável)
 * - Alert (info, success, warning, error)
 * - Toast (via ToastProvider)
 * - Modal (controlado por estado)
 * - PaginationDots
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "./src/hooks/useTheme";
import ThemeToggle from "./src/components/ThemeToggle";
import { Button } from "./src/components/ui/Button";
import { Input } from "./src/components/ui/Input";
import { Card } from "./src/components/ui/Card";
import { Alert } from "./src/components/ui/Alert";
import { Modal } from "./src/components/ui/Modal";
import { PaginationDots } from "./src/components/ui/PaginationDots";
import { useToast } from "./src/contexts/ToastContext";

export default function TestComponents() {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleInputChange = (text) => {
    setInputValue(text);
    if (text.length > 0 && text.length < 3) {
      setInputError("Mínimo 3 caracteres");
    } else {
      setInputError("");
    }
  };

  const showSuccessToast = () => {
    showToast("Operação realizada com sucesso!", "success");
  };

  const showErrorToast = () => {
    showToast("Erro ao processar solicitação", "error");
  };

  const showWarningToast = () => {
    showToast("Atenção: Verifique os dados antes de continuar", "warning");
  };

  const showInfoToast = () => {
    showToast("Dica: Você pode alternar o tema no botão acima", "info");
  };

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
              Teste de Componentes UI
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tema: {theme === "dark" ? "Escuro 🌙" : "Claro ☀️"}
            </Text>
          </View>
          <ThemeToggle size={28} />
        </View>

        {/* Button Component */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Button Component
          </Text>

          <Button
            variant="primary"
            onPress={() => alert("Primary button pressed")}
          >
            Primary Button
          </Button>

          <Button
            variant="secondary"
            onPress={() => alert("Secondary button pressed")}
          >
            Secondary Button
          </Button>

          <Button
            variant="link"
            onPress={() => alert("Link button pressed")}
          >
            Link Button
          </Button>

          <Button
            variant="primary"
            disabled
          >
            Disabled Button
          </Button>

          <Button
            variant="primary"
            loading
          >
            Loading Button
          </Button>
        </View>

        {/* Input Component */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Input Component
          </Text>

          <Input
            label="Nome Completo"
            placeholder="Digite seu nome"
            value={inputValue}
            onChangeText={handleInputChange}
            description="Use pelo menos 3 caracteres"
          />

          <Input
            label="Email"
            placeholder="seu@email.com"
            error={inputError}
            value={inputValue}
            onChangeText={handleInputChange}
          />

          <Input
            label="Senha"
            placeholder="********"
            secureTextEntry
          />
        </View>

        {/* Card Component */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Card Component
          </Text>

          <Card variant="default">
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Card Padrão
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Este é um card padrão com tema aplicado. As cores mudam
              automaticamente.
            </Text>
          </Card>

          <Card variant="elevated">
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Card Elevado
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Este card tem uma sombra mais pronunciada (elevated).
            </Text>
          </Card>

          <Card
            variant="default"
            onPress={() => alert("Card clicado!")}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Card Clicável
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Toque aqui para testar a interação.
            </Text>
          </Card>
        </View>

        {/* Alert Component */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Alert Component
          </Text>

          <Alert
            type="info"
            title="Informação"
            message="Esta é uma mensagem informativa para o usuário."
          />

          <Alert
            type="success"
            message="Operação realizada com sucesso!"
          />

          <Alert
            type="warning"
            title="Atenção"
            message="Verifique os dados antes de continuar."
          />

          <Alert
            type="error"
            message="Erro ao processar a solicitação."
            closable
            onClose={() => alert("Alert fechado")}
          />
        </View>

        {/* Toast Component */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Toast Component
          </Text>
          <Text
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Clique nos botões para testar os toasts:
          </Text>

          <View style={styles.toastButtons}>
            <Button
              variant="secondary"
              size="sm"
              onPress={showSuccessToast}
            >
              Success
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={showErrorToast}
            >
              Error
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={showWarningToast}
            >
              Warning
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={showInfoToast}
            >
              Info
            </Button>
          </View>
        </View>

        {/* Modal Component */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Modal Component
          </Text>

          <Button
            variant="primary"
            onPress={() => setModalVisible(true)}
          >
            Abrir Modal
          </Button>

          <Modal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            title="Exemplo de Modal"
            description="Este é um modal responsivo ao tema"
            size="md"
            footer={
              <View style={styles.modalFooter}>
                <Button
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    alert("Ação confirmada!");
                    setModalVisible(false);
                  }}
                >
                  Confirmar
                </Button>
              </View>
            }
          >
            <View style={styles.modalContent}>
              <Text style={[styles.modalText, { color: colors.textPrimary }]}>
                Este modal se adapta ao tema claro e escuro automaticamente.
              </Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Você pode incluir qualquer conteúdo aqui, incluindo formulários,
                listas, ou outros componentes.
              </Text>
            </View>
          </Modal>
        </View>

        {/* PaginationDots Component */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            PaginationDots Component
          </Text>

          <View style={styles.paginationContainer}>
            <PaginationDots
              total={5}
              activeIndex={activeSlide}
            />
          </View>

          <View style={styles.paginationControls}>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setActiveSlide(Math.max(0, activeSlide - 1))}
              disabled={activeSlide === 0}
            >
              Anterior
            </Button>
            <Text
              style={[styles.paginationText, { color: colors.textSecondary }]}
            >
              {activeSlide + 1} / 5
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setActiveSlide(Math.min(4, activeSlide + 1))}
              disabled={activeSlide === 4}
            >
              Próximo
            </Button>
          </View>
        </View>

        {/* Spacer final */}
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  toastButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
  },
  modalContent: {
    gap: 12,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  paginationContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  spacer: {
    height: 40,
  },
});
