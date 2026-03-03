import React, { useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Fade in overlay + scale in modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out overlay + scale out modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  // Tamanhos do modal (baseado no DESIGN_SYSTEM.md)
  const widthPercentages: Record<'sm' | 'md' | 'lg', `${number}%`> = {
    sm: '90%',  // 90% da largura da tela
    md: '80%',  // 80% da largura (padrão)
    lg: '95%',  // 95% da largura
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // 50% opacity
      // Adiciona padding bottom para garantir que a navegação do Android não cubra o modal
      // Especialmente útil em builds de produção onde o layout é full-screen
      paddingBottom: Platform.OS === 'android' ? 24 : 0, 
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16, // rounded-2xl
      padding: 24, // p-6
      maxHeight: Dimensions.get('window').height * 0.8, // Max 80% da tela
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10, // Android shadow
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    headerContent: {
      flex: 1,
      marginRight: 16,
    },
    title: {
      fontSize: 20, // text-xl
      fontWeight: '700', // font-bold
      color: colors.textPrimary,
      marginBottom: 4,
    },
    description: {
      fontSize: 14, // text-sm
      color: colors.textSecondary,
      lineHeight: 20,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      marginBottom: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 8,
    },
  });

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none" // Usamos Animated API personalizada
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  width: widthPercentages[size],
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* Header: Title + Close Button */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  {title && <Text style={styles.title}>{title}</Text>}
                  {description && (
                    <Text style={styles.description}>{description}</Text>
                  )}
                </View>
                <Pressable
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityLabel="Fechar modal"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Content (scrollable) */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {children}
              </ScrollView>

              {/* Footer (optional actions) */}
              {footer && <View style={styles.footer}>{footer}</View>}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
