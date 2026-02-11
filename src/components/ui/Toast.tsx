import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

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
  const { colors } = useTheme();
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

  // Cores baseadas no tema
  const toastColors = {
    success: {
      background: colors.successBackground,
      border: colors.success,
      text: colors.success,
      icon: colors.success,
    },
    error: {
      background: colors.errorBackground,
      border: colors.error,
      text: colors.error,
      icon: colors.error,
    },
    warning: {
      background: colors.warningBackground,
      border: colors.warning,
      text: colors.warning,
      icon: colors.warning,
    },
    info: {
      background: colors.infoBackground,
      border: colors.info,
      text: colors.info,
      icon: colors.info,
    },
  };

  const iconNames = {
    success: 'checkmark-circle' as const,
    error: 'close-circle' as const,
    warning: 'warning' as const,
    info: 'information-circle' as const,
  };

  const currentColors = toastColors[type];
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
