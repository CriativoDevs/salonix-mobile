import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { fetchBillingOverview, updateAutoRenewal, createCheckoutSession, createBillingPortalSession } from '../api/tenant';
import { fetchCreditBalance, fetchCreditHistory, fetchCreditPackages, createCreditCheckoutSession } from '../api/credits';
import { Button } from '../components/ui/Button';

const COPY = {
  pt: {
    locale: 'pt-PT',
    errorTitle: 'Erro',
    loadBillingError: 'Não foi possível carregar os dados de faturação.',
    choosePackageFirst: 'Escolha um pacote de crédito antes de ativar.',
    autoRenewalError: 'Não foi possível atualizar a renovação automática.',
    changePlanError: 'Não foi possível iniciar a mudança de plano.',
    manageSubscriptionError: 'Não foi possível abrir a gestão da subscrição.',
    buyCreditsError: 'Não foi possível iniciar a compra de créditos.',
    title: 'Créditos e Plano',
    plan: 'Plano',
    perMonth: '/mês',
    nextBilling: 'Próxima cobrança:',
    autoRenewalTitle: 'Renovação automática de crédito',
    autoRenewalDescription:
      'Quando o crédito de comunicação incluído no seu plano acabar antes do fim do mês, compre automaticamente mais crédito (cobrado no seu cartão) para não interromper os envios de SMS/WhatsApp.',
    autoRenewalPackageLabel: 'Pacote a comprar automaticamente',
    availablePlans: 'Planos disponíveis',
    currentSuffix: ' (Atual)',
    creditsIncluded: 'créditos incluídos',
    changeToThisPlan: 'Mudar para este plano',
    manageSubscription: 'Gerir subscrição',
    credits: 'Créditos',
    loadCreditsError: 'Não foi possível carregar os créditos.',
    purchased: 'Comprado',
    consumed: 'Consumido',
    bonus: 'Bónus',
    buyCredits: 'Comprar créditos',
    history: 'Histórico',
  },
  en: {
    locale: 'en-US',
    errorTitle: 'Error',
    loadBillingError: 'Could not load the billing data.',
    choosePackageFirst: 'Choose a credit package before enabling.',
    autoRenewalError: 'Could not update the automatic renewal.',
    changePlanError: 'Could not start the plan change.',
    manageSubscriptionError: 'Could not open the subscription management.',
    buyCreditsError: 'Could not start the credit purchase.',
    title: 'Credits and Plan',
    plan: 'Plan',
    perMonth: '/month',
    nextBilling: 'Next billing:',
    autoRenewalTitle: 'Automatic credit renewal',
    autoRenewalDescription:
      'When the communication credit included in your plan runs out before the end of the month, automatically buy more credit (charged to your card) to avoid interrupting SMS/WhatsApp sending.',
    autoRenewalPackageLabel: 'Package to purchase automatically',
    availablePlans: 'Available plans',
    currentSuffix: ' (Current)',
    creditsIncluded: 'credits included',
    changeToThisPlan: 'Switch to this plan',
    manageSubscription: 'Manage subscription',
    credits: 'Credits',
    loadCreditsError: 'Could not load the credits.',
    purchased: 'Purchased',
    consumed: 'Consumed',
    bonus: 'Bonus',
    buyCredits: 'Buy credits',
    history: 'History',
  },
} as const;

function formatCurrency(value: number | string, locale: string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(num || 0);
}

function formatDate(isoDate: string, locale: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(locale);
}

type AvailablePlan = {
  plan_code: string;
  name: string;
  price_monthly: number;
  features: string[];
  credits_included: number;
  is_current: boolean;
  can_upgrade: boolean;
  is_available: boolean;
};

