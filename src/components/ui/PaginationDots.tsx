/**
 * PaginationDots.tsx
 * Visual indicator for onboarding/carousel pagination
 * 
 * Features:
 * - Renders N dots based on total count
 * - Active dot is larger and colored
 * - Inactive dots are smaller and gray
 * - Smooth visual feedback
 * 
 * Created: 11/02/2026
 * Related Issue: MOB-SCREEN-01 #27
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PaginationDotsProps {
  total: number;
  activeIndex: number;
  dotColor?: string;
  activeDotColor?: string;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({
  total,
  activeIndex,
  dotColor = '#cbd5e1', // Cinza claro (gray-300)
  activeDotColor = '#3b82f6', // Azul primary
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === activeIndex ? activeDotColor : dotColor,
              width: index === activeIndex ? 24 : 8, // Ativo é 3x maior
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4, // Pills (metade da altura)
  },
});
