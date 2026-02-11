import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  closable = false,
  onClose,
}) => {
  const { colors } = useTheme();
  
  // Cores baseadas no tema
  const alertColors = {
    info: {
      border: colors.info,
      background: colors.infoBackground,
      text: colors.info,
      icon: colors.info,
    },
    success: {
      border: colors.success,
      background: colors.successBackground,
      text: colors.success,
      icon: colors.success,
    },
    warning: {
      border: colors.warning,
      background: colors.warningBackground,
      text: colors.warning,
      icon: colors.warning,
    },
    error: {
      border: colors.error,
      background: colors.errorBackground,
      text: colors.error,
      icon: colors.error,
    },
  };

  // Ícones para cada tipo (Ionicons)
  const iconNames = {
    info: 'information-circle' as const,
    success: 'checkmark-circle' as const,
    warning: 'warning' as const,
    error: 'close-circle' as const,
  };

  const currentColor = alertColors[type];
  const iconName = iconNames[type];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: currentColor.background,
      borderLeftWidth: 4,
      borderLeftColor: currentColor.border,
      borderRadius: 8,
      padding: 16,
      gap: 12,
    },
    iconContainer: {
      paddingTop: 2, // Alinhamento vertical com texto
    },
    contentContainer: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: currentColor.text,
      lineHeight: 20,
    },
    message: {
      fontSize: 14,
      color: currentColor.text,
      lineHeight: 20,
    },
    closeButton: {
      padding: 4,
      marginTop: -4,
      marginRight: -4,
    },
  });

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={20} color={currentColor.icon} />
      </View>

      {/* Content: Title + Message */}
      <View style={styles.contentContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>

      {/* Close Button (opcional) */}
      {closable && onClose && (
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel="Fechar alerta"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color={currentColor.text} />
        </Pressable>
      )}
    </View>
  );
};
