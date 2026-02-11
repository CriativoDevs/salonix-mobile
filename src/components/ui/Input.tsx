import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  description?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  description,
  ...props
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        accessibilityHint={description}
        {...props}
      />
      
      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : (
        description && (
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{description}</Text>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16, // Espaçamento entre inputs
  },
  label: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    marginBottom: 4, // space-y-1
  },
  input: {
    width: '100%',
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    fontSize: 14, // text-sm
  },
  errorText: {
    fontSize: 12, // text-xs
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 12, // text-xs
    marginTop: 4,
  },
});
