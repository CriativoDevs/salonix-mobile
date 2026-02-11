/**
 * ThemeToggle - Botão para alternar entre light e dark mode
 * Baseado no SimpleThemeToggle.jsx do salonix-frontend-web
 * Adaptado para React Native
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  size?: number;
  className?: string; // Para compatibilidade futura com NativeWind
}

/**
 * Componente de toggle de tema
 * 
 * Exibe ícone de sol (light mode) ou lua (dark mode)
 * Alterna entre temas ao pressionar
 * 
 * @example
 * ```tsx
 * // No Header
 * <ThemeToggle />
 * 
 * // Com tamanho customizado
 * <ThemeToggle size={28} />
 * ```
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 24,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isDark 
            ? colors.surfaceVariant
            : colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      accessibilityHint={`Tema atual: ${isDark ? 'escuro' : 'claro'}. Toque para alternar.`}
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={size}
        color={isDark ? '#fbbf24' : colors.textSecondary}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
});

export default ThemeToggle;
