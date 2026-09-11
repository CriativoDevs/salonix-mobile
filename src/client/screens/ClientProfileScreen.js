import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../contexts/ToastContext";
import { useClientAuth } from "../../hooks/useClientAuth";
import { Button, Input } from "../../components/ui";
import { updateClientProfile } from "../../services/clientBooking";

export default function ClientProfileScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { clientInfo, refreshProfile, logout } = useClientAuth();

  const [name, setName] = useState(clientInfo?.name || "");
  const [phone, setPhone] = useState(clientInfo?.phone_number || "");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateClientProfile({ name, phone_number: phone });
      await refreshProfile();
      showToast({ type: "success", message: "Perfil salvo com sucesso." });
    } catch {
      showToast({ type: "error", message: "Falha ao salvar perfil." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Perfil do cliente
        </Text>

        <Input label="Nome" value={name} onChangeText={setName} />
        <Input
          label="E-mail"
          value={clientInfo?.email || ""}
          editable={false}
        />
        <Input label="Telefone" value={phone} onChangeText={setPhone} />

        <Button variant="primary" onPress={onSave} loading={saving} disabled={saving}>
          Salvar
        </Button>

        <View style={styles.logoutContainer}>
          <Button variant="link" onPress={logout}>
            Sair
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  logoutContainer: { alignItems: "center", marginTop: 24 },
});
