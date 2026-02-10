import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'link', // PADRÃO: link (90% dos casos no FEW)
  size = 'md',
  loading = false,
  disabled = false,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;

  // Estilos de variante (baseado no DESIGN_SYSTEM.md)
  const variantStyles = {
    primary: styles.primaryBg,
    secondary: styles.secondaryBg,
    link: styles.linkBg,
  };

  // Estilos de tamanho (baseado no FEW FormButton.jsx)
  const sizeStyles = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  };

  // Border radius baseado no tamanho
  const borderRadiusStyles = {
    sm: styles.radiusLg,
    md: styles.radiusLg,
    lg: styles.radiusXl,
  };

  // Cores de texto por variante
  const textColorStyles = {
    primary: styles.textWhite,
    secondary: styles.textDark,
    link: styles.textPrimary,
  };

  // Tamanho do texto
  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textSm,
    lg: styles.textBase,
  };

  // Cor do ActivityIndicator por variante
  const spinnerColor = {
    primary: '#ffffff',
    secondary: '#0f172a',
    link: '#3b82f6',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.buttonBase,
        variantStyles[variant],
        sizeStyles[size],
        borderRadiusStyles[size],
        variant === 'secondary' && styles.secondaryBorder,
        isDisabled && styles.disabled,
        pressed && variant === 'link' && styles.linkPressed,
      ]}
    >
      {({ pressed }) => (
        <View style={styles.content}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={spinnerColor[variant]}
              style={styles.spinner}
            />
          )}
          <Text
            style={[
              styles.textMedium,
              textColorStyles[variant],
              textSizeStyles[size],
              pressed && variant === 'link' && styles.textUnderline,
            ]}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Backgrounds por variante
  primaryBg: {
    backgroundColor: '#3b82f6', // brand-primary
  },
  secondaryBg: {
    backgroundColor: '#f1f5f9', // gray-100
  },
  linkBg: {
    backgroundColor: 'transparent',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: '#e2e8f0', // brand-border
  },
  
  // Tamanhos (padding)
  sizeSm: {
    paddingHorizontal: 12, // px-3
    paddingVertical: 6,    // py-1.5
  },
  sizeMd: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8,    // py-2
  },
  sizeLg: {
    paddingHorizontal: 20, // px-5
    paddingVertical: 10,   // py-2.5
  },
  
  // Border radius
  radiusLg: {
    borderRadius: 8, // rounded-lg
  },
  radiusXl: {
    borderRadius: 12, // rounded-xl
  },
  
  // Text colors
  textWhite: {
    color: '#ffffff',
  },
  textDark: {
    color: '#0f172a', // brand-surfaceForeground
  },
  textPrimary: {
    color: '#3b82f6', // brand-primary
  },
  
  // Text sizes
  textMedium: {
    fontWeight: '500',
  },
  textSm: {
    fontSize: 14,
  },
  textBase: {
    fontSize: 16,
  },
  
  // Estados
  disabled: {
    opacity: 0.6,
  },
  linkPressed: {
    opacity: 0.8,
  },
  textUnderline: {
    textDecorationLine: 'underline',
  },
  
  spinner: {
    marginRight: 8,
  },
});
