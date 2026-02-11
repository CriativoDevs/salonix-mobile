/**
 * Paletas de cores para temas claro e escuro
 * Baseado no DESIGN_SYSTEM.md do projeto TimelyOne
 */

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Borders & Dividers
  border: string;
  divider: string;
  
  // Brand
  brandPrimary: string;
  brandSecondary: string;
  
  // Semantic Colors
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Semantic Backgrounds (para componentes Alert)
  successBackground: string;
  errorBackground: string;
  warningBackground: string;
  infoBackground: string;
  
  // Interactive States
  pressed: string;
  disabled: string;
  placeholder: string;
}

/**
 * Paleta Light Mode
 * Cores atuais do app
 */
export const lightColors: ThemeColors = {
  // Backgrounds
  background: '#ffffff',        // white
  surface: '#f8fafc',          // slate-50
  surfaceVariant: '#f1f5f9',   // slate-100
  
  // Text
  textPrimary: '#0f172a',      // slate-900
  textSecondary: '#64748b',    // slate-500
  textTertiary: '#94a3b8',     // slate-400
  
  // Borders
  border: '#e2e8f0',           // slate-200
  divider: '#f1f5f9',          // slate-100
  
  // Brand
  brandPrimary: '#3b82f6',     // blue-500
  brandSecondary: '#64748b',   // slate-500
  
  // Semantic
  success: '#10b981',          // green-500
  error: '#ef4444',            // red-500
  warning: '#f59e0b',          // amber-500
  info: '#3b82f6',             // blue-500
  
  // Semantic Backgrounds
  successBackground: '#d1fae5', // green-100
  errorBackground: '#fee2e2',   // red-100
  warningBackground: '#fef3c7', // amber-100
  infoBackground: '#dbeafe',    // blue-100
  
  // Interactive
  pressed: 'rgba(15, 23, 42, 0.1)',  // slate-900 10%
  disabled: '#cbd5e1',               // slate-300
  placeholder: '#94a3b8',            // slate-400
};

/**
 * Paleta Dark Mode
 * Inversão de contraste com cores ajustadas para WCAG 2.1 AA
 */
export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0f172a',       // slate-900
  surface: '#1e293b',          // slate-800
  surfaceVariant: '#334155',   // slate-700
  
  // Text
  textPrimary: '#f1f5f9',      // slate-100
  textSecondary: '#94a3b8',    // slate-400
  textTertiary: '#64748b',     // slate-500
  
  // Borders
  border: '#334155',           // slate-700
  divider: '#1e293b',          // slate-800
  
  // Brand
  brandPrimary: '#60a5fa',     // blue-400 (mais claro para contraste)
  brandSecondary: '#94a3b8',   // slate-400
  
  // Semantic
  success: '#34d399',          // green-400
  error: '#f87171',            // red-400
  warning: '#fbbf24',          // amber-400
  info: '#60a5fa',             // blue-400
  
  // Semantic Backgrounds
  successBackground: '#064e3b', // green-900
  errorBackground: '#7f1d1d',   // red-900
  warningBackground: '#78350f', // amber-900
  infoBackground: '#1e3a8a',    // blue-900
  
  // Interactive
  pressed: 'rgba(241, 245, 249, 0.1)', // slate-100 10%
  disabled: '#475569',                  // slate-600
  placeholder: '#64748b',               // slate-500
};
