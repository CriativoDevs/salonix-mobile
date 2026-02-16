/**
 * SplashScreen.tsx
 * Initial splash screen with animated logo and navigation logic
 * 
 * Features:
 * - Fade in + scale animation (800ms)
 * - Check onboarding status
 * - Check authentication status
 * - Navigate to appropriate screen: Onboarding | Login | Home
 * 
 * Created: 11/02/2026
 * Related Issue: MOB-SCREEN-01 #27
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { hasSeenOnboarding } from '../utils/onboardingStorage';
import { useAuth } from '../hooks/useAuth';

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Logo animation: fade in + spring scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigation logic after 2.5 seconds
    const timer = setTimeout(async () => {
      try {
        const hasCompletedOnboarding = await hasSeenOnboarding();
        // Fluxo desejado (pós-login):
        // - Usuário não autenticado → Login (sempre)
        // - Autenticado e nunca viu onboarding → Onboarding (uma vez)
        // - Autenticado e já viu → Home
        if (!isAuthenticated) {
          navigation.replace('Login');
        } else if (!hasCompletedOnboarding) {
          navigation.replace('Onboarding');
        } else {
          navigation.replace('Home');
        }
      } catch (error) {
        console.error('[SplashScreen] Navigation error:', error);
        // Fallback to Login on error
        navigation.replace('Login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, fadeAnim, scaleAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* High-resolution logo from FEW (pwa-512.png) */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* App branding */}
        <Text style={styles.appName}>TimelyOne</Text>
        <Text style={styles.tagline}>Agende com inteligência</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6', // Primary blue (from DESIGN_SYSTEM.md)
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#e0e7ff', // Light blue tint
    fontWeight: '400',
    opacity: 0.9,
  },
});
