import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import useBookingsRange from '../../hooks/useBookingsRange';
import { getProfessionalColor } from '../../utils/professionalColor';
import { BookingItem } from '../../hooks/bookingsShared';

function startOfMonthGrid(date: Date): Date {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = firstOfMonth.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() + diff);
  gridStart.setHours(0, 0, 0, 0);
  return gridStart;
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

const WEEKDAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type MonthViewProps = {
  referenceDate: Date;
  onSelectDay: (date: Date) => void;
};

export function MonthView({ referenceDate, onSelectDay }: MonthViewProps) {
  const { colors } = useTheme();

  const gridStart = useMemo(() => startOfMonthGrid(referenceDate), [referenceDate]);
  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
  const dateFrom = formatDateParam(gridDays[0]);
  const dateTo = formatDateParam(gridDays[gridDays.length - 1]);

  const { appointments, loading } = useBookingsRange(dateFrom, dateTo);

  const dotsByDay = useMemo(() => {
    const map = new Map<string, BookingItem[]>();
    appointments.forEach((appointment) => {
      if (!appointment.start) return;
      const key = formatDateParam(appointment.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appointment);
    });
    return map;
  }, [appointments]);

  const todayKey = formatDateParam(new Date());
  const currentMonth = referenceDate.getMonth();

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_HEADERS.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.weekdayLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>
      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 16 }}>A carregar...</Text>
      ) : (
        <View style={styles.grid}>
          {gridDays.map((day) => {
            const dayKey = formatDateParam(day);
            const dayAppointments = dotsByDay.get(dayKey) || [];
            const seenProfessionals = new Set<string>();
            const dots = dayAppointments.filter((appointment) => {
              const key = String(appointment.professionalId ?? 'unassigned');
              if (seenProfessionals.has(key)) return false;
              seenProfessionals.add(key);
              return true;
            });
            const inCurrentMonth = day.getMonth() === currentMonth;
            const isToday = dayKey === todayKey;

            return (
              <Pressable
                key={dayKey}
                onPress={() => onSelectDay(day)}
                style={[
                  styles.dayCell,
                  {
                    borderColor: isToday ? colors.brandPrimary : colors.border,
                    opacity: inCurrentMonth ? 1 : 0.4,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isToday ? colors.brandPrimary : colors.textPrimary,
                    fontWeight: isToday ? '700' : '400',
                  }}
                >
                  {day.getDate()}
                </Text>
                <View style={styles.dotsRow}>
                  {dots.slice(0, 4).map((appointment) => (
                    <View
                      key={appointment.id}
                      style={[styles.dot, { backgroundColor: getProfessionalColor(appointment.professionalId).dot }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingTop: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

export default MonthView;
