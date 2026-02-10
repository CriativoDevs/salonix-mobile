import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  position?: ToastPosition;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 4000,
  position = 'top-right',
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss após duração
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose(id);
    });
  };

  // Cores baseadas no DESIGN_SYSTEM.md
  const colors = {
    success: {
      background: '#f0fdf4', // green-50
      border: '#10b981',     // emerald-500
      text: '#059669',       // emerald-600
      icon: '#10b981',       // emerald-500
    },
    error: {
      background: '#fef2f2', // rose-50
      border: '#ef4444',     // rose-600
      text: '#dc2626',       // rose-700
      icon: '#ef4444',       // rose-600
    },
    warning: {
      background: '#fffbeb', // amber-50
      border: '#f59e0b',     // amber-500
      text: '#d97706',       // amber-600
      icon: '#f59e0b',       // amber-500
    },
    info: {
      background: '#eff6ff', // blue-50
      border: '#3b82f6',     // blue-500
      text: '#2563eb',       // blue-600
      icon: '#3b82f6',       // blue-500
    },
  };

  const iconNames = {
    success: 'checkmark-circle' as const,
    error: 'close-circle' as const,
    warning: 'warning' as const,
    info: 'information-circle' as const,
  };

  const currentColors = colors[type];
  const iconName = iconNames[type];

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      zIndex: 50,
      ...(position === 'top-right' && { top: 50, right: 16 }),
      ...(position === 'top-left' && { top: 50, left: 16 }),
      ...(position === 'top-center' && { top: 50, alignSelf: 'center' }),
      ...(position === 'bottom-right' && { bottom: 50, right: 16 }),
      ...(position === 'bottom-left' && { bottom: 50, left: 16 }),
      ...(position === 'bottom-center' && { bottom: 50, alignSelf: 'center' }),
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8, // rounded-lg
      borderWidth: 1,
      borderColor: currentColors.border,
      backgroundColor: currentColors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      minWidth: 280,
      maxWidth: 400,
    },
    message: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: currentColors.text,
      flex: 1,
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.toast}>
        <Ionicons 
          name={iconName} 
          size={20} 
          color={currentColors.icon} 
        />
        <Text style={styles.message}>{message}</Text>
        <Pressable 
          onPress={handleClose}
          accessibilityLabel="Fechar notificação"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color={currentColors.icon} />
        </Pressable>
      </View>
    </Animated.View>
  );
};
