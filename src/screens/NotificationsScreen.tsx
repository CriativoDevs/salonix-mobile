import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { fetchTenantNotifications, updateTenantNotifications, fetchBillingOverview } from '../api/tenant';
import { fetchCreditBalance } from '../api/credits';

type NotificationKey = 'sms_enabled' | 'whatsapp_enabled' | 'push_mobile_enabled' | 'push_web_enabled';

const COPY = {
  pt: {
    sms: 'SMS',
    whatsapp: 'WhatsApp',
    pushMobile: 'Push Mobile',
    pushWeb: 'Push Web',
    errorTitle: 'Erro',
    loadError: 'Não foi possível carregar as notificações.',
    updateError: 'Não foi possível atualizar a notificação.',
    title: 'Notificações',
    email: 'Email',
    active: 'Ativo',
    whatsappSubtitle: 'WhatsApp será ativado após aprovação Meta Business.',
    smsTrialSubtitle: 'Disponível após o período de teste.',
    smsNoCreditSubtitle: 'Sem crédito suficiente.',
    comingSoon: 'Em breve',
  },
  en: {
    sms: 'SMS',
    whatsapp: 'WhatsApp',
    pushMobile: 'Push Mobile',
    pushWeb: 'Push Web',
    errorTitle: 'Error',
    loadError: 'Could not load the notifications.',
    updateError: 'Could not update the notification.',
    title: 'Notifications',
    email: 'Email',
    active: 'Active',
    whatsappSubtitle: 'WhatsApp will be enabled after Meta Business approval.',
    smsTrialSubtitle: 'Available after the trial period.',
    smsNoCreditSubtitle: 'Not enough credit.',
    comingSoon: 'Coming soon',
  },
} as const;

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  const CHANNELS: { key: NotificationKey; label: string }[] = [
    { key: 'sms_enabled', label: t.sms },
    { key: 'whatsapp_enabled', label: t.whatsapp },
    { key: 'push_mobile_enabled', label: t.pushMobile },
    { key: 'push_web_enabled', label: t.pushWeb },
  ];

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    sms_enabled: false,
    whatsapp_enabled: false,
    push_mobile_enabled: false,
    push_web_enabled: false,
  });
  const [isTrialing, setIsTrialing] = useState(false);
  const [hasCredit, setHasCredit] = useState(true);
  const [savingChannel, setSavingChannel] = useState<NotificationKey | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      // fetchTenantNotifications é o único dado essencial: sem ele não há o
      // que mostrar. fetchBillingOverview/fetchCreditBalance só alimentam os
      // gates de SMS — se falharem, degradam com segurança (SMS fica
      // bloqueado, o resto do ecrã continua utilizável) em vez de impedir o
      // ecrã de abrir.
      let notificationsData;
      try {
        notificationsData = await fetchTenantNotifications({ slug });
      } catch (error) {
        if (!active) return;
        console.error('[NotificationsScreen] Failed to load notifications:', error);
        setLoadError(true);
        setLoading(false);
        Alert.alert(t.errorTitle, t.loadError);
        return;
      }

      if (!active) return;
      setNotifications({
        sms_enabled: !!notificationsData.sms_enabled,
        whatsapp_enabled: !!notificationsData.whatsapp_enabled,
        push_mobile_enabled: !!notificationsData.push_mobile_enabled,
        push_web_enabled: !!notificationsData.push_web_enabled,
      });

      const [billingResult, creditResult] = await Promise.allSettled([
        fetchBillingOverview({ slug }),
        fetchCreditBalance({ slug }),
      ]);
      if (!active) return;

      if (billingResult.status === 'fulfilled') {
        setIsTrialing(billingResult.value?.current_subscription?.status === 'trialing');
      } else {
        console.warn('[NotificationsScreen] Failed to load billing overview:', billingResult.reason);
      }

      if (creditResult.status === 'fulfilled') {
        setHasCredit(Number(creditResult.value?.current_balance) >= 1);
      } else {
        console.warn('[NotificationsScreen] Failed to load credit balance:', creditResult.reason);
        setHasCredit(false);
      }

      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleToggle = async (key: NotificationKey, value: boolean) => {
    const previous = notifications[key];
    setNotifications((current) => ({ ...current, [key]: value }));
    setSavingChannel(key);
    try {
      await updateTenantNotifications({ [key]: value }, { slug });
    } catch (error: any) {
      setNotifications((current) => ({ ...current, [key]: previous }));
      const detail = error?.response?.data?.detail;
      Alert.alert(t.errorTitle, typeof detail === 'string' ? detail : t.updateError);
    } finally {
      setSavingChannel(null);
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
        <View style={[styles.channelRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>{t.email}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.active}</Text>
        </View>

        {CHANNELS.map(({ key, label }) => {
          const isSms = key === 'sms_enabled';
          const isWhatsapp = key === 'whatsapp_enabled';
          const disabled = !isAdmin || savingChannel === key || isWhatsapp || (isSms && (isTrialing || !hasCredit));

          let subtitle: string | null = null;
          if (isWhatsapp) {
            subtitle = t.whatsappSubtitle;
          } else if (isSms && isTrialing) {
            subtitle = t.smsTrialSubtitle;
          } else if (isSms && !hasCredit) {
            subtitle = t.smsNoCreditSubtitle;
          }

          return (
            <View key={key} style={[styles.channelRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.channelHeader}>
                <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>{label}</Text>
                {isWhatsapp && (
                  <View style={[styles.badge, { borderColor: colors.brandPrimary }]}>
                    <Text style={{ color: colors.brandPrimary, fontSize: 10, fontWeight: '600' }}>{t.comingSoon}</Text>
                  </View>
                )}
                <Switch
                  testID={`notifications-${key}-switch`}
                  value={notifications[key]}
                  disabled={disabled}
                  onValueChange={(value) => handleToggle(key, value)}
                />
              </View>
              {subtitle && (
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{subtitle}</Text>
              )}
            </View>
          );
        })}
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
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
});
