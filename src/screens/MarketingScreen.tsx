import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { fetchMarketingCampaigns, createMarketingCampaign } from '../api/marketing';
import { parseApiError } from '../utils/apiError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECT_MAX = 150;
const BODY_MAX = 5000;

type Campaign = {
  id: number | string;
  subject: string;
  body: string;
  reply_to: string | null;
  status: string;
  eligible_count: number;
  skipped_no_consent_count: number;
  free_sent_count: number;
  credit_sent_count: number;
  credit_charged_eur: number | string;
  blocked_credit_count: number;
  total_sent_count: number;
  created_by_username: string | null;
  created_at: string;
  completed_at: string | null;
};

const COPY = {
  pt: {
    title: 'Marketing por email',
    subtitle: 'Componha e envie campanhas de email para os seus clientes com consentimento para receber comunicações.',
    formTitle: 'Nova campanha',
    formSubtitle: 'O email é enviado a todos os clientes elegíveis — não é possível escolher um grupo específico no momento.',
    subjectLabel: 'Assunto',
    subjectPlaceholder: 'Ex.: Novidades e promoções deste mês',
    bodyLabel: 'Conteúdo do email',
    bodyPlaceholder: 'Escreva a mensagem que os seus clientes vão receber...',
    replyToLabel: 'Responder para (opcional)',
    replyToPlaceholder: 'contato@meunegocio.com',
    replyToHelp: 'O email é sempre enviado pela plataforma; se preencher este campo, as respostas dos clientes vão para este endereço.',
    recipientsNote: 'Destinatários: todos os clientes elegíveis (com consentimento para receber comunicações). Ainda não é possível segmentar destinatários.',
    submit: 'Rever e enviar campanha',
    errorSubjectRequired: 'Escreva o assunto do email.',
    errorSubjectTooLong: 'Assunto muito longo.',
    errorBodyRequired: 'Escreva o conteúdo do email.',
    errorBodyTooLong: 'Conteúdo muito longo.',
    errorReplyToInvalid: 'Informe um email válido.',
    errorSendFailed: 'Não foi possível enviar a campanha.',
    confirmTitle: 'Confirmar envio da campanha',
    confirmDescription: 'Tem a certeza que quer enviar esta campanha para todos os clientes elegíveis? Esta ação não pode ser desfeita.',
    confirmRecipientsNote: 'Será enviada a todos os clientes elegíveis com consentimento para receber comunicações.',
    confirmSubmit: 'Sim, enviar campanha',
    cancel: 'Cancelar',
    close: 'Fechar',
    resultTitle: 'Resultado do envio',
    toastSent: 'Campanha enviada com sucesso.',
    historyTitle: 'Histórico de campanhas',
    historySubtitle: 'Consulte as campanhas já enviadas e o resultado de cada envio.',
    historyEmptyTitle: 'Nenhuma campanha enviada',
    historyEmptyDescription: 'Quando enviar a primeira campanha de email, ela aparece aqui.',
    historyLoadError: 'Não foi possível carregar o histórico de campanhas.',
    historyTotalSent: 'Enviados',
    historyCreatedBy: 'Criada por',
    breakdownFreeSent: 'Enviados (cota grátis)',
    breakdownCreditSent: 'Enviados via crédito',
    breakdownCreditCharged: 'Créditos consumidos',
    breakdownBlockedCredit: 'Bloqueados por falta de crédito',
    breakdownSkippedNoConsent: 'Pulados (sem consentimento)',
    breakdownEligible: 'Clientes elegíveis',
    loading: 'Carregando...',
    forbidden: 'Não tem permissão para enviar campanhas de marketing.',
  },
  en: {
    title: 'Email marketing',
    subtitle: 'Compose and send email campaigns to your clients who have consented to receive communications.',
    formTitle: 'New campaign',
    formSubtitle: 'The email is sent to all eligible clients — it is not currently possible to choose a specific group.',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'e.g.: News and promotions this month',
    bodyLabel: 'Email content',
    bodyPlaceholder: 'Write the message your clients will receive...',
    replyToLabel: 'Reply-to (optional)',
    replyToPlaceholder: 'contact@mybusiness.com',
    replyToHelp: 'The email is always sent from the platform; if you fill in this field, client replies go to this address.',
    recipientsNote: 'Recipients: all eligible clients (who consented to receive communications). Segmenting recipients is not yet possible.',
    submit: 'Review and send campaign',
    errorSubjectRequired: 'Write the email subject.',
    errorSubjectTooLong: 'Subject is too long.',
    errorBodyRequired: 'Write the email content.',
    errorBodyTooLong: 'Content is too long.',
    errorReplyToInvalid: 'Enter a valid email.',
    errorSendFailed: 'Could not send the campaign.',
    confirmTitle: 'Confirm campaign send',
    confirmDescription: 'Are you sure you want to send this campaign to all eligible clients? This action cannot be undone.',
    confirmRecipientsNote: 'It will be sent to all eligible clients who consented to receive communications.',
    confirmSubmit: 'Yes, send campaign',
    cancel: 'Cancel',
    close: 'Close',
    resultTitle: 'Send result',
    toastSent: 'Campaign sent successfully.',
    historyTitle: 'Campaign history',
    historySubtitle: 'See past campaigns and the outcome of each send.',
    historyEmptyTitle: 'No campaigns sent',
    historyEmptyDescription: 'When you send your first email campaign, it will appear here.',
    historyLoadError: 'Could not load the campaign history.',
    historyTotalSent: 'Sent',
    historyCreatedBy: 'Created by',
    breakdownFreeSent: 'Sent (free quota)',
    breakdownCreditSent: 'Sent via credit',
    breakdownCreditCharged: 'Credits consumed',
    breakdownBlockedCredit: 'Blocked (insufficient credit)',
    breakdownSkippedNoConsent: 'Skipped (no consent)',
    breakdownEligible: 'Eligible clients',
    loading: 'Loading...',
    forbidden: 'You do not have permission to send marketing campaigns.',
  },
};

