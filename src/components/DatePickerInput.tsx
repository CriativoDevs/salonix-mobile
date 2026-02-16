import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Input } from './ui/Input';

type DatePickerInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onDateChange: (date: string) => void;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  placeholder,
  value,
  onDateChange,
}) => {
  const { colors } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);

  const now = new Date();
  const defaultYear = value ? parseInt(value.split('-')[0]) : now.getFullYear();
  const defaultMonth = value ? parseInt(value.split('-')[1]) - 1 : now.getMonth();

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

  const days = Array.from({ length: firstDay }).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const handleDaySelect = (day: number) => {
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateChange(formattedDate);
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <>
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 6 }}>
          {label}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              flex: 1,
              color: value ? colors.textPrimary : colors.textSecondary,
              fontSize: 14,
            }}
          >
            {value || placeholder}
          </Text>
          <TouchableOpacity onPress={() => setShowCalendar(true)} style={{ padding: 4 }}>
            <Ionicons name="calendar-outline" size={20} color={colors.brandPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                width: '100%',
                maxWidth: 400,
              }}
            >
              {/* Header com mês/ano */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
                  <Ionicons name="chevron-back" size={24} color={colors.brandPrimary} />
                </TouchableOpacity>

                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  {MONTHS[selectedMonth]} {selectedYear}
                </Text>

                <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
                  <Ionicons name="chevron-forward" size={24} color={colors.brandPrimary} />
                </TouchableOpacity>
              </View>

              {/* Dias da semana */}
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
                  <Text
                    key={day}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      color: colors.textSecondary,
                      fontSize: 12,
                      fontWeight: '600',
                      paddingVertical: 8,
                    }}
                  >
                    {day}
                  </Text>
                ))}
              </View>

              {/* Grid de dias */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {days.map((day, index) => {
                  const dayNum = day as number | null;
                  const isSelected = dayNum && value === `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => dayNum && handleDaySelect(dayNum)}
                      disabled={!dayNum}
                      style={{
                        width: `${100 / 7 - 1}%`,
                        aspectRatio: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 8,
                        backgroundColor: isSelected ? colors.brandPrimary : 'transparent',
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: colors.border,
                        opacity: dayNum ? 1 : 0,
                      }}
                    >
                      {dayNum && (
                        <Text
                          style={{
                            color: isSelected ? '#fff' : colors.textPrimary,
                            fontSize: 14,
                            fontWeight: '500',
                          }}
                        >
                          {dayNum}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botões */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setShowCalendar(false)}
                  style={{ flex: 1 }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      color: colors.textSecondary,
                      fontSize: 14,
                      fontWeight: '600',
                      paddingVertical: 12,
                    }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCalendar(false)}
                  style={{ flex: 1 }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      color: colors.brandPrimary,
                      fontSize: 14,
                      fontWeight: '600',
                      paddingVertical: 12,
                    }}
                  >
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};
