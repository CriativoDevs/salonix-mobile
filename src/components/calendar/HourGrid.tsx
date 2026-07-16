import React from 'react';
import { View, ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { layoutOverlappingEvents, computeBlockRect, CalendarEvent } from '../../utils/calendarGrid';
import { getProfessionalColor } from '../../utils/professionalColor';
import { BookingItem } from '../../hooks/bookingsShared';

const PX_PER_HOUR = 64;
const AXIS_WIDTH = 48;
const COLUMN_WIDTH = 140;
const HEADER_HEIGHT = 36;

export type HourGridColumn = {
  key: string;
  label: string;
  appointments: BookingItem[];
};

type HourGridProps = {
  columns: HourGridColumn[];
  rangeStartMinutes: number;
  rangeEndMinutes: number;
  onPressAppointment: (appointment: BookingItem) => void;
};

function toCalendarEvent(appointment: BookingItem): CalendarEvent | null {
  if (!appointment.start) return null;
  const startMinutes = appointment.start.getHours() * 60 + appointment.start.getMinutes();
  const endMinutes = appointment.end
    ? appointment.end.getHours() * 60 + appointment.end.getMinutes()
    : startMinutes + 1;
  return {
    id: appointment.id,
    startMinutes,
    endMinutes: Math.max(endMinutes, startMinutes + 1),
    raw: appointment,
  };
}

function formatHourLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:00`;
}

export function HourGrid({
  columns,
  rangeStartMinutes,
  rangeEndMinutes,
  onPressAppointment,
}: HourGridProps) {
  const { colors } = useTheme();
  const totalMinutes = rangeEndMinutes - rangeStartMinutes;
  const bodyHeight = (totalMinutes / 60) * PX_PER_HOUR;

  const hourMarks: number[] = [];
  for (let m = rangeStartMinutes; m < rangeEndMinutes; m += 60) {
    hourMarks.push(m);
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS_WIDTH }}>
          <View style={{ height: HEADER_HEIGHT }} />
          <View style={{ height: bodyHeight }}>
            {hourMarks.map((minutes) => (
              <Text
                key={minutes}
                style={[
                  styles.hourLabel,
                  {
                    color: colors.textSecondary,
                    top: `${((minutes - rangeStartMinutes) / totalMinutes) * 100}%`,
                  } as any,
                ]}
              >
                {formatHourLabel(minutes)}
              </Text>
            ))}
          </View>
        </View>

        <ScrollView horizontal>
          <View style={{ flexDirection: 'row' }}>
            {columns.map((column) => {
              const events = column.appointments
                .map(toCalendarEvent)
                .filter((e): e is CalendarEvent => e !== null);
              const positioned = layoutOverlappingEvents(events);

              return (
                <View
                  key={column.key}
                  style={{ width: COLUMN_WIDTH, borderLeftWidth: 1, borderLeftColor: colors.border }}
                >
                  <View style={[styles.columnHeader, { height: HEADER_HEIGHT }]}>
                    <Text
                      style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}
                      numberOfLines={1}
                    >
                      {column.label}
                    </Text>
                  </View>
                  <View style={{ height: bodyHeight, position: 'relative' }}>
                    {hourMarks.map((minutes) => (
                      <View
                        key={minutes}
                        style={[
                          styles.hourLine,
                          {
                            borderTopColor: colors.border,
                            top: `${((minutes - rangeStartMinutes) / totalMinutes) * 100}%`,
                          } as any,
                        ]}
                      />
                    ))}
                    {positioned.map((event) => {
                      const appointment = event.raw as BookingItem;
                      const rect = computeBlockRect({
                        startMinutes: event.startMinutes,
                        endMinutes: event.endMinutes,
                        rangeStartMinutes,
                        rangeEndMinutes,
                        column: event.column,
                        columnCount: event.columnCount,
                      });
                      const color = getProfessionalColor(appointment.professionalId);
                      return (
                        <Pressable
                          key={event.id}
                          onPress={() => onPressAppointment(appointment)}
                          style={[
                            styles.block,
                            {
                              top: rect.top,
                              height: rect.height,
                              left: rect.left,
                              width: rect.width,
                              backgroundColor: color.background,
                              borderLeftColor: color.dot,
                            } as any,
                          ]}
                        >
                          <Text numberOfLines={2} style={{ fontSize: 11, color: colors.textPrimary }}>
                            {appointment.customerName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hourLabel: {
    position: 'absolute',
    left: 0,
    right: 4,
    fontSize: 10,
    textAlign: 'right',
    transform: [{ translateY: -6 }],
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  columnHeader: {
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  block: {
    position: 'absolute',
    borderRadius: 6,
    borderLeftWidth: 3,
    padding: 4,
    overflow: 'hidden',
  },
});

export default HourGrid;