type Copy = typeof COPY.pt;

function formatCurrency(value: number | string | undefined, locale: string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(num || 0);
}

function formatDateTime(isoDate: string | null | undefined, locale: string) {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleString(locale);
}

function statusLabel(status: string | undefined) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';
}

function statusColors(status: string | undefined, colors: any) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'sent') {
    return { background: colors.successBackground, text: colors.success };
  }
  if (s === 'failed' || s === 'error') {
    return { background: colors.errorBackground, text: colors.error };
  }
  if (s === 'processing' || s === 'pending') {
    return { background: colors.warningBackground, text: colors.warning };
  }
  return { background: colors.surfaceVariant, text: colors.textSecondary };
}

function CampaignBreakdown({ campaign, t, locale }: { campaign: Campaign; t: Copy; locale: string }) {
  const { colors } = useTheme();
  const rows: [string, number | string | undefined][] = [
    [t.breakdownFreeSent, campaign.free_sent_count],
    [t.breakdownCreditSent, campaign.credit_sent_count],
    [t.breakdownCreditCharged, formatCurrency(campaign.credit_charged_eur, locale)],
    [t.breakdownBlockedCredit, campaign.blocked_credit_count],
    [t.breakdownSkippedNoConsent, campaign.skipped_no_consent_count],
    [t.breakdownEligible, campaign.eligible_count],
  ];

  return (
    <View style={styles.breakdownGrid}>
      {rows.map(([label, value]) => (
        <View key={label} style={[styles.breakdownRow, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{value ?? 0}</Text>
        </View>
      ))}
    </View>
  );
}

function CampaignHistoryRow({ campaign, t, locale }: { campaign: Campaign; t: Copy; locale: string }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const badge = statusColors(campaign.status, colors);

  return (
    <View style={{ marginBottom: 10 }}>
    <Card>
      <TouchableOpacity
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={campaign.subject}
        style={styles.historyHeader}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
            {campaign.subject}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {formatDateTime(campaign.created_at, locale)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.statusBadge, { backgroundColor: badge.background }]}>
            <Text style={{ color: badge.text, fontSize: 11, fontWeight: '600' }}>{statusLabel(campaign.status)}</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {t.historyTotalSent}: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{campaign.total_sent_count ?? 0}</Text>
          </Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.historyExpanded, { borderTopColor: colors.border }]}>
          {campaign.reply_to ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
              {t.replyToLabel}: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{campaign.reply_to}</Text>
            </Text>
          ) : null}
          <CampaignBreakdown campaign={campaign} t={t} locale={locale} />
          {campaign.created_by_username ? (
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>
              {t.historyCreatedBy}: {campaign.created_by_username}
            </Text>
          ) : null}
        </View>
      )}
    </Card>
    </View>
  );
}

