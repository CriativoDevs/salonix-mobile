import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import HourGrid from './HourGrid';
import useTenantBusinessHours from '../../hooks/useTenantBusinessHours';
import useBookingsRange from '../../hooks/useBookingsRange';
import { BookingItem } from '../../hooks/bookingsShared';

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

type DayViewProps = {
  referenceDate: Date;
  onChangeReferenceDate: (date: Date) => void;
  onPressAppointment: (appointment: BookingItem) => void;
};

export function DayView({ referenceDate, onChangeReferenceDate, onPressAppointment }: DayViewProps) {
  const { colors } = useTheme();
  const dayKey = formatDateParam(referenceDate);
  const { range } = useTenantBusinessHours();
  const { appointments, loading } = useBookingsRange(dayKey, dayKey);

  const columns = useMemo(() => {
    const byProfessional = new Map<string, { key: string; label: string; appointments: BookingItem[] }>();
    appointments.forEach((appointment) => {
      const key = appointment.professionalId != null ? String(appointment.professionalId) : 'unassigned';
      if (!byProfessional.has(key)) {
        byProfessional.set(key, {
          key,
          label: appointment.professionalName || 'Sem profissional',
          appointments: [],
        });
      }
      byProfessional.get(key)!.appointments.push(appointment);
    });
    return Array.from(byProfessional.values());
  }, [appointments]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.navRow}>
        <Pressable onPress={() => onChangeReferenceDate(addDays(referenceDate, -1))}>
          <Text style={{ color: colors.brandPrimary }}>{'< Dia anterior'}</Text>
        </Pressable>
        <Pressable onPress={() => onChangeReferenceDate(new Date())}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Hoje</Text>
        </Pressable>
        <Pressable onPress={() => onChangeReferenceDate(addDays(referenceDate, 1))}>
          <Text style={{ color: colors.brandPrimary }}>{'Próximo dia >'}</Text>
        </Pressable>
      </View>
      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 16 }}>A carregar...</Text>
      ) : columns.length === 0 ? (
        <Text style={{ color: colors.textSecondary, padding: 16 }}>Sem agendamentos neste dia</Text>
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

export default DayView;
