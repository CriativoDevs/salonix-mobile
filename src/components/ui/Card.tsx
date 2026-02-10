import React from 'react';
import { View, Pressable, ViewProps, StyleSheet } from 'react-native';

interface CardProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  ...props
}) => {
  // Baseado em StatCard.jsx e Card.jsx do FEW
  const shadowStyle = variant === 'elevated' ? styles.shadowElevated : styles.shadowDefault;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardBase,
          shadowStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.cardBase, shadowStyle]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: '#ffffff', // bg-brand-surface
    borderRadius: 12, // rounded-xl
    padding: 20, // p-5 (20px)
    borderWidth: 1,
    borderColor: '#e2e8f0', // border-brand-border
  },
  
  // Shadow default (sombra sutil)
  shadowDefault: {
    // iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Android
    elevation: 1,
  },
  
  // Shadow elevated (sombra maior - hover effect)
  shadowElevated: {
    // iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android
    elevation: 4,
  },
  
  // Estado pressed (quando clicável)
  pressed: {
    opacity: 0.9,
  },
});
