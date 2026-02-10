import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Button } from "../components/ui/Button";

export default function TestButtonSimple() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Test Buttons</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link Variant (90% - Padrão)</Text>
          <Button
            variant="link"
            onPress={() => console.log("Link pressed")}
          >
            Entrar
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Variant (CTAs)</Text>
          <Button
            variant="primary"
            onPress={() => console.log("Primary pressed")}
          >
            Confirmar
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Secondary Variant</Text>
          <Button
            variant="secondary"
            onPress={() => console.log("Secondary pressed")}
          >
            Cancelar
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disabled</Text>
          <Button
            variant="primary"
            disabled
          >
            Desabilitado
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loading</Text>
          <Button
            variant="primary"
            loading
          >
            Carregando...
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sizes</Text>
          <Button
            variant="primary"
            size="sm"
            onPress={() => {}}
          >
            Small
          </Button>
          <View style={{ height: 8 }} />
          <Button
            variant="primary"
            size="md"
            onPress={() => {}}
          >
            Medium
          </Button>
          <View style={{ height: 8 }} />
          <Button
            variant="primary"
            size="lg"
            onPress={() => {}}
          >
            Large
          </Button>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 12,
  },
});
