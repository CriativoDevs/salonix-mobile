import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import HourGrid, { HourGridColumn } from './HourGrid';
import useTenantBusinessHours from '../../hooks/useTenantBusinessHours';
import useBookingsRange from '../../hooks/useBookingsRange';
import useProfessionals from '../../hooks/useProfessionals';
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
  const navigation = useNavigation<any>();
  const dayKey = formatDateParam(referenceDate);
  const { range } = useTenantBusinessHours();
  const { appointments, loading } = useBookingsRange(dayKey, dayKey);
  const { professionals, loading: loadingProfessionals } = useProfessionals();

  const columns = useMemo(() => {
    return professionals.map((professional: any) => {
      const key = String(professional.id);
      const professionalAppointments = appointments.filter(
        (appointment) => String(appointment.professionalId) === key
      );
      return {
        key,
        label: professional.name || 'Profissional',
        appointments: professionalAppointments,
      };
    });
  }, [professionals, appointments]);

  const handlePressEmptyCell = (column: HourGridColumn) => {
    navigation.navigate('BookingCreate', { date: dayKey, professionalId: column.key });
  };

  const isLoading = loading || loadingProfessionals;

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
      {isLoading ? (
        <Text style={{ color: colors.textSecondary, padding: 16 }}>A carregar...</Text>
      ) : columns.length === 0 ? (
        <Text style={{ color: colors.textSecondary, padding: 16 }}>Nenhum profissional cadastrado</Text>
      ) : (
        <HourGrid
          columns={columns}
          rangeStartMinutes={range.startMinutes}
          rangeEndMinutes={range.endMinutes}
          onPressAppointment={onPressAppointment}
          onPressEmptyCell={handlePressEmptyCell}
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
