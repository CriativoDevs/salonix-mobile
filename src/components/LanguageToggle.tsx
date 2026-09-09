/**
 * LanguageToggle - Botão para alternar entre PT e EN
 * Baseado no ThemeToggle.tsx (mesmo padrão visual)
 */

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface LanguageToggleProps {
  language?: string;
  onToggle?: () => void;
  size?: number;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language = 'pt',
  onToggle,
  size = 24,
}) => {
  const { colors } = useTheme();
  const isPt = language === 'pt';

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.7 : 1,
          minWidth: size + 16,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isPt ? 'Mudar para inglês' : 'Mudar para português'}
      accessibilityHint={`Idioma atual: ${isPt ? 'português' : 'inglês'}. Toque para alternar.`}
    >
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {isPt ? 'PT' : 'EN'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default LanguageToggle;
