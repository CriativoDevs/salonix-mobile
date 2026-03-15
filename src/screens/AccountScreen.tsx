import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { useLanguage } from '../contexts/LanguageContext';
import { cancelTenantAccount, fetchBillingOverview } from '../api/tenant';

const CONFIRM_WORD = 'CANCELAR CONTA';

const COPY = {
  pt: {
    title: 'Conta',
    accountDataTitle: 'Dados da Conta',
    accountDataSubtitle: 'Plano atual, proprietário e informações básicas',
    planLabel: 'PLANO ATUAL DO SALÃO',
    ownerLabel: 'OWNER (PROPRIETÁRIO DA CONTA)',
    ownerUnknown: 'Nome não disponível',
    emailUnknown: 'Email não disponível',
    planLoading: 'Carregando plano...',
    planUnknown: 'Plano não identificado',
    dangerTitle: 'Zona de Perigo',
    dangerSubtitle: 'Ações irreversíveis relacionadas à sua conta',
    dangerHint: 'Esta ação removerá permanentemente o acesso à conta.',
    dangerCta: 'Cancelar minha conta',
    modalTitle: 'Confirmar cancelamento',
    modalSubtitle: 'Esta ação é irreversível. Digite a palavra de confirmação e sua senha.',
    confirmLabelPrefix: 'Digite',
    confirmLabelSuffix: 'para confirmar',
    confirmMismatch: 'A palavra digitada não confere.',
    passwordLabel: 'Senha',
    reasonLabel: 'Motivo da saída',
    reasonPlaceholder: 'Selecione um motivo (opcional)',
    reasonCost: 'Custo',
    reasonFeatures: 'Faltam recursos',
    reasonComplexity: 'Complexidade',
    reasonOther: 'Outro',
    commentLabel: 'Comentário (opcional)',
    commentPlaceholder: 'Conte-nos rapidamente o motivo...',
    close: 'Fechar',
    confirm: 'Confirmar',
    genericError: 'Ocorreu um erro. Tente novamente.',
  },
  en: {
    title: 'Account',
    accountDataTitle: 'Account Data',
    accountDataSubtitle: 'Current plan, owner and basic account information',
    planLabel: 'CURRENT SALON PLAN',
    ownerLabel: 'OWNER (ACCOUNT OWNER)',
    ownerUnknown: 'Name not available',
    emailUnknown: 'Email not available',
    planLoading: 'Loading plan...',
    planUnknown: 'Plan not identified',
    dangerTitle: 'Danger Zone',
    dangerSubtitle: 'Irreversible actions related to your account',
    dangerHint: 'This action will permanently remove access to your account.',
    dangerCta: 'Cancel my account',
    modalTitle: 'Confirm cancellation',
    modalSubtitle: 'This action is irreversible. Type the confirmation word and your password.',
    confirmLabelPrefix: 'Type',
    confirmLabelSuffix: 'to confirm',
    confirmMismatch: 'The typed confirmation does not match.',
    passwordLabel: 'Password',
    reasonLabel: 'Reason for leaving',
    reasonPlaceholder: 'Select a reason (optional)',
    reasonCost: 'Cost',
    reasonFeatures: 'Missing features',
    reasonComplexity: 'Complexity',
    reasonOther: 'Other',
    commentLabel: 'Comment (optional)',
    commentPlaceholder: 'Tell us briefly why...',
    close: 'Close',
    confirm: 'Confirm',
    genericError: 'Something went wrong. Please try again.',
  },
} as const;

const PLAN_NAME_BY_TIER: Record<string, string> = {
  founder: 'Founder',
  basic: 'Basic',
  pro: 'Pro',
};

function resolvePlanName(plan: any, fallback = '') {
  if (typeof plan === 'string' && plan.trim()) {
    const value = plan.trim();
    return PLAN_NAME_BY_TIER[value.toLowerCase()] || value;
  }

  if (plan && typeof plan === 'object') {
    if (typeof plan.name === 'string' && plan.name.trim()) return plan.name.trim();
    const tier = plan.tier || plan.code;
    if (typeof tier === 'string' && tier.trim()) {
      const normalized = tier.trim().toLowerCase();
      return PLAN_NAME_BY_TIER[normalized] || tier;
    }
  }

  return fallback;
}

