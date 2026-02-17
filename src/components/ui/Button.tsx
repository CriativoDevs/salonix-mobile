import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'link', // PADRÃO: link (90% dos casos no FEW)
  size = 'md',
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

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

  // Tamanho do texto
  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textSm,
    lg: styles.textBase,
  };

  // Cor do ActivityIndicator por variante
  const spinnerColor = {
    primary: '#ffffff',
    secondary: colors.textPrimary,
    link: colors.brandPrimary,
  };

  // Estilos dinâmicos baseados no tema
  const dynamicStyles = {
    primaryBg: { backgroundColor: colors.brandPrimary },
    secondaryBg: { backgroundColor: colors.surfaceVariant },
    secondaryBorder: { borderWidth: 1, borderColor: colors.border },
    textDark: { color: colors.textPrimary },
    textPrimary: { color: colors.brandPrimary },
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
        variant === 'primary' && dynamicStyles.primaryBg,
        variant === 'secondary' && dynamicStyles.secondaryBg,
        variant === 'link' && styles.linkBg,
        sizeStyles[size],
        borderRadiusStyles[size],
        variant === 'secondary' && dynamicStyles.secondaryBorder,
        isDisabled && styles.disabled,
        pressed && variant === 'link' && !isDisabled && styles.linkPressed,
        style,
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
              variant === 'primary' && styles.textWhite,
              variant === 'secondary' && dynamicStyles.textDark,
              variant === 'link' && dynamicStyles.textPrimary,
              textSizeStyles[size],
              pressed && variant === 'link' && !isDisabled && styles.textUnderline,
              isDisabled && variant === 'link' && { opacity: 0.3 },
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
  linkBg: {
    backgroundColor: 'transparent',
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
