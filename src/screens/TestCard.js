import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Card } from "../components/ui/Card";

export default function TestCard() {
  const handleCardPress = (cardId) => {
    Alert.alert("Card Pressionado", `Você clicou no card: ${cardId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Test Card Components</Text>

        {/* Card básico (default shadow) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Card Básico (shadow-sm)</Text>
          <Card>
            <Text style={styles.cardTitle}>Agendamento #123</Text>
            <Text style={styles.cardSubtitle}>Cliente: João Silva</Text>
            <Text style={styles.cardDetail}>Serviço: Corte de Cabelo</Text>
            <Text style={styles.cardDetail}>Data: 15/02/2026 às 14:00</Text>
          </Card>
        </View>

        {/* Card elevado (shadow maior) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Card Elevado (shadow-lg)</Text>
          <Card variant="elevated">
            <Text style={styles.cardTitle}>Próximo Agendamento</Text>
            <Text style={styles.cardHighlight}>HOJE às 16:30</Text>
            <Text style={styles.cardDetail}>Cliente: Maria Santos</Text>
            <Text style={styles.cardDetail}>Serviço: Manicure + Pedicure</Text>
          </Card>
        </View>

        {/* Card clicável (com onPress) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Card Clicável (Pressable)</Text>
          <Card onPress={() => handleCardPress("Card 1")}>
            <Text style={styles.cardTitle}>Toque para ver detalhes</Text>
            <Text style={styles.cardSubtitle}>Este card é clicável</Text>
            <Text style={styles.cardDetail}>
              Opacity 90% quando pressionado
            </Text>
          </Card>
        </View>

        {/* Card com stats (exemplo de uso real) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Card com Estatísticas</Text>
          <View style={styles.row}>
            <Card
              variant="default"
              style={styles.statCard}
            >
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Agendamentos</Text>
              <Text style={styles.statPeriod}>Hoje</Text>
            </Card>
            <Card
              variant="default"
              style={styles.statCard}
            >
              <Text style={styles.statValue}>€1,240</Text>
              <Text style={styles.statLabel}>Receita</Text>
              <Text style={styles.statPeriod}>Esta semana</Text>
            </Card>
          </View>
        </View>

        {/* Card lista de clientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Lista de Cards Clicáveis</Text>
          {["Ana Costa", "Bruno Lima", "Carla Sousa"].map((cliente, index) => (
            <Card
              key={index}
              onPress={() => handleCardPress(cliente)}
              style={{ marginBottom: 12 }}
            >
              <View style={styles.clientRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{cliente[0]}</Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{cliente}</Text>
                  <Text style={styles.clientDetail}>
                    Próximo: 20/02 às 10:00
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Specs visuais */}
        <View style={styles.specsContainer}>
          <Text style={styles.specsTitle}>
            ✅ Specs Baseadas no Card.jsx + StatCard.jsx:
          </Text>
          <Text style={styles.specsText}>
            • Border-radius: rounded-xl (12px){"\n"}• Padding: p-5 (20px){"\n"}•
            Border: border-brand-border (#e2e8f0 1px){"\n"}• Background:
            bg-brand-surface (#ffffff){"\n"}• Shadow default: shadowOpacity
            0.05, elevation 1{"\n"}• Shadow elevated: shadowOpacity 0.1,
            elevation 4{"\n"}• Pressable: opacity 90% quando pressed{"\n"}•
            Acessibilidade: accessibilityRole="button" quando clicável
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc", // Fundo cinza claro para ver sombras
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

  // Card content styles
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  cardHighlight: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 8,
  },

  // Stats cards
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  statPeriod: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  // Client list
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
  },
  clientDetail: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },

  // Specs
  specsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#ffffff",
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
