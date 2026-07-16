import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import HourGrid from './HourGrid';
import useTenantBusinessHours from '../../hooks/useTenantBusinessHours';
import useBookingsRange from '../../hooks/useBookingsRange';
import { BookingItem } from '../../hooks/bookingsShared';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // semana comeca na segunda-feira
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type WeekViewProps = {
  referenceDate: Date;
  onChangeReferenceDate: (date: Date) => void;
  onPressAppointment: (appointment: BookingItem) => void;
};

export function WeekView({ referenceDate, onChangeReferenceDate, onPressAppointment }: WeekViewProps) {
  const { colors } = useTheme();
  const weekStart = useMemo(() => startOfWeek(referenceDate), [referenceDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dateFrom = formatDateParam(weekDays[0]);
  const dateTo = formatDateParam(weekDays[6]);

  const { range } = useTenantBusinessHours();
  const { appointments, loading } = useBookingsRange(dateFrom, dateTo);

  const columns = useMemo(() => {
    return weekDays.map((day) => {
      const dayKey = formatDateParam(day);
      const dayAppointments = appointments.filter((a) => a.start && formatDateParam(a.start) === dayKey);
      return {
        key: dayKey,
        label: `${WEEKDAY_LABELS[day.getDay()]} ${day.getDate()}`,
        appointments: dayAppointments,
      };
    });
  }, [weekDays, appointments]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.navRow}>
        <Pressable onPress={() => onChangeReferenceDate(addDays(referenceDate, -7))}>
          <Text style={{ color: colors.brandPrimary }}>{'< Semana anterior'}</Text>
        </Pressable>
        <Pressable onPress={() => onChangeReferenceDate(new Date())}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Hoje</Text>
        </Pressable>
        <Pressable onPress={() => onChangeReferenceDate(addDays(referenceDate, 7))}>
          <Text style={{ color: colors.brandPrimary }}>{'Próxima semana >'}</Text>
        </Pressable>
      </View>
      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 16 }}>A carregar...</Text>
      ) : (
        <HourGrid
          columns={columns}
          rangeStartMinutes={range.startMinutes}
          rangeEndMinutes={range.endMinutes}
          onPressAppointment={onPressAppointment}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default WeekView;
