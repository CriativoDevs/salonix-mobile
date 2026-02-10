import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  // Cores baseadas no DESIGN_SYSTEM.md
  const colors = {
    info: {
      border: '#3b82f6',        // blue-500
      background: '#eff6ff',    // blue-50
      text: '#1e40af',          // blue-800
      icon: '#3b82f6',          // blue-500
    },
    success: {
      border: '#10b981',        // green-500
      background: '#f0fdf4',    // green-50
      text: '#059669',          // green-600
      icon: '#10b981',          // green-500
    },
    warning: {
      border: '#f59e0b',        // amber-500
      background: '#fffbeb',    // amber-50
      text: '#d97706',          // amber-600
      icon: '#f59e0b',          // amber-500
    },
    error: {
      border: '#ef4444',        // red-500
      background: '#fef2f2',    // red-50
      text: '#dc2626',          // red-600
      icon: '#ef4444',          // red-500
    },
  };

  // Ícones para cada tipo (Ionicons)
  const iconNames = {
    info: 'information-circle' as const,
    success: 'checkmark-circle' as const,
    warning: 'warning' as const,
    error: 'close-circle' as const,
  };

  const currentColor = colors[type];
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
