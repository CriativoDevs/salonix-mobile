import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Modal } from './Modal';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  testID?: string;
}

/**
 * Dropdown themed, substitui o `@react-native-picker/picker` nativo.
 * O Picker nativo renderiza como um "wheel" (iOS) que precisa de altura fixa
 * dentro de um Modal para não sobrepor as opções — nesta app usamos sempre
 * um trigger + Modal com lista (mesmo padrão já usado em AccountScreen/ReportsScreen).
 */
export const Select: React.FC<SelectProps> = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Selecione...',
  title,
  disabled = false,
  testID,
}) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === selectedValue);
  const label = selectedOption ? selectedOption.label : placeholder;

  return (
    <>
      <TouchableOpacity
        testID={testID}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        style={[
          styles.trigger,
          { backgroundColor: colors.background, borderColor: colors.border },
          disabled && styles.disabled,
        ]}
      >
        <Text
          style={{ color: selectedOption ? colors.textPrimary : colors.textSecondary, fontSize: 14 }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} onClose={() => setOpen(false)} title={title || placeholder} size="sm">
        <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
          {options.map((opt) => {
            const active = opt.value === selectedValue;
            return (
              <TouchableOpacity
                key={opt.value}
                testID={testID ? `${testID}-option-${opt.value}` : undefined}
                onPress={() => {
                  onValueChange(opt.value);
                  setOpen(false);
                }}
                style={[
                  styles.option,
                  { borderBottomColor: colors.border },
                  active && { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{opt.label}</Text>
                {active && <Ionicons name="checkmark" size={18} color={colors.brandPrimary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  optionsList: {
    maxHeight: 320,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
