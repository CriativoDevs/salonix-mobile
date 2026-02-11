/**
 * onboardingStorage.ts
 * Utility for persisting onboarding state using AsyncStorage
 * 
 * Created: 11/02/2026
 * Related Issue: MOB-SCREEN-01 #27
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@timelyone:hasSeenOnboarding';

/**
 * Check if user has already seen the onboarding flow
 * @returns Promise<boolean> - true if user has seen onboarding, false otherwise
 */
export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('[OnboardingStorage] Error reading onboarding status:', error);
    return false; // Default to showing onboarding if error occurs
  }
};

/**
 * Mark that user has seen the onboarding
 * Called when user completes or skips onboarding
 * @returns Promise<void>
 */
export const setHasSeenOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('[OnboardingStorage] Onboarding marked as seen');
  } catch (error) {
    console.error('[OnboardingStorage] Error saving onboarding status:', error);
  }
};

/**
 * Reset onboarding state (useful for testing or debug)
 * @returns Promise<void>
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('[OnboardingStorage] Onboarding status reset');
  } catch (error) {
    console.error('[OnboardingStorage] Error resetting onboarding:', error);
  }
};