export default function CreditsPlanScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const fmtCurrency = (value: number | string) => formatCurrency(value, t.locale);
  const fmtDate = (isoDate: string) => formatDate(isoDate, t.locale);

  useEffect(() => {
    if (!isOwner(userInfo)) {
      navigation.goBack();
    }
  }, [userInfo, navigation]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [autoRenewalSaving, setAutoRenewalSaving] = useState(false);
  const [autoRenewalPackagePriceId, setAutoRenewalPackagePriceId] = useState('');
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  const [creditsError, setCreditsError] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [history, setHistory] = useState<{ id: number; transaction_type: string; amount_eur: string; balance_after: string; created_at: string; description: string }[] | null>(null);
  const [packages, setPackages] = useState<{ credits: string; price_eur: string; price_id: string; description: string }[] | null>(null);
  const [buyingPackage, setBuyingPackage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchBillingOverview({ slug }).then((data: any) => {
      if (!active) return;
      setOverview(data);
      setAutoRenewal(!!data.has_auto_renewal);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoadError(true);
      setLoading(false);
      Alert.alert(t.errorTitle, t.loadBillingError);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchCreditBalance({ slug }),
      fetchCreditHistory({ slug }),
      fetchCreditPackages(),
    ]).then(([balanceData, historyData, packagesData]: any[]) => {
      if (!active) return;
      setBalance(balanceData);
      setHistory(historyData.results || []);
      const loadedPackages = packagesData.packages || [];
      setPackages(loadedPackages);
      if (!autoRenewalPackagePriceId && loadedPackages.length > 0) {
        setAutoRenewalPackagePriceId(loadedPackages[0].price_id);
      }
    }).catch(() => {
      if (!active) return;
      setCreditsError(true);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleToggleAutoRenewal = async (value: boolean) => {
    if (value && !autoRenewalPackagePriceId) {
      Alert.alert(t.errorTitle, t.choosePackageFirst);
      return;
    }

    const previous = autoRenewal;
    setAutoRenewal(value);
    setAutoRenewalSaving(true);
    try {
      await updateAutoRenewal(
        {
          autoRenewal: value,
          autoRenewalPriceId: value ? autoRenewalPackagePriceId : undefined,
        },
        { slug }
      );
    } catch (error: any) {
      setAutoRenewal(previous);
      const detail = error?.response?.data?.detail;
      Alert.alert(t.errorTitle, typeof detail === 'string' ? detail : t.autoRenewalError);
    } finally {
      setAutoRenewalSaving(false);
    }
  };

  const handleChangePlan = async (plan: AvailablePlan) => {
    setChangingPlan(plan.plan_code);
    try {
      const result = await createCheckoutSession({ plan: plan.plan_code, interval: 'monthly' }, { slug });
      await WebBrowser.openBrowserAsync(result.checkout_url);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      Alert.alert(t.errorTitle, t.changePlanError);
    } finally {
      setChangingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const result = await createBillingPortalSession({ slug });
      await WebBrowser.openBrowserAsync(result.portal_url);
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      Alert.alert(t.errorTitle, t.manageSubscriptionError);
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleBuyCredits = async (pkg: { price_eur: string }) => {
    setBuyingPackage(pkg.price_eur);
    try {
      const result = await createCreditCheckoutSession({ amount_eur: pkg.price_eur }, { slug });
      await WebBrowser.openBrowserAsync(result.checkout_url);
    } catch (error) {
      console.error('Error creating credit checkout session:', error);
      Alert.alert(t.errorTitle, t.buyCreditsError);
    } finally {
      setBuyingPackage(null);
    }
  };

  if (!isOwner(userInfo)) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  const subscription = overview?.current_subscription;
  const availablePlans: AvailablePlan[] = overview?.available_plans || [];

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
            {t.loadBillingError}
          </Text>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.plan}</Text>

            {subscription && (
              <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{subscription.plan_name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{subscription.status_label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{fmtCurrency(subscription.price_monthly)}{t.perMonth}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t.nextBilling} {fmtDate(subscription.next_billing_date)}</Text>
              </View>
            )}

            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{t.autoRenewalTitle}</Text>
                <Switch
                  testID="auto-renewal-switch"
                  value={autoRenewal}
                  disabled={autoRenewalSaving}
                  onValueChange={handleToggleAutoRenewal}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>
                {t.autoRenewalDescription}
              </Text>
              {!autoRenewal && (packages || []).length > 0 && (
                <>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
                    {t.autoRenewalPackageLabel}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {(packages || []).map((pkg) => (
                      <Button
                        key={pkg.price_id}
                        onPress={() => setAutoRenewalPackagePriceId(pkg.price_id)}
                        disabled={autoRenewalSaving}
                        variant={autoRenewalPackagePriceId === pkg.price_id ? 'primary' : 'secondary'}
                        size="sm"
                      >
                        {pkg.description}
                      </Button>
                    ))}
                  </View>
                </>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>{t.availablePlans}</Text>
            {availablePlans.map((plan) => (
              <View key={plan.plan_code} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {plan.name}{plan.is_current ? t.currentSuffix : ''}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{fmtCurrency(plan.price_monthly)}{t.perMonth}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{plan.credits_included} {t.creditsIncluded}</Text>
                {plan.features.map((feature) => (
                  <Text key={feature} style={{ color: colors.textSecondary, fontSize: 12 }}>• {feature}</Text>
                ))}
                <Button
                  onPress={() => handleChangePlan(plan)}
                  disabled={plan.is_current || !plan.is_available || changingPlan !== null}
                  loading={changingPlan === plan.plan_code}
                >
                  {t.changeToThisPlan}
                </Button>
              </View>
            ))}

            <Button onPress={handleManageSubscription} loading={managingSubscription} disabled={managingSubscription} style={{ marginTop: 8 }}>
              {t.manageSubscription}
            </Button>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>{t.credits}</Text>

            {creditsError ? (
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {t.loadCreditsError}
              </Text>
            ) : balance === null ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} />
            ) : (
              <>
                <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 20 }}>{balance.current_balance}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.purchased}: {fmtCurrency(balance.total_purchased)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.consumed}: {fmtCurrency(balance.total_consumed)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.bonus}: {fmtCurrency(balance.total_bonus)}</Text>
                </View>

                <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 12, marginBottom: 8 }}>{t.buyCredits}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(packages || []).map((pkg) => (
                    <Button
                      key={pkg.price_id}
                      onPress={() => handleBuyCredits(pkg)}
                      disabled={buyingPackage !== null}
                      loading={buyingPackage === pkg.price_eur}
                      size="sm"
                    >
                      {pkg.description}
                    </Button>
                  ))}
                </View>

                <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>{t.history}</Text>
                {(history || []).map((item) => (
                  <View key={item.id} style={[styles.historyRow, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{item.description}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{fmtDate(item.created_at)}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{fmtCurrency(item.amount_eur)}</Text>
                    </View>
                  </View>
                ))}
              </>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  historyRow: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
});
