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
      justifyContent: 'center', // Centraliza verticalmente
      alignItems: 'center', // Centraliza horizontalmente
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // 50% opacity
      padding: 24, // Margem segura ao redor do modal
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16, // rounded-2xl
      width: '100%', // Ocupa a largura disponível (controlada pelo maxWidth abaixo)
      maxWidth: 500, // Limite para tablets
      maxHeight: Dimensions.get('window').height * 0.85, // Max 85% da tela
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10, // Android shadow
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 24, // Padding interno do header
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    scrollContent: {
      padding: 24, // Padding interno do conteúdo scrollável
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      padding: 24, // Padding interno do footer
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
                  transform: [{ scale: scaleAnim }],
                  // Ajuste de largura responsiva
                  width: widthPercentages[size],
                },
              ]}
            >
              {/* Header Fixo */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  {title && <Text style={styles.title}>{title}</Text>}
                  {description && (
                    <Text style={styles.description}>{description}</Text>
                  )}
                </View>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Conteúdo Scrollável */}
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>

              {/* Footer Fixo (se houver) */}
              {footer && (
                <View style={styles.footer}>
                  {footer}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
