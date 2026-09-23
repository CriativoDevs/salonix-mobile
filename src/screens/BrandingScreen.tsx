import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { fetchTenantMeta, updateTenantBranding } from '../api/tenant';
import { resolveMediaUrl } from '../utils/env';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

const COPY = {
  pt: {
    addressStreet: 'Rua',
    addressNumber: 'Número',
    addressComplement: 'Complemento',
    addressNeighborhood: 'Freguesia',
    addressCity: 'Localidade',
    addressState: 'Distrito',
    addressZip: 'Código Postal',
    addressCountry: 'País',
    errorTitle: 'Erro',
    loadError: 'Não foi possível carregar a marca.',
    galleryPermission: 'Permissão de galeria necessária.',
    unsupportedFormat: 'Formato não suportado. Use JPEG, PNG, GIF ou WEBP.',
    fileTooLarge: 'O ficheiro deve ter no máximo 2MB.',
    invalidZip: 'CP inválido. Use 9999-999.',
    brandUpdated: 'Marca atualizada.',
    saveError: 'Não foi possível guardar a marca.',
    title: 'Marca',
    changeLogo: 'Alterar logo',
    save: 'Guardar',
  },
  en: {
    addressStreet: 'Street',
    addressNumber: 'Number',
    addressComplement: 'Complement',
    addressNeighborhood: 'Neighborhood',
    addressCity: 'City',
    addressState: 'State',
    addressZip: 'Postal Code',
    addressCountry: 'Country',
    errorTitle: 'Error',
    loadError: 'Could not load the branding.',
    galleryPermission: 'Gallery permission required.',
    unsupportedFormat: 'Unsupported format. Use JPEG, PNG, GIF or WEBP.',
    fileTooLarge: 'The file must be at most 2MB.',
    invalidZip: 'Invalid postal code. Use 9999-999.',
    brandUpdated: 'Branding updated.',
    saveError: 'Could not save the branding.',
    title: 'Branding',
    changeLogo: 'Change logo',
    save: 'Save',
  },
} as const;

const ZIP_REGEX = /^\d{4}-\d{3}$/;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

type PickedLogo = { uri: string; name: string; mimeType: string };

export default function BrandingScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  const ADDRESS_FIELDS: { key: string; label: string }[] = [
    { key: 'address_street', label: t.addressStreet },
    { key: 'address_number', label: t.addressNumber },
    { key: 'address_complement', label: t.addressComplement },
    { key: 'address_neighborhood', label: t.addressNeighborhood },
    { key: 'address_city', label: t.addressCity },
    { key: 'address_state', label: t.addressState },
    { key: 'address_zip', label: t.addressZip },
    { key: 'address_country', label: t.addressCountry },
  ];

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
      Alert.alert(t.errorTitle, t.loadError);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.errorTitle, t.galleryPermission);
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
      setFileError(t.unsupportedFormat);
      return;
    }

    const info = await FileSystem.getInfoAsync(asset.uri);
    if (info.exists && typeof info.size === 'number' && info.size > MAX_LOGO_BYTES) {
      setFileError(t.fileTooLarge);
      return;
    }

    setFileError(null);
    setPickedLogo({ uri: asset.uri, name: asset.fileName || 'logo.jpg', mimeType });
  };

  const handleSave = async () => {
    if (address.address_zip && !ZIP_REGEX.test(address.address_zip)) {
      setZipError(t.invalidZip);
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
      showToast({ type: 'success', message: t.brandUpdated });
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert(t.errorTitle, typeof detail === 'string' ? detail : t.saveError);
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loadError ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            {t.loadError}
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
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>{t.changeLogo}</Text>
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
                {t.save}
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
