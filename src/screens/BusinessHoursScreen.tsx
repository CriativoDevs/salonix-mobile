import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { fetchTenantBusinessHours, updateTenantBusinessHours } from '../api/tenant';
import { Button } from '../components/ui/Button';

type DayHours = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const DAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const DEFAULT_DAY = (day_of_week: number): DayHours => ({
  day_of_week,
  start_time: '09:00:00',
  end_time: '18:00:00',
  is_active: false,
});

function timeStringToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

function formatTimeLabel(time: string): string {
  return time.slice(0, 5);
}

function normalizeToFullWeek(entries: any[]): DayHours[] {
  const byDay = new Map<number, DayHours>();
  entries.forEach((entry) => {
    byDay.set(entry.day_of_week, {
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      is_active: entry.is_active,
    });
  });

  return Array.from({ length: 7 }, (_, day) => byDay.get(day) || DEFAULT_DAY(day));
}

export default function BusinessHoursScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  const [days, setDays] = useState<DayHours[] | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [openPicker, setOpenPicker] = useState<{ day: number; field: 'start' | 'end' } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetchTenantBusinessHours({ slug })
      .then((data) => {
        if (active) setDays(normalizeToFullWeek(data));
      })
      .catch(() => {
        if (active) setDays(normalizeToFullWeek([]));
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const updateDay = (day: number, patch: Partial<DayHours>) => {
    setDays((current) => {
      if (!current) return current;
      return current.map((entry) => (entry.day_of_week === day ? { ...entry, ...patch } : entry));
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[day];
      return next;
    });
  };

  const handleSave = async () => {
    if (!days) return;

    const newErrors: Record<number, string> = {};
    days.forEach((entry) => {
      if (entry.is_active && entry.end_time <= entry.start_time) {
        newErrors[entry.day_of_week] = 'A hora de fecho deve ser depois da hora de abertura.';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setBusy(true);
    try {
      await updateTenantBusinessHours(days, { slug });
      Alert.alert('Sucesso', 'Horário de funcionamento atualizado.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert('Erro', typeof detail === 'string' ? detail : 'Não foi possível guardar o horário de funcionamento.');
    } finally {
      setBusy(false);
    }
  };

  if (!days) {
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Horário de Funcionamento</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {days.map((entry) => (
          <View key={entry.day_of_week} style={[styles.dayRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayLabel, { color: colors.textPrimary }]}>{DAY_LABELS[entry.day_of_week]}</Text>
              {isAdmin ? (
                <Switch
                  testID={`business-hours-active-switch-${entry.day_of_week}`}
                  value={entry.is_active}
                  onValueChange={(value) => updateDay(entry.day_of_week, { is_active: value })}
                />
              ) : (
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {entry.is_active ? 'Ativo' : 'Inativo'}
                </Text>
              )}
            </View>

            {entry.is_active && (
              <View style={styles.timeRow}>
                <TouchableOpacity
                  disabled={!isAdmin}
                  testID={`business-hours-start-time-picker-${entry.day_of_week}-button`}
                  onPress={() => setOpenPicker({ day: entry.day_of_week, field: 'start' })}
                  style={[styles.timeButton, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.textPrimary }}>{formatTimeLabel(entry.start_time)}</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.textSecondary }}>—</Text>
                <TouchableOpacity
                  disabled={!isAdmin}
                  testID={`business-hours-end-time-picker-${entry.day_of_week}-button`}
                  onPress={() => setOpenPicker({ day: entry.day_of_week, field: 'end' })}
                  style={[styles.timeButton, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.textPrimary }}>{formatTimeLabel(entry.end_time)}</Text>
                </TouchableOpacity>
              </View>
            )}

            {entry.is_active && openPicker?.day === entry.day_of_week && (
              <DateTimePicker
                testID={`business-hours-${openPicker.field}-time-picker-${entry.day_of_week}`}
                value={timeStringToDate(openPicker.field === 'start' ? entry.start_time : entry.end_time)}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setOpenPicker(null);
                  if (!selectedDate) return;
                  const field = openPicker.field === 'start' ? 'start_time' : 'end_time';
                  updateDay(entry.day_of_week, { [field]: dateToTimeString(selectedDate) });
                }}
              />
            )}

            {errors[entry.day_of_week] && (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors[entry.day_of_week]}</Text>
            )}
          </View>
        ))}

        {isAdmin && (
          <Button onPress={handleSave} loading={busy} disabled={busy}>
            Guardar
          </Button>
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
  dayRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
