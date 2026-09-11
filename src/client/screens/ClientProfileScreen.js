import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { useClientAuth } from "../../hooks/useClientAuth";
import { Button, Input } from "../../components/ui";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import { resolveMediaUrl } from "../../utils/env";
import { updateClientProfile, updateClientProfilePhoto } from "../../services/clientBooking";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const COPY = {
  pt: {
    title: "Perfil do cliente",
    name: "Nome",
    email: "E-mail",
    phone: "Telefone",
    save: "Salvar",
    saved: "Perfil salvo com sucesso.",
    saveFailed: "Falha ao salvar perfil.",
    logout: "Sair",
    logoutConfirmTitle: "Sair da conta",
    logoutConfirmMessage: "Tem a certeza de que quer sair da sua conta?",
    logoutConfirmCancel: "Cancelar",
    logoutConfirmOk: "Sair",
    photoAdd: "Adicionar foto",
    photoChange: "Alterar foto",
    photoUploading: "A enviar…",
    photoFailed: "Falha ao enviar a foto.",
    photoTooLarge: "A imagem deve ter no máximo 2MB.",
    photoUnsupported: "Formato não suportado. Use JPEG, PNG, GIF ou WEBP.",
    galleryPermission: "Permissão de galeria necessária.",
  },
  en: {
    title: "Client profile",
    name: "Name",
    email: "Email",
    phone: "Phone",
    save: "Save",
    saved: "Profile saved successfully.",
    saveFailed: "Failed to save profile.",
    logout: "Log out",
    logoutConfirmTitle: "Log out",
    logoutConfirmMessage: "Are you sure you want to log out of your account?",
    logoutConfirmCancel: "Cancel",
    logoutConfirmOk: "Log out",
    photoAdd: "Add photo",
    photoChange: "Change photo",
    photoUploading: "Uploading…",
    photoFailed: "Failed to upload photo.",
    photoTooLarge: "The image must be at most 2MB.",
    photoUnsupported: "Unsupported format. Use JPEG, PNG, GIF or WEBP.",
    galleryPermission: "Gallery permission required.",
  },
};

export default function ClientProfileScreen() {
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const { clientInfo, refreshProfile, logout } = useClientAuth();
  const t = COPY[language] || COPY.pt;

  const [name, setName] = useState(clientInfo?.name || "");
  const [phone, setPhone] = useState(clientInfo?.phone_number || "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateClientProfile({ name, phone_number: phone });
      await refreshProfile();
      showToast({ type: "success", message: t.saved });
    } catch {
      showToast({ type: "error", message: t.saveFailed });
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("", t.galleryPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(mimeType)) {
      showToast({ type: "error", message: t.photoUnsupported });
      return;
    }
    if (typeof asset.fileSize === "number" && asset.fileSize > MAX_PHOTO_BYTES) {
      showToast({ type: "error", message: t.photoTooLarge });
      return;
    }

    setUploadingPhoto(true);
    try {
      await updateClientProfilePhoto({
        uri: asset.uri,
        name: asset.fileName || "photo.jpg",
        mimeType,
      });
      await refreshProfile();
    } catch {
      showToast({ type: "error", message: t.photoFailed });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const photoUri = resolveMediaUrl(clientInfo?.photo);

  const onLogoutPress = () => {
    Alert.alert(t.logoutConfirmTitle, t.logoutConfirmMessage, [
      { text: t.logoutConfirmCancel, style: "cancel" },
      { text: t.logoutConfirmOk, style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={styles.headerActions}>
          <LanguageToggle
            language={language}
            onToggle={() => setLanguage(language === "pt" ? "en" : "pt")}
            size={18}
          />
          <ThemeToggle size={20} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.photoRow}>
          <TouchableOpacity onPress={onPickPhoto} disabled={uploadingPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              />
            )}
          </TouchableOpacity>
          <Button variant="link" onPress={onPickPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto ? t.photoUploading : photoUri ? t.photoChange : t.photoAdd}
          </Button>
        </View>

        <Input label={t.name} value={name} onChangeText={setName} />
        <Input label={t.email} value={clientInfo?.email || ""} editable={false} />
        <Input label={t.phone} value={phone} onChangeText={setPhone} />

        <Button variant="primary" onPress={onSave} loading={saving} disabled={saving}>
          {t.save}
        </Button>
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={onLogoutPress} accessibilityRole="button">
          <Text style={[styles.logoutText, { color: colors.error }]}>{t.logout}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, borderWidth: 1 },
  logoutContainer: {
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: 32,
    paddingTop: 40,
  },
  logoutText: { fontSize: 15, fontWeight: "600" },
});
