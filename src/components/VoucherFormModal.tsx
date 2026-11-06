import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    editTitle: 'Editar voucher',
    newTitle: 'Criar voucher',
    description: 'Defina o benefício, a validade e o limite de utilizações do voucher.',
    cancel: 'Cancelar',
    save: 'Salvar',
    code: 'Código',
    codePlaceholder: 'Deixe em branco para gerar automaticamente',
    type: 'Tipo de voucher',
    typePercent: 'Percentual',
    typeFixed: 'Valor fixo',
    typeFreeService: 'Serviço grátis',
    service: 'Serviço',
    servicePlaceholder: 'Selecione um serviço',
    valuePercent: 'Percentual de desconto (%)',
    valueFixed: 'Valor do desconto',
    maxUses: 'Máximo de atribuições',
    validUntil: 'Válido até (AAAA-MM-DD)',
    validUntilPlaceholder: 'Opcional',
    notes: 'Notas (opcional)',
    notesPlaceholder: 'Ex.: Promoção de aniversário',
    serviceRequired: 'Selecione o serviço gratuito.',
    valueRequired: 'Informe um valor válido.',
    maxUsesInvalid: 'Informe um número de usos válido.',
    noServices: 'Nenhum serviço cadastrado.',
  },
  en: {
    editTitle: 'Edit voucher',
    newTitle: 'Create voucher',
    description: 'Set the benefit, validity and usage limit of the voucher.',
    cancel: 'Cancel',
    save: 'Save',
    code: 'Code',
    codePlaceholder: 'Leave blank to generate automatically',
    type: 'Voucher type',
    typePercent: 'Percent',
    typeFixed: 'Fixed amount',
    typeFreeService: 'Free service',
    service: 'Service',
    servicePlaceholder: 'Select a service',
    valuePercent: 'Discount percentage (%)',
    valueFixed: 'Discount amount',
    maxUses: 'Maximum assignments',
    validUntil: 'Valid until (YYYY-MM-DD)',
    validUntilPlaceholder: 'Optional',
    notes: 'Notes (optional)',
    notesPlaceholder: 'E.g.: Birthday promotion',
    serviceRequired: 'Select the free service.',
    valueRequired: 'Enter a valid value.',
    maxUsesInvalid: 'Enter a valid number of uses.',
    noServices: 'No service registered.',
  },
} as const;

export type VoucherType = 'percent' | 'fixed' | 'free_service';

export interface VoucherFormData {
  code: string;
  type: VoucherType;
  value: string;
  service: string;
  max_uses: string;
  valid_until: string;
  notes: string;
}

export interface VoucherSubmitPayload {
  code?: string;
  type: VoucherType;
  value: number | null;
  service: number | null;
  max_uses: number;
  valid_until: string | null;
  notes: string;
}

interface ServiceOption {
  id: number | string;
  name: string;
}

interface VoucherFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: VoucherSubmitPayload) => Promise<void> | void;
  initialData?: {
    code?: string;
    type?: VoucherType;
    value?: string | number | null;
    service?: number | string | null;
    max_uses?: string | number | null;
    valid_until?: string | null;
    notes?: string | null;
  } | null;
  services?: ServiceOption[];
  busy?: boolean;
  errorMessage?: string | null;
}

const EMPTY_FORM: VoucherFormData = {
  code: '',
  type: 'percent',
  value: '',
  service: '',
  max_uses: '1',
  valid_until: '',
  notes: '',
};

