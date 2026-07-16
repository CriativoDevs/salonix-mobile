import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { fetchTenantMeta, updateTenantContact, updateTenantModules, updateTenantAutoInvite } from '../api/tenant';
import { Button } from '../components/ui/Button';

export default function GeneralScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [summary, setSummary] = useState<{ name: string; slug: string; timezone: string; currency: string; language: string }>({
    name: '',
    slug: '',
    timezone: '',
    currency: '',
    language: '',
  });
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [pwaClientEnabled, setPwaClientEnabled] = useState(false);
  const [autoInviteEnabled, setAutoInviteEnabled] = useState(false);
  const [pwaClientSaving, setPwaClientSaving] = useState(false);
  const [autoInviteSaving, setAutoInviteSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchTenantMeta(slug).then((data: any) => {
      if (!active) return;
      setSummary({
        name: data.name || '',
        slug: data.slug || '',
        timezone: data.timezone || '',
        currency: (data.currency || '').toUpperCase(),
        language: (data.preferred_language || '').toUpperCase(),
      });
      setEmail(data.profile?.email || '');
      setPhone(data.profile?.phone || '');
      setPwaClientEnabled(!!data.feature_flags?.pwa_client_enabled);
      setAutoInviteEnabled(!!data.auto_invite_enabled);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoadError(true);
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível carregar as definições gerais.');
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleSaveContact = async () => {
    setBusy(true);
    try {
      await updateTenantContact({ email, phone }, { slug });
      Alert.alert('Sucesso', 'Dados de contato atualizados.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert('Erro', typeof detail === 'string' ? detail : 'Não foi possível guardar os dados de contato.');
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePwaClient = async (value: boolean) => {
    const previous = pwaClientEnabled;
    setPwaClientEnabled(value);
    setPwaClientSaving(true);
    try {
      await updateTenantModules({ pwaClientEnabled: value }, { slug });
    } catch (error: any) {
      setPwaClientEnabled(previous);
      const detail = error?.response?.data?.detail;
      Alert.alert('Erro', typeof detail === 'string' ? detail : 'Não foi possível atualizar o PWA Cliente.');
    } finally {
      setPwaClientSaving(false);
    }
  };

  const handleToggleAutoInvite = async (value: boolean) => {
    const previous = autoInviteEnabled;
    setAutoInviteEnabled(value);
    setAutoInviteSaving(true);
    try {
      await updateTenantAutoInvite(value, { slug });
    } catch (error: any) {
      setAutoInviteEnabled(previous);
      const detail = error?.response?.data?.detail;
      Alert.alert('Erro', typeof detail === 'string' ? detail : 'Não foi possível atualizar os convites automáticos.');
    } finally {
      setAutoInviteSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Geral</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loadError ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Não foi possível carregar as definições gerais.
          </Text>
        ) : (
          <>
            <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', marginBottom: 8 }}>{summary.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{summary.slug}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{summary.timezone}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{summary.currency}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{summary.language}</Text>
            </View>

            {isAdmin ? (
              <Input
                testID="general-email-input"
                label="Email"
                value={email}
                onChangeText={setEmail}
              />
            ) : (
              <View style={styles.readOnlyField}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Email</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{email || '—'}</Text>
              </View>
            )}

            {isAdmin ? (
              <Input
                testID="general-phone-input"
                label="Telefone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            ) : (
              <View style={styles.readOnlyField}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Telefone</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{phone || '—'}</Text>
              </View>
            )}

            {isAdmin && (
              <Button onPress={handleSaveContact} loading={busy} disabled={busy}>
                Guardar
              </Button>
            )}

            <View style={[styles.channelRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.channelHeader}>
                <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>PWA Cliente</Text>
                {isAdmin ? (
                  <Switch
                    testID="general-pwa-client-switch"
                    value={pwaClientEnabled}
                    disabled={pwaClientSaving}
                    onValueChange={handleTogglePwaClient}
                  />
                ) : (
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {pwaClientEnabled ? 'Ativo' : 'Inativo'}
                  </Text>
                )}
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                Ativa a área do cliente no PWA.
              </Text>
            </View>

            <View style={[styles.channelRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.channelHeader}>
                <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>Convites automáticos</Text>
                {isAdmin ? (
                  <Switch
                    testID="general-auto-invite-switch"
                    value={autoInviteEnabled}
                    disabled={autoInviteSaving || !pwaClientEnabled}
                    onValueChange={handleToggleAutoInvite}
                  />
                ) : (
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {autoInviteEnabled ? 'Ativo' : 'Inativo'}
                  </Text>
                )}
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                {pwaClientEnabled
                  ? 'Envia convite PWA automaticamente a novos clientes.'
                  : 'Ative o PWA Cliente primeiro.'}
              </Text>
            </View>
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
  summaryCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  readOnlyField: {
    marginBottom: 12,
  },
  channelRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
