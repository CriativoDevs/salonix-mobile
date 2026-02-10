import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
// ✅ TESTE: Importar todos os componentes via barrel export
import { Button, Input, Card } from "../components/ui";

export default function TestBarrelExport() {
  const [email, setEmail] = useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Test Barrel Export</Text>

        <Card>
          <Text style={styles.cardTitle}>✅ Barrel Export Funcionando!</Text>
          <Text style={styles.cardSubtitle}>
            Todos os componentes foram importados com sucesso via:
          </Text>
          <Text style={styles.code}>
            import {`{ Button, Input, Card }`} from '../components/ui';
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Componentes Disponíveis:</Text>

          <Card
            variant="elevated"
            style={{ marginBottom: 12 }}
          >
            <Text style={styles.componentName}>Button</Text>
            <Text style={styles.componentDescription}>
              3 variantes (link, primary, secondary), 3 tamanhos, loading,
              disabled
            </Text>
            <Button
              variant="primary"
              onPress={() => {}}
            >
              Exemplo Button
            </Button>
          </Card>

          <Card
            variant="elevated"
            style={{ marginBottom: 12 }}
          >
            <Text style={styles.componentName}>Input</Text>
            <Text style={styles.componentDescription}>
              Com label, error, description, acessibilidade
            </Text>
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
            />
          </Card>

          <Card variant="elevated">
            <Text style={styles.componentName}>Card</Text>
            <Text style={styles.componentDescription}>
              2 variantes (default, elevated), clicável com onPress
            </Text>
          </Card>
        </View>

        <View style={styles.successBox}>
          <Text style={styles.successTitle}>✅ Item 5 Completo!</Text>
          <Text style={styles.successText}>
            Barrel export criado em: src/components/ui/index.ts{"\n"}
            Agora você pode importar todos os componentes UI com:{"\n"}
            import {`{ Button, Input, Card }`} from '@/components/ui';
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  code: {
    fontSize: 13,
    fontFamily: "monospace",
    color: "#3b82f6",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  componentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  componentDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  successBox: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 8,
    padding: 16,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 8,
  },
  successText: {
    fontSize: 13,
    color: "#064e3b",
    lineHeight: 20,
  },
});
