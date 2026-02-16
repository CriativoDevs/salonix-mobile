import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/ui/Button';
import { PaginationDots } from '../components/ui/PaginationDots';
import { setHasSeenOnboarding } from '../utils/onboardingStorage';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Home: undefined;
};

type OnboardingNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Agende em Segundos',
    description: 'Encontre e agende serviços de beleza de forma rápida e fácil',
    icon: 'calendar-outline',
    color: '#3b82f6',
  },
  {
    id: '2',
    title: 'Gerencie sua Agenda',
    description: 'Visualize todos os seus agendamentos em um só lugar',
    icon: 'time-outline',
    color: '#10b981',
  },
  {
    id: '3',
    title: 'Receba Lembretes',
    description: 'Nunca mais perca um compromisso com notificações automáticas',
    icon: 'notifications-outline',
    color: '#f59e0b',
  },
  {
    id: '4',
    title: 'Pronto para Começar?',
    description: 'Crie sua conta e comece a agendar agora mesmo',
    icon: 'checkmark-circle-outline',
    color: '#8b5cf6',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isAuthenticated } = useAuth();

  const handleSkip = async () => {
    await setHasSeenOnboarding();
    navigation.replace(isAuthenticated ? 'Home' : 'Login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleGetStarted = async () => {
    await setHasSeenOnboarding();
    navigation.replace(isAuthenticated ? 'Home' : 'Login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={80} color={item.color} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Botão Pular (top-right) */}
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Pular</Text>
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Footer: Dots + Botão */}
      <View style={styles.footer}>
        <PaginationDots total={SLIDES.length} activeIndex={currentIndex} />

        <Button
          onPress={isLastSlide ? handleGetStarted : handleNext}
          variant="primary"
          size="lg"
        >
          {isLastSlide ? 'Começar' : 'Próximo'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    gap: 24,
  },
});
