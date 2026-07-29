import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { fetchBillingOverview, updateAutoRenewal, createCheckoutSession, createBillingPortalSession } from '../api/tenant';
import { fetchCreditBalance, fetchCreditHistory, fetchCreditPackages, createCreditCheckoutSession } from '../api/credits';
import { Button } from '../components/ui/Button';

function formatCurrency(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(num || 0);
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('pt-PT');
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
      Alert.alert('Erro', 'Não foi possível carregar os dados de faturação.');
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
      Alert.alert('Erro', 'Escolha um pacote de crédito antes de ativar.');
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
      Alert.alert('Erro', typeof detail === 'string' ? detail : 'Não foi possível atualizar a renovação automática.');
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
      Alert.alert('Erro', 'Não foi possível iniciar a mudança de plano.');
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
      Alert.alert('Erro', 'Não foi possível abrir a gestão da subscrição.');
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
      Alert.alert('Erro', 'Não foi possível iniciar a compra de créditos.');
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Créditos e Plano</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loadError ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Não foi possível carregar os dados de faturação.
          </Text>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Plano</Text>

            {subscription && (
              <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{subscription.plan_name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{subscription.status_label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{formatCurrency(subscription.price_monthly)}/mês</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Próxima cobrança: {formatDate(subscription.next_billing_date)}</Text>
              </View>
            )}

            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Renovação automática de crédito</Text>
                <Switch
                  testID="auto-renewal-switch"
                  value={autoRenewal}
                  disabled={autoRenewalSaving}
                  onValueChange={handleToggleAutoRenewal}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>
                Quando o crédito de comunicação incluído no seu plano acabar antes do fim do
                mês, compre automaticamente mais crédito (cobrado no seu cartão) para não
                interromper os envios de SMS/WhatsApp.
              </Text>
              {!autoRenewal && (packages || []).length > 0 && (
                <>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
                    Pacote a comprar automaticamente
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

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>Planos disponíveis</Text>
            {availablePlans.map((plan) => (
              <View key={plan.plan_code} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {plan.name}{plan.is_current ? ' (Atual)' : ''}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{formatCurrency(plan.price_monthly)}/mês</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{plan.credits_included} créditos incluídos</Text>
                {plan.features.map((feature) => (
                  <Text key={feature} style={{ color: colors.textSecondary, fontSize: 12 }}>• {feature}</Text>
                ))}
                <Button
                  onPress={() => handleChangePlan(plan)}
                  disabled={plan.is_current || !plan.is_available || changingPlan !== null}
                  loading={changingPlan === plan.plan_code}
                >
                  Mudar para este plano
                </Button>
              </View>
            ))}

            <Button onPress={handleManageSubscription} loading={managingSubscription} disabled={managingSubscription} style={{ marginTop: 8 }}>
              Gerir subscrição
            </Button>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Créditos</Text>

            {creditsError ? (
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Não foi possível carregar os créditos.
              </Text>
            ) : balance === null ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} />
            ) : (
              <>
                <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 20 }}>{balance.current_balance}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Comprado: {formatCurrency(balance.total_purchased)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Consumido: {formatCurrency(balance.total_consumed)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Bónus: {formatCurrency(balance.total_bonus)}</Text>
                </View>

                <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 12, marginBottom: 8 }}>Comprar créditos</Text>
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

                <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Histórico</Text>
                {(history || []).map((item) => (
                  <View key={item.id} style={[styles.historyRow, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{item.description}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatDate(item.created_at)}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatCurrency(item.amount_eur)}</Text>
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
