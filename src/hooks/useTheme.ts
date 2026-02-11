/**
 * useTheme Hook - Facilita acesso ao ThemeContext
 * Baseado na implementação do salonix-frontend-web
 */

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Hook para acessar o contexto de tema
 * 
 * @throws {Error} Se usado fora do ThemeProvider
 * @returns {ThemeContextData} Dados do tema atual
 * 
 * @example
 * ```tsx
 * import { useTheme } from '@/hooks/useTheme';
 * 
 * function MyComponent() {
 *   const { theme, colors, toggleTheme } = useTheme();
 *   
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.textPrimary }}>Hello</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  
  return context;
};
