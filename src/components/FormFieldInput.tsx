import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

const COPY = {
  pt: { required: 'obrigatório', selectPlaceholder: 'Selecione...' },
  en: { required: 'required', selectPlaceholder: 'Select...' },
} as const;

export interface FormField {
  id: string;
  label: string;
  field_type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | string;
  required?: boolean;
  options?: string[];
}

interface FormFieldInputProps {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Campo de ficha por tipo. Valores sempre string (boolean = "true"/"false").
 * Rótulo e valor são renderizados como texto puro.
 */
export function FormFieldInput({ field, value, onChange }: FormFieldInputProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const testID = `form-field-${field.id}`;

  const requiredMark = field.required ? (
    <Text accessibilityLabel={t.required} style={{ color: colors.error }}>
      {' *'}
    </Text>
  ) : null;

  const labelText = (
    <Text style={[styles.label, { color: colors.textPrimary }]}>
      {field.label}
      {requiredMark}
    </Text>
  );

  if (field.field_type === 'boolean') {
    return (
      <View style={[styles.row, { borderColor: colors.border }]}>
        <View style={styles.rowLabel}>{labelText}</View>
        <Switch
          testID={testID}
          accessibilityRole="switch"
          accessibilityLabel={field.label}
          value={value === 'true'}
          onValueChange={(v) => onChange(v ? 'true' : 'false')}
        />
      </View>
    );
  }

  if (field.field_type === 'select') {
    return (
      <View>
        {labelText}
        <Select
          testID={testID}
          options={(field.options || []).map((o) => ({ label: o, value: o }))}
          selectedValue={value}
          onValueChange={onChange}
          placeholder={t.selectPlaceholder}
          title={field.label}
        />
      </View>
    );
  }

  const isTextarea = field.field_type === 'textarea';
  return (
    <View>
      {labelText}
      <Input
        testID={testID}
        value={value}
        onChangeText={onChange}
        multiline={isTextarea}
        numberOfLines={isTextarea ? 3 : 1}
        keyboardType={field.field_type === 'number' ? 'numeric' : 'default'}
        placeholder={field.field_type === 'date' ? 'AAAA-MM-DD' : undefined}
        maxLength={field.field_type === 'date' ? 10 : undefined}
        autoCapitalize="none"
        style={isTextarea ? { height: 80, textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowLabel: { flex: 1, paddingRight: 12 },
});