export function VoucherFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  services = [],
  busy = false,
  errorMessage,
}: VoucherFormModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [form, setForm] = useState<VoucherFormData>(EMPTY_FORM);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setForm({
        code: initialData?.code || '',
        type: initialData?.type || 'percent',
        value: initialData?.value != null ? String(initialData.value) : '',
        service: initialData?.service != null ? String(initialData.service) : '',
        max_uses: initialData?.max_uses != null ? String(initialData.max_uses) : '1',
        valid_until: initialData?.valid_until || '',
        notes: initialData?.notes || '',
      });
      setLocalError(null);
    }
  }, [visible, initialData]);

  const setField = (field: keyof VoucherFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (form.type === 'free_service') {
      if (!form.service) {
        setLocalError(t.serviceRequired);
        return;
      }
    } else if (form.value.trim() === '' || Number.isNaN(Number(form.value))) {
      setLocalError(t.valueRequired);
      return;
    }

    const maxUses = Number.parseInt(form.max_uses, 10);
    if (!Number.isFinite(maxUses) || maxUses < 1) {
      setLocalError(t.maxUsesInvalid);
      return;
    }

    const payload: VoucherSubmitPayload = {
      type: form.type,
      max_uses: maxUses,
      valid_until: form.valid_until.trim() || null,
      notes: form.notes.trim(),
      value: null,
      service: null,
    };

    if (form.code.trim()) {
      payload.code = form.code.trim().toUpperCase();
    }

    if (form.type === 'free_service') {
      payload.service = Number.parseInt(form.service, 10);
    } else {
      payload.value = Number(form.value);
    }

    await onSubmit(payload);
  };

  const displayError = localError || errorMessage;
  const isEditing = Boolean(initialData);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? t.editTitle : t.newTitle}
      description={t.description}
      footer={
        <>
          <Button variant="secondary" onPress={onClose} disabled={busy} style={{ flex: 1 }}>
            {t.cancel}
          </Button>
          <Button onPress={handleSubmit} loading={busy} disabled={busy} style={{ flex: 1 }}>
            {t.save}
          </Button>
        </>
      }
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Input
            label={t.code}
            placeholder={t.codePlaceholder}
            value={form.code}
            onChangeText={(text) => setField('code', text.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.type}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['percent', 'fixed', 'free_service'] as VoucherType[]).map((type) => {
              const selected = form.type === type;
              const typeLabel = type === 'percent' ? t.typePercent : type === 'fixed' ? t.typeFixed : t.typeFreeService;
              return (
                <TouchableOpacity
                  key={type}
                  testID={`voucher-type-${type}`}
                  onPress={() => setField('type', type)}
                  style={[
                    styles.typeOption,
                    {
                      borderColor: selected ? colors.brandPrimary : colors.border,
                      backgroundColor: selected ? colors.brandPrimary + '22' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? colors.brandPrimary : colors.textSecondary,
                      fontWeight: '600',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  >
                    {typeLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {form.type === 'free_service' ? (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>{t.service}</Text>
            {services.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t.noServices}</Text>
            ) : (
              <ScrollView style={styles.serviceList} nestedScrollEnabled>
                {services.map((service) => {
                  const selected = form.service === String(service.id);
                  return (
                    <TouchableOpacity
                      key={String(service.id)}
                      testID={`voucher-service-${service.id}`}
                      onPress={() => setField('service', String(service.id))}
                      style={[
                        styles.serviceOption,
                        {
                          borderColor: selected ? colors.brandPrimary : colors.border,
                          backgroundColor: selected ? colors.brandPrimary + '22' : 'transparent',
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? colors.brandPrimary : colors.textPrimary, fontSize: 14 }}>
                        {service.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Input
              label={form.type === 'percent' ? t.valuePercent : t.valueFixed}
              placeholder="0"
              value={form.value}
              onChangeText={(text) => setField('value', text)}
              keyboardType="decimal-pad"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Input
            label={t.maxUses}
            placeholder="1"
            value={form.max_uses}
            onChangeText={(text) => setField('max_uses', text)}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={t.validUntil}
            placeholder={t.validUntilPlaceholder}
            value={form.valid_until}
            onChangeText={(text) => setField('valid_until', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={t.notes}
            placeholder={t.notesPlaceholder}
            value={form.notes}
            onChangeText={(text) => setField('notes', text)}
            multiline
          />
        </View>

        {displayError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBackground, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontSize: 13 }}>{displayError}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {},
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceList: {
    maxHeight: 160,
  },
  serviceOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});
