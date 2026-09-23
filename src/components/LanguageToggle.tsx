/**
 * LanguageToggle - Botão para alternar entre PT e EN
 * Baseado no ThemeToggle.tsx (mesmo padrão visual)
 */

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const COPY = {
  pt: {
    switchToEnglish: 'Mudar para inglês',
    switchToPortuguese: 'Mudar para português',
    currentLanguageHint: (current: string) => `Idioma atual: ${current}. Toque para alternar.`,
    portuguese: 'português',
    english: 'inglês',
  },
  en: {
    switchToEnglish: 'Switch to English',
    switchToPortuguese: 'Switch to Portuguese',
    currentLanguageHint: (current: string) => `Current language: ${current}. Tap to switch.`,
    portuguese: 'Portuguese',
    english: 'English',
  },
} as const;

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
  const t = isPt ? COPY.pt : COPY.en;

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
      accessibilityLabel={isPt ? t.switchToEnglish : t.switchToPortuguese}
      accessibilityHint={t.currentLanguageHint(isPt ? t.portuguese : t.english)}
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
