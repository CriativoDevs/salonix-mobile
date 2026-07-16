import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { useTheme } from '../hooks/useTheme';
import { bulkGenerateSlots } from '../api/slots';

type Period = 'day' | 'week' | 'month';

interface SlotBulkGenerateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  professionals: any[];
  slug?: string;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

export function SlotBulkGenerateModal({ visible, onClose, onSuccess, professionals, slug }: SlotBulkGenerateModalProps) {
  const { colors } = useTheme();
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
    return value.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSubmit = async () => {
    if (!professionalId) return;

    const parsedInterval = Number(intervalMinutes);
    if (!Number.isFinite(parsedInterval) || parsedInterval < 15 || parsedInterval > 480) {
      setIntervalError('O intervalo deve ser entre 15 e 480 minutos.');
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
      Alert.alert('Horários gerados', `Criados: ${result.created}, Ignorados: ${result.skipped}`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert('Erro', typeof detail === 'string' ? detail : 'Não foi possível gerar os horários.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Gerar Horários em Massa"
      footer={
        <>
          <Button variant="secondary" onPress={handleClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} loading={busy} disabled={busy || !professionalId} style={{ flex: 1 }}>
            Gerar horários
          </Button>
        </>
      }
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Profissional</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              testID="bulk-generate-professional-picker"
              selectedValue={professionalId}
              onValueChange={(value) => setProfessionalId(String(value))}
              style={{ color: colors.textPrimary }}
            >
              <Picker.Item label="Selecione..." value="" />
              {professionals.map((prof) => (
                <Picker.Item key={prof.id} label={prof.name} value={String(prof.id)} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Período</Text>
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
          <Text style={[styles.label, { color: colors.textPrimary }]}>Data de início</Text>
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
          label="Intervalo (minutos)"
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
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