export default function AccountScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { userInfo, logout } = useAuth() as any;
  const { tenant, plan, slug } = useTenant() as any;
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [billingPlanName, setBillingPlanName] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);

  const [dangerOpen, setDangerOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadBilling = async () => {
      if (!slug) return;
      setBillingLoading(true);
      try {
        const overview = await fetchBillingOverview({ slug });
        const currentPlan = overview?.current_subscription?.plan_name || '';
        if (active) setBillingPlanName(typeof currentPlan === 'string' ? currentPlan : '');
      } catch {
        if (active) setBillingPlanName('');
      } finally {
        if (active) setBillingLoading(false);
      }
    };

    loadBilling();

    return () => {
      active = false;
    };
  }, [slug]);

  const ownerName = useMemo(() => {
    if (!userInfo) return '';
    if (userInfo.full_name) return userInfo.full_name;
    if (userInfo.name) return userInfo.name;
    if (userInfo.first_name || userInfo.last_name) {
      return [userInfo.first_name, userInfo.last_name].filter(Boolean).join(' ');
    }
    if (userInfo.username) return userInfo.username;
    return userInfo.email || '';
  }, [userInfo]);

  const ownerEmail = userInfo?.email || '';

  const planName = useMemo(() => {
    if (billingPlanName) return billingPlanName;

    const fromPlan = resolvePlanName(plan);
    if (fromPlan) return fromPlan;

    const fromTenantPlan = resolvePlanName(tenant?.plan);
    if (fromTenantPlan) return fromTenantPlan;

    return t.planUnknown;
  }, [billingPlanName, plan, tenant?.plan, t.planUnknown]);

  const cancelReasons = useMemo(
    () => [
      { value: '', label: t.reasonPlaceholder },
      { value: 'cost', label: t.reasonCost },
      { value: 'features', label: t.reasonFeatures },
      { value: 'complexity', label: t.reasonComplexity },
      { value: 'other', label: t.reasonOther },
    ],
    [
      t.reasonPlaceholder,
      t.reasonCost,
      t.reasonFeatures,
      t.reasonComplexity,
      t.reasonOther,
    ],
  );

  const confirmMismatch = confirmText.trim().toUpperCase() !== CONFIRM_WORD;
  const passwordMissing = password.trim() === '';
  const canConfirm = !confirmMismatch && !passwordMissing && !submitting;

  const selectedReasonLabel =
    cancelReasons.find((item) => item.value === reason)?.label ||
    cancelReasons[0].label;

  const handleOpenDanger = () => {
    setConfirmText('');
    setPassword('');
    setReason('');
    setReasonPickerOpen(false);
    setComment('');
    setCancelError(null);
    setDangerOpen(true);
  };

  const handleCloseDanger = () => {
    if (submitting) return;
    setDangerOpen(false);
  };

  const handleConfirmCancel = async () => {
    if (!canConfirm) return;

    setSubmitting(true);
    setCancelError(null);

    const combinedReason = (() => {
      const trimmedComment = comment.trim();
      if (reason && trimmedComment) return `${reason} — ${trimmedComment}`;
      if (reason) return reason;
      if (trimmedComment) return trimmedComment;
      return '';
    })();

    try {
      await cancelTenantAccount({
        password,
        confirmationText: CONFIRM_WORD,
        cancellationReason: combinedReason,
      });
      setDangerOpen(false);
      logout();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.message ||
        t.genericError;
      setCancelError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={s.card}>
          <Text style={s.sectionTitle}>{t.accountDataTitle}</Text>
          <Text style={s.sectionSubtitle}>{t.accountDataSubtitle}</Text>

          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>{t.planLabel}</Text>
              <Text style={s.infoValue}>{billingLoading ? t.planLoading : planName}</Text>
            </View>

            <View style={s.infoItem}>
              <Text style={s.infoLabel}>{t.ownerLabel}</Text>
              <Text style={s.infoValue}>{ownerName || t.ownerUnknown}</Text>
              <Text style={s.infoEmail}>{ownerEmail || t.emailUnknown}</Text>
            </View>
          </View>
        </View>

        <View style={s.dangerCard}>
          <View style={s.dangerCardHeader}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.error}
              style={{ marginRight: 8 }}
            />
            <Text style={[s.sectionTitle, { color: colors.error }]}>{t.dangerTitle}</Text>
          </View>
          <Text style={[s.sectionSubtitle, { color: colors.error, opacity: 0.8 }]}>
            {t.dangerSubtitle}
          </Text>

          <View style={s.dangerRow}>
            <Text style={s.dangerHint}>{t.dangerHint}</Text>
            <TouchableOpacity onPress={handleOpenDanger} style={s.dangerCta}>
              <Text style={[s.dangerCtaText, { color: colors.error }]}>{t.dangerCta}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={dangerOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDanger}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={s.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseDanger}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                s.modalContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {}}
            >
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: colors.textPrimary }]}>
                  {t.modalTitle}
                </Text>
                <TouchableOpacity onPress={handleCloseDanger} disabled={submitting}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[s.modalSubtitle, { color: colors.textSecondary }]}>
                {t.modalSubtitle}
              </Text>

              <ScrollView
                style={{ maxHeight: 420 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={{ gap: 16 }}>
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: colors.textPrimary }]}> 
                      {`${t.confirmLabelPrefix} `}
                      <Text style={{ fontWeight: '700' }}>{CONFIRM_WORD}</Text>
                      {` ${t.confirmLabelSuffix}`}
                    </Text>
                    <TextInput
                      style={[
                        s.textInput,
                        {
                          color: colors.textPrimary,
                          backgroundColor: colors.surfaceVariant,
                          borderColor:
                            confirmText && confirmMismatch ? colors.error : colors.border,
                        },
                      ]}
                      value={confirmText}
                      onChangeText={setConfirmText}
                      placeholder={CONFIRM_WORD}
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="characters"
                    />
                    {confirmText !== '' && confirmMismatch && (
                      <Text style={s.fieldError}>{t.confirmMismatch}</Text>
                    )}
                  </View>

                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: colors.textPrimary }]}>
                      {t.passwordLabel}
                    </Text>
                    <TextInput
                      style={[
                        s.textInput,
                        {
                          color: colors.textPrimary,
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.border,
                        },
                      ]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry
                    />
                  </View>

                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: colors.textPrimary }]}> 
                      {t.reasonLabel}
                    </Text>
                    <TouchableOpacity
                      style={[
                        s.pickerButton,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setReasonPickerOpen(!reasonPickerOpen)}
                    >
                      <Text
                        style={{
                          color: reason ? colors.textPrimary : colors.textTertiary,
                          fontSize: 14,
                        }}
                      >
                        {selectedReasonLabel}
                      </Text>
                      <Ionicons
                        name={reasonPickerOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                    {reasonPickerOpen && (
                      <View
                        style={[
                          s.pickerDropdown,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                        ]}
                      >
                        {cancelReasons.slice(1).map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={[
                              s.pickerOption,
                              reason === item.value && {
                                backgroundColor: colors.surfaceVariant,
                              },
                            ]}
                            onPress={() => {
                              setReason(item.value);
                              setReasonPickerOpen(false);
                            }}
                          >
                            <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                              {item.label}
                            </Text>
                            {reason === item.value && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={colors.brandPrimary}
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: colors.textPrimary }]}> 
                      {t.commentLabel}
                    </Text>
                    <TextInput
                      style={[
                        s.textArea,
                        {
                          color: colors.textPrimary,
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.border,
                        },
                      ]}
                      value={comment}
                      onChangeText={setComment}
                      placeholder={t.commentPlaceholder}
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {cancelError ? (
                    <View
                      style={[
                        s.errorBanner,
                        {
                          backgroundColor: colors.errorBackground,
                          borderColor: colors.error,
                        },
                      ]}
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color={colors.error}
                      />
                      <Text style={[s.errorBannerText, { color: colors.error }]}>
                        {cancelError}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              <View style={s.modalFooter}>
                <TouchableOpacity
                  onPress={handleCloseDanger}
                  disabled={submitting}
                  style={s.footerBtn}
                >
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '500' }}
                  >
                    {t.close}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmCancel}
                  disabled={!canConfirm}
                  style={[
                    s.footerConfirmBtn,
                    {
                      backgroundColor: canConfirm ? colors.error : colors.surfaceVariant,
                      borderColor: canConfirm ? colors.error : colors.border,
                    },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Text
                      style={{
                        color: canConfirm ? colors.surface : colors.textTertiary,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      {t.confirm}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    dangerCard: {
      backgroundColor: colors.errorBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error,
      padding: 16,
      marginBottom: 16,
      opacity: 0.95,
    },
    dangerCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    infoGrid: {
      marginTop: 12,
      gap: 10,
    },
    infoItem: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    infoLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: colors.textTertiary,
      textTransform: 'uppercase',
    },
    infoValue: {
      fontSize: 13,
      color: colors.textPrimary,
      marginTop: 4,
    },
    infoEmail: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    dangerRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    dangerHint: {
      flex: 1,
      fontSize: 13,
      color: colors.error,
      opacity: 0.85,
      minWidth: 0,
    },
    dangerCta: {
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    dangerCtaText: {
      fontSize: 13,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    modalContainer: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
    },
    modalSubtitle: {
      fontSize: 13,
      marginBottom: 16,
      lineHeight: 18,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
      marginTop: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    footerConfirmBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      minWidth: 90,
      alignItems: 'center',
    },
    fieldGroup: {
      gap: 4,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 4,
    },
    fieldError: {
      fontSize: 11,
      color: colors.error,
      marginTop: 2,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      fontSize: 14,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      minHeight: 80,
    },
    pickerButton: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerDropdown: {
      borderWidth: 1,
      borderRadius: 8,
      marginTop: 4,
      overflow: 'hidden',
    },
    pickerOption: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    errorBannerText: {
      fontSize: 13,
      flex: 1,
    },
  });
