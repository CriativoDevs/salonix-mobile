import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { createCheckoutSession } from '../api/tenant';
import { Button } from '../components/ui/Button';

/**
 * MOB-TRIAL-01: tela de bloqueio pós-trial (bloqueio brando indefinido).
 *
 * Renderizada no lugar de todo o app quando tenant.is_trial_expired é true
 * (ver AppNavigator.js) -- sem stack/tabs ao redor, para que não haja como
 * navegar para outra tela sem pagar. A conta nunca é desativada; só o
 * acesso fica condicionado ao pagamento (mesma decisão de produto do FEW,
 * PlanOnboarding.jsx).
 */
export default function TrialExpiredScreen() {
  const { colors } = useTheme();
  const { slug, tenant, refetch } = useTenant();
  const { userInfo, logout } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const canPay = isOwner(userInfo);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const result = await createCheckoutSession(
        { plan: tenant?.plan_tier || 'basic', interval: 'monthly' },
        { slug }
      );
      await WebBrowser.openBrowserAsync(result.checkout_url);
    } catch (error) {
      console.error('[TrialExpiredScreen] Error creating checkout session:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o pagamento. Tente novamente.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Seu período de teste terminou
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {canPay
            ? 'Assine um plano para recuperar o acesso ao seu painel. Seus dados continuam guardados.'
            : 'Peça ao dono da conta para assinar um plano e recuperar o acesso.'}
        </Text>

        {canPay && (
          <>
            <Button
              variant="primary"
              size="lg"
              loading={checkingOut}
              onPress={handleCheckout}
              style={styles.checkoutButton}
            >
              Assinar agora
            </Button>
            <Button
              variant="link"
              loading={refreshing}
              onPress={handleRefresh}
              style={styles.refreshButton}
            >
              Já paguei, atualizar
            </Button>
          </>
        )}

        <Button variant="link" onPress={logout} style={styles.logoutButton}>
          Sair
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  checkoutButton: {
    width: '100%',
    marginBottom: 12,
  },
  refreshButton: {
    marginBottom: 24,
  },
  logoutButton: {
    marginTop: 8,
  },
});
