import { SafeAreaView, StyleSheet, Text, View } from "react-native";

// Placeholder da variante cliente (MOB-CLIENT-00). As telas reais (login,
// agendamentos, perfil) entram aqui em MOB-CLIENT-01, sem tocar no lado
// admin. Sem dependência de AuthContext (staff-only) de propósito.
export default function ClientHomePlaceholderScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TimelyOne Client</Text>
        <Text style={styles.subtitle}>App do cliente — em construção.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1B2A",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
});
