/**
 * ThemeContext - Gerenciamento de temas (light/dark) para React Native
 * Baseado na implementação do salonix-frontend-web
 * Adaptado para usar AsyncStorage ao invés de localStorage
 */

import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '../theme/colors';

// Temas disponíveis
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type Theme = typeof THEMES.LIGHT | typeof THEMES.DARK;

// Interface do contexto
export interface ThemeContextData {
  theme: Theme;
  colors: ThemeColors;
  isLoading: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Criação do contexto
export const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

// Constante para chave do AsyncStorage
const STORAGE_KEY = '@timelyOne:theme';

/**
 * ThemeProvider - Provedor do contexto de tema
 * 
 * Responsabilidades:
 * - Gerenciar estado do tema atual
 * - Persistir preferência no AsyncStorage
 * - Carregar tema salvo na inicialização
 * - Fornecer cores dinâmicas baseadas no tema
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(THEMES.LIGHT);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Carrega tema salvo do AsyncStorage
   */
  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTheme === THEMES.LIGHT || savedTheme === THEMES.DARK) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Erro ao carregar tema do AsyncStorage:', error);
      // Fallback: mantém o tema light (padrão)
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Salva tema no AsyncStorage
   */
  const saveTheme = useCallback(async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn('Erro ao salvar tema no AsyncStorage:', error);
    }
  }, []);

  /**
   * Altera o tema
   */
  const setTheme = useCallback(async (newTheme: Theme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.error('Tema inválido:', newTheme);
      return;
    }

    setThemeState(newTheme);
    await saveTheme(newTheme);
  }, [saveTheme]);

  /**
   * Toggle entre light e dark
   */
  const toggleTheme = useCallback(async () => {
    const newTheme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    await setTheme(newTheme);
  }, [theme, setTheme]);

  /**
   * Calcula cores baseadas no tema atual
   * Usa useMemo para evitar recriação desnecessária
   */
  const colors = useMemo<ThemeColors>(() => {
    return theme === THEMES.LIGHT ? lightColors : darkColors;
  }, [theme]);

  /**
   * Carrega tema salvo na inicialização
   */
  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const value: ThemeContextData = {
    theme,
    colors,
    isLoading,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
