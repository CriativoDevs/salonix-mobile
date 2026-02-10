import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';

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
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : styles.inputNormal,
        ]}
        placeholderTextColor="#94a3b8" // text-muted (#94a3b8)
        accessibilityLabel={label}
        accessibilityHint={description}
        {...props}
      />
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        description && (
          <Text style={styles.descriptionText}>{description}</Text>
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
    color: '#0f172a', // text-brand-surfaceForeground
    marginBottom: 4, // space-y-1
  },
  input: {
    width: '100%',
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    backgroundColor: '#ffffff', // bg-brand-surface
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    fontSize: 14, // text-sm
    color: '#0f172a', // text-brand-surfaceForeground
  },
  inputNormal: {
    borderColor: '#e2e8f0', // border-brand-border
  },
  inputError: {
    borderColor: '#fb7185', // border-rose-400
  },
  errorText: {
    fontSize: 12, // text-xs
    color: '#e11d48', // text-rose-600
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 12, // text-xs
    color: '#94a3b8', // text-brand-muted
    marginTop: 4,
  },
});