export default function MarketingScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth() as any;
  const { language } = useLanguage();
  const { showToast } = useToast();

  const t = language === 'en' ? COPY.en : COPY.pt;
  const locale = language === 'en' ? 'en-US' : 'pt-PT';

  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  useEffect(() => {
    if (!isAdmin) {
      navigation.goBack();
    }
  }, [isAdmin, navigation]);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; body?: string; replyTo?: string }>({});

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [resultCampaign, setResultCampaign] = useState<Campaign | null>(null);

  const loadHistory = useCallback(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(false);
    fetchMarketingCampaigns({ slug })
      .then((data: Campaign[]) => {
        if (cancelled) return;
        setCampaigns(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setHistoryError(true);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!isAdmin) return;
    const cleanup = loadHistory();
    return () => cleanup?.();
  }, [loadHistory, isAdmin]);

  const bodyLength = useMemo(() => body.length, [body]);

  const validate = () => {
    const nextErrors: { subject?: string; body?: string; replyTo?: string } = {};
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    const trimmedReplyTo = replyTo.trim();

    if (!trimmedSubject) {
      nextErrors.subject = t.errorSubjectRequired;
    } else if (trimmedSubject.length > SUBJECT_MAX) {
      nextErrors.subject = t.errorSubjectTooLong;
    }

    if (!trimmedBody) {
      nextErrors.body = t.errorBodyRequired;
    } else if (trimmedBody.length > BODY_MAX) {
      nextErrors.body = t.errorBodyTooLong;
    }

    if (trimmedReplyTo && !EMAIL_RE.test(trimmedReplyTo)) {
      nextErrors.replyTo = t.errorReplyToInvalid;
    }

    return nextErrors;
  };

  const handleOpenConfirm = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSendError(null);
    setConfirmVisible(true);
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const created = await createMarketingCampaign(
        {
          subject: subject.trim(),
          body: body.trim(),
          reply_to: replyTo.trim() || null,
        },
        { slug }
      );
      setConfirmVisible(false);
      setResultCampaign(created);
      setCampaigns((prev) => [created, ...prev]);
      setSubject('');
      setBody('');
      setReplyTo('');
      setErrors({});
      showToast({ type: 'success', message: t.toastSent });
    } catch (error) {
      const message = parseApiError(error, t.errorSendFailed);
      setSendError(message);
      showToast({ type: 'error', message });
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel={t.close}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>{t.subtitle}</Text>

        <View style={{ marginBottom: 16 }}>
        <Card>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{t.formTitle}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 12 }}>
            {t.formSubtitle}
          </Text>

          <Input
            testID="marketing-subject-input"
            label={t.subjectLabel}
            placeholder={t.subjectPlaceholder}
            value={subject}
            onChangeText={setSubject}
            maxLength={SUBJECT_MAX}
            error={errors.subject}
            editable={!sending}
          />

          <View style={{ marginBottom: 4 }}>
            <Input
              testID="marketing-body-input"
              label={t.bodyLabel}
              placeholder={t.bodyPlaceholder}
              value={body}
              onChangeText={setBody}
              maxLength={BODY_MAX}
              multiline
              numberOfLines={8}
              style={{ minHeight: 140, textAlignVertical: 'top' }}
              error={errors.body}
              editable={!sending}
            />
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: -12, marginBottom: 12 }}>
              {bodyLength}/{BODY_MAX}
            </Text>
          </View>

          <Input
            testID="marketing-reply-to-input"
            label={t.replyToLabel}
            placeholder={t.replyToPlaceholder}
            value={replyTo}
            onChangeText={setReplyTo}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.replyTo}
            description={!errors.replyTo ? t.replyToHelp : undefined}
            editable={!sending}
          />

          <View style={[styles.noteBox, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.recipientsNote}</Text>
          </View>

          {sendError ? (
            <View style={{ marginTop: 12 }}>
              <Alert type="error" message={sendError} />
            </View>
          ) : null}

          <Button
            variant="link"
            onPress={handleOpenConfirm}
            disabled={sending}
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          >
            {t.submit}
          </Button>
        </Card>
        </View>

        <Card>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{t.historyTitle}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 12 }}>
            {t.historySubtitle}
          </Text>

          {historyError ? (
            <Alert type="error" message={t.historyLoadError} />
          ) : historyLoading ? (
            <ActivityIndicator size="small" color={colors.brandPrimary} />
          ) : campaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={28} color={colors.textTertiary} />
              <Text style={{ color: colors.textPrimary, fontWeight: '600', marginTop: 8 }}>{t.historyEmptyTitle}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                {t.historyEmptyDescription}
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 4 }}>
              {campaigns.map((campaign) => (
                <CampaignHistoryRow key={campaign.id} campaign={campaign} t={t} locale={locale} />
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      <Modal
        visible={confirmVisible}
        onClose={() => (sending ? undefined : setConfirmVisible(false))}
        title={t.confirmTitle}
        description={t.confirmDescription}
        closeOnBackdrop={!sending}
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="link" size="sm" onPress={() => setConfirmVisible(false)} disabled={sending}>
              {t.cancel}
            </Button>
            <Button
              variant="link"
              size="sm"
              onPress={handleConfirmSend}
              loading={sending}
              disabled={sending}
            >
              {t.confirmSubmit}
            </Button>
          </View>
        }
      >
        <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>
          <Text style={{ fontWeight: '700' }}>{t.subjectLabel}: </Text>
          {subject}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t.confirmRecipientsNote}</Text>
      </Modal>

      <Modal
        visible={Boolean(resultCampaign)}
        onClose={() => setResultCampaign(null)}
        title={t.resultTitle}
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button variant="link" size="sm" onPress={() => setResultCampaign(null)}>
              {t.close}
            </Button>
          </View>
        }
      >
        {resultCampaign ? (
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
              {resultCampaign.subject}
            </Text>
            <CampaignBreakdown campaign={resultCampaign} t={t} locale={locale} />
          </View>
        ) : null}
      </Modal>
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
  noteBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownRow: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
