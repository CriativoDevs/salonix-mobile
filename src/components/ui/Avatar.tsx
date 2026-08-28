import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

function getInitials(name?: string | null): string {
  const tokens = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!tokens.length) return '?';
  return tokens.map((token) => token.charAt(0).toUpperCase()).join('');
}

// Baseado em Avatar.jsx do FEW: mostra a foto quando disponível, caso
// contrário exibe as iniciais do nome como fallback.
export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, style, testID }) => {
  const { colors } = useTheme();
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        testID={testID}
        source={{ uri }}
        style={[styles.image, dimensionStyle, style]}
      />
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.placeholder,
        dimensionStyle,
        { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.initials, { color: colors.textSecondary, fontSize: size * 0.4 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  initials: {
    fontWeight: '600',
  },
});
