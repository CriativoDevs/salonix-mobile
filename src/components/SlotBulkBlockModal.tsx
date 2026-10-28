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
import { bulkBlockSlots } from '../api/slots';
import { useToast } from '../contexts/ToastContext';

interface SlotBulkBlockModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  professionals: any[];
  slug?: string;
}

const COPY = {
  pt: {
    locale: 'pt-PT',
    intervalRangeError: 'O intervalo deve ser entre 15 e 480 minutos.',
    dateRangeError: 'A data final deve ser igual ou posterior à data inicial.',
    blockedSuccess: (blocked: number, created: number, skipped: number) =>
      `Horários bloqueados. Bloqueados: ${blocked}, Criados: ${created}, Já reservados (mantidos): ${skipped}`,
    errorTitle: 'Erro',
    blockError: 'Não foi possível bloquear os horários.',
    title: 'Bloquear Horários em Massa',
    cancel: 'Cancelar',
    block: 'Bloquear horários',
    professional: 'Profissional',
    select: 'Selecione...',
    dateFrom: 'Data de início',
    dateTo: 'Data de fim',
    startTime: 'Horário de início',
    endTime: 'Horário de término',
    intervalMinutes: 'Intervalo (minutos)',
    reason: 'Motivo (opcional)',
    reasonPlaceholder: 'Ex: Férias, manutenção...',
  },
  en: {
    locale: 'en-US',
    intervalRangeError: 'The interval must be between 15 and 480 minutes.',
    dateRangeError: 'The end date must be the same as or after the start date.',
    blockedSuccess: (blocked: number, created: number, skipped: number) =>
      `Slots blocked. Blocked: ${blocked}, Created: ${created}, Already booked (kept): ${skipped}`,
    errorTitle: 'Error',
    blockError: 'Could not block the slots.',
    title: 'Bulk Block Slots',
    cancel: 'Cancel',
    block: 'Block slots',
    professional: 'Professional',
    select: 'Select...',
    dateFrom: 'Start date',
    dateTo: 'End date',
    startTime: 'Start time',
    endTime: 'End time',
    intervalMinutes: 'Interval (minutes)',
    reason: 'Reason (optional)',
    reasonPlaceholder: 'E.g. Vacation, maintenance...',
  },
} as const;

function defaultStartTime() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

function defaultEndTime() {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d;
}

export function SlotBulkBlockModal({ visible, onClose, onSuccess, professionals, slug }: SlotBulkBlockModalProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [professionalId, setProfessionalId] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [startTime, setStartTime] = useState(defaultStartTime());
  const [endTime, setEndTime] = useState(defaultEndTime());
  const [intervalMinutes, setIntervalMinutes] = useState('30');
  const [reason, setReason] = useState('');
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [intervalError, setIntervalError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setProfessionalId('');
      setDateFrom(new Date());
      setDateTo(new Date());
      setStartTime(defaultStartTime());
      setEndTime(defaultEndTime());
      setIntervalMinutes('30');
      setReason('');
      setIntervalError(null);
      setDateError(null);
      setBusy(false);
    }
  }, [visible, professionals]);

  const handleClose = () => {
    onClose();
  };

  const formatDate = (value: Date) => {
    return value.toLocaleDateString(t.locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (value: Date) => {
    return value.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' });
  };

  const toDateStr = (value: Date) => value.toISOString().split('T')[0];

  const toTimeStr = (value: Date) => {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async () => {
    if (!professionalId) return;

    const parsedInterval = Number(intervalMinutes);
    if (!Number.isFinite(parsedInterval) || parsedInterval < 15 || parsedInterval > 480) {
      setIntervalError(t.intervalRangeError);
      return;
    }
    setIntervalError(null);

    if (toDateStr(dateTo) < toDateStr(dateFrom)) {
      setDateError(t.dateRangeError);
      return;
    }
    setDateError(null);

    setBusy(true);
    try {
      const result = await bulkBlockSlots({
        professional_id: professionalId,
        date_from: toDateStr(dateFrom),
        date_to: toDateStr(dateTo),
        start_time: toTimeStr(startTime),
        end_time: toTimeStr(endTime),
        interval_minutes: parsedInterval,
        reason: reason.trim() || undefined,
        slug,
      });
      showToast({
        type: 'success',
        message: t.blockedSuccess(result.blocked, result.created, result.skipped_booked),
      });
      onSuccess();
      handleClose();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert(t.errorTitle, typeof detail === 'string' ? detail : t.blockError);
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
            {t.block}
          </Button>
        </>
      }
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.professional}</Text>
          <Select
            testID="bulk-block-professional-picker"
            selectedValue={professionalId}
            onValueChange={setProfessionalId}
            placeholder={t.select}
            title={t.professional}
            options={professionals.map((prof) => ({ label: prof.name, value: String(prof.id) }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.dateFrom}</Text>
          <TouchableOpacity
            testID="bulk-block-date-from-button"
            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowDateFromPicker(true)}
          >
            <Text style={{ color: colors.textPrimary }}>{formatDate(dateFrom)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showDateFromPicker && (
            <DateTimePicker
              value={dateFrom}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDateFromPicker(false);
                if (selectedDate) {
                  setDateFrom(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.dateTo}</Text>
          <TouchableOpacity
            testID="bulk-block-date-to-button"
            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowDateToPicker(true)}
          >
            <Text style={{ color: colors.textPrimary }}>{formatDate(dateTo)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showDateToPicker && (
            <DateTimePicker
              value={dateTo}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDateToPicker(false);
                if (selectedDate) {
                  setDateTo(selectedDate);
                }
              }}
            />
          )}
          {dateError && (
            <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{dateError}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.startTime}</Text>
          <TouchableOpacity
            testID="bulk-block-start-time-button"
            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text style={{ color: colors.textPrimary }}>{formatTime(startTime)}</Text>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowStartTimePicker(false);
                if (selectedTime) {
                  setStartTime(selectedTime);
                }
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.endTime}</Text>
          <TouchableOpacity
            testID="bulk-block-end-time-button"
            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text style={{ color: colors.textPrimary }}>{formatTime(endTime)}</Text>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowEndTimePicker(false);
                if (selectedTime) {
                  setEndTime(selectedTime);
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

        <Input
          label={t.reason}
          placeholder={t.reasonPlaceholder}
          value={reason}
          onChangeText={setReason}
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
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});
