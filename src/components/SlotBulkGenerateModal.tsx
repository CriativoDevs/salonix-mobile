import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { bulkGenerateSlots } from '../api/slots';
import { useToast } from '../contexts/ToastContext';

type Period = 'day' | 'week' | 'month';

interface SlotBulkGenerateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  professionals: any[];
  slug?: string;
}

const COPY = {
  pt: {
    locale: 'pt-PT',
    periodDay: 'Dia',
    periodWeek: 'Semana',
    periodMonth: 'Mês',
    intervalRangeError: 'O intervalo deve ser entre 15 e 480 minutos.',
    generatedSuccess: (created: number, skipped: number) => `Horários gerados. Criados: ${created}, Ignorados: ${skipped}`,
    errorTitle: 'Erro',
    generateError: 'Não foi possível gerar os horários.',
    title: 'Gerar Horários em Massa',
    cancel: 'Cancelar',
    generate: 'Gerar horários',
    professional: 'Profissional',
    select: 'Selecione...',
    period: 'Período',
    startDate: 'Data de início',
    intervalMinutes: 'Intervalo (minutos)',
  },
  en: {
    locale: 'en-US',
    periodDay: 'Day',
    periodWeek: 'Week',
    periodMonth: 'Month',
    intervalRangeError: 'The interval must be between 15 and 480 minutes.',
    generatedSuccess: (created: number, skipped: number) => `Slots generated. Created: ${created}, Skipped: ${skipped}`,
    errorTitle: 'Error',
    generateError: 'Could not generate the slots.',
    title: 'Bulk Generate Slots',
    cancel: 'Cancel',
    generate: 'Generate slots',
    professional: 'Professional',
    select: 'Select...',
    period: 'Period',
    startDate: 'Start date',
    intervalMinutes: 'Interval (minutes)',
  },
} as const;

export function SlotBulkGenerateModal({ visible, onClose, onSuccess, professionals, slug }: SlotBulkGenerateModalProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: 'day', label: t.periodDay },
    { value: 'week', label: t.periodWeek },
    { value: 'month', label: t.periodMonth },
  ];
  const [professionalId, setProfessionalId] = useState('');
  const [period, setPeriod] = useState<Period>('week');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState('30');
  const [intervalError, setIntervalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setProfessionalId('');
      setPeriod('week');
      setDate(new Date());
      setIntervalMinutes('30');
      setIntervalError(null);
      setBusy(false);
    }
  }, [visible, professionals]);

  const handleClose = () => {
    onClose();
  };

  const formatDate = (value: Date) => {
    return value.toLocaleDateString(t.locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSubmit = async () => {
    if (!professionalId) return;

    const parsedInterval = Number(intervalMinutes);
    if (!Number.isFinite(parsedInterval) || parsedInterval < 15 || parsedInterval > 480) {
      setIntervalError(t.intervalRangeError);
      return;
    }
    setIntervalError(null);

    setBusy(true);
    try {
      const result = await bulkGenerateSlots({
        professional_id: professionalId,
        period,
        interval_minutes: parsedInterval,
        date: date.toISOString().split('T')[0],
        slug,
      });
      showToast({ type: 'success', message: t.generatedSuccess(result.created, result.skipped) });
      onSuccess();
      handleClose();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert(t.errorTitle, typeof detail === 'string' ? detail : t.generateError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={t.title}
      footer={
        <>
          <Button variant="link" onPress={handleClose} style={{ flex: 1 }}>
            {t.cancel}
          </Button>
          <Button onPress={handleSubmit} loading={busy} disabled={busy || !professionalId} style={{ flex: 1 }}>
            {t.generate}
          </Button>
        </>
      }
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.professional}</Text>
          <Select
            testID="bulk-generate-professional-picker"
            selectedValue={professionalId}
            onValueChange={setProfessionalId}
            placeholder={t.select}
            title={t.professional}
            options={professionals.map((prof) => ({ label: prof.name, value: String(prof.id) }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.period}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PERIOD_OPTIONS.map((option) => {
              const active = period === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setPeriod(option.value)}
                  style={[
                    styles.periodOption,
                    { borderColor: active ? colors.brandPrimary : colors.border, backgroundColor: active ? colors.brandPrimary : 'transparent' },
                  ]}
                >
                  <Text style={{ color: active ? colors.background : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.startDate}</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.textPrimary }}>{formatDate(date)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <Input
          label={t.intervalMinutes}
          placeholder="30"
          value={intervalMinutes}
          onChangeText={(value) => {
            setIntervalMinutes(value);
            setIntervalError(null);
          }}
          keyboardType="numeric"
          error={intervalError || undefined}
        />
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
  periodOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});
