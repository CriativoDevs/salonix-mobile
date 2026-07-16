import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { fetchTenantMeta, updateTenantBranding } from '../api/tenant';
import { resolveMediaUrl } from '../utils/env';
import { Button } from '../components/ui/Button';

const ADDRESS_FIELDS: { key: string; label: string }[] = [
  { key: 'address_street', label: 'Rua' },
  { key: 'address_number', label: 'Número' },
  { key: 'address_complement', label: 'Complemento' },
  { key: 'address_neighborhood', label: 'Freguesia' },
  { key: 'address_city', label: 'Localidade' },
  { key: 'address_state', label: 'Distrito' },
  { key: 'address_zip', label: 'Código Postal' },
  { key: 'address_country', label: 'País' },
];

const ZIP_REGEX = /^\d{4}-\d{3}$/;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

type PickedLogo = { uri: string; name: string; mimeType: string };

export default function BrandingScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [address, setAddress] = useState<Record<string, string>>({});
  const [pickedLogo, setPickedLogo] = useState<PickedLogo | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetchTenantMeta(slug).then((data: any) => {
      if (!active) return;
      setLogoUrl(resolveMediaUrl(data.logo_url));
      const nextAddress: Record<string, string> = {};
      ADDRESS_FIELDS.forEach(({ key }) => {
        nextAddress[key] = data[key] || '';
      });
      setAddress(nextAddress);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoadError(true);
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível carregar a marca.');
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Erro', 'Permissão de galeria necessária.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      setFileError('Formato não suportado. Use JPEG, PNG, GIF ou WEBP.');
      return;
    }

    const info = await FileSystem.getInfoAsync(asset.uri);
    if (info.exists && typeof info.size === 'number' && info.size > MAX_LOGO_BYTES) {
      setFileError('O ficheiro deve ter no máximo 2MB.');
      return;
    }

    setFileError(null);
    setPickedLogo({ uri: asset.uri, name: asset.fileName || 'logo.jpg', mimeType });
  };

  const handleSave = async () => {
    if (address.address_zip && !ZIP_REGEX.test(address.address_zip)) {
      setZipError('CP inválido. Use 9999-999.');
      return;
    }
    setZipError(null);

    setBusy(true);
    try {
      const result = await updateTenantBranding({
        logoFile: pickedLogo || undefined,
        address,
        slug,
      } as any);
      setLogoUrl(resolveMediaUrl(result.logo_url));
      setPickedLogo(null);
      Alert.alert('Sucesso', 'Marca atualizada.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert('Erro', typeof detail === 'string' ? detail : 'Não foi possível guardar a marca.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  const displayedLogoUri = pickedLogo?.uri || logoUrl;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Marca</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loadError ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Não foi possível carregar a marca.
          </Text>
        ) : (
          <>
            <View style={styles.logoSection}>
              {displayedLogoUri ? (
                <Image testID="branding-logo-image" source={{ uri: displayedLogoUri }} style={styles.logoPreview} />
              ) : (
                <View style={[styles.logoPreview, styles.logoPlaceholder, { borderColor: colors.border }]}>
                  <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                </View>
              )}

              {isAdmin && (
                <TouchableOpacity onPress={handlePickLogo}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>Alterar logo</Text>
                </TouchableOpacity>
              )}
              {fileError && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{fileError}</Text>}
            </View>

            {ADDRESS_FIELDS.map(({ key, label }) =>
              isAdmin ? (
                <Input
                  key={key}
                  testID={`branding-${key.replace(/_/g, '-')}-input`}
                  label={label}
                  value={address[key]}
                  onChangeText={(value) => {
                    setAddress((current) => ({ ...current, [key]: value }));
                    if (key === 'address_zip') setZipError(null);
                  }}
                  error={key === 'address_zip' ? zipError || undefined : undefined}
                />
              ) : (
                <View key={key} style={styles.readOnlyField}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{address[key] || '—'}</Text>
                </View>
              )
            )}

            {isAdmin && (
              <Button onPress={handleSave} loading={busy} disabled={busy}>
                Guardar
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoPreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    marginBottom: 8,
  },
  logoPlaceholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readOnlyField: {
    marginBottom: 12,
  },
});
