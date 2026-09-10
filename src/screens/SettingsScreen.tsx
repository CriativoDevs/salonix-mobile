import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';

const COPY = {
  pt: {
    title: 'Definições',
    subtitle: 'Configurações do negócio',
    sectionSettings: 'Definições',
    sectionProfile: 'Perfil',
    sectionApp: 'App',
    sectionOperations: 'Funcionamento',
    generalLink: 'Geral',
    notificationsLink: 'Notificações',
    creditsPlanLink: 'Créditos e Plano',
    brandingLink: 'Marca',
    marketingLink: 'Marketing por email',
    feedbackLink: 'Feedback',
    howItWorksLink: 'Como funciona',
    roadmapLink: 'Roadmap',
    businessHoursLink: 'Horário de Funcionamento',
    servicesLink: 'Serviços',
    inventoryLink: 'Estoque',
    slotsLink: 'Horários',
  },
  en: {
    title: 'Settings',
    subtitle: 'Business settings',
    sectionSettings: 'Settings',
    sectionProfile: 'Profile',
    sectionApp: 'App',
    sectionOperations: 'Operations',
    generalLink: 'General',
    notificationsLink: 'Notifications',
    creditsPlanLink: 'Credits and Plan',
    brandingLink: 'Branding',
    marketingLink: 'Email marketing',
    feedbackLink: 'Feedback',
    howItWorksLink: 'How it works',
    roadmapLink: 'Roadmap',
    businessHoursLink: 'Business Hours',
    servicesLink: 'Services',
    inventoryLink: 'Inventory',
    slotsLink: 'Slots',
  },
} as const;

type LinkRow = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  ownerOnly?: boolean;
  adminOnly?: boolean;
};

type Section = {
  key: string;
  title: string;
  links: LinkRow[];
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { userInfo } = useAuth() as any;
  const t = COPY.pt;

  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  const sections: Section[] = [
    {
      key: 'settings',
      title: t.sectionSettings,
      links: [
        { key: 'general', label: t.generalLink, icon: 'settings-outline', route: 'General' },
        { key: 'notifications', label: t.notificationsLink, icon: 'notifications-outline', route: 'Notifications' },
        { key: 'creditsPlan', label: t.creditsPlanLink, icon: 'card-outline', route: 'CreditsPlan', ownerOnly: true },
      ],
    },
    {
      key: 'profile',
      title: t.sectionProfile,
      links: [
        { key: 'branding', label: t.brandingLink, icon: 'image-outline', route: 'Branding' },
        { key: 'marketing', label: t.marketingLink, icon: 'mail-outline', route: 'Marketing', adminOnly: true },
      ],
    },
    {
      key: 'app',
      title: t.sectionApp,
      links: [
        { key: 'feedback', label: t.feedbackLink, icon: 'chatbubble-ellipses-outline', route: 'Feedback' },
        { key: 'howItWorks', label: t.howItWorksLink, icon: 'help-circle-outline', route: 'HowItWorks' },
        { key: 'roadmap', label: t.roadmapLink, icon: 'map-outline', route: 'Roadmap' },
      ],
    },
    {
      key: 'operations',
      title: t.sectionOperations,
      links: [
        { key: 'businessHours', label: t.businessHoursLink, icon: 'time-outline', route: 'BusinessHours' },
        { key: 'services', label: t.servicesLink, icon: 'cut-outline', route: 'Services' },
        { key: 'inventory', label: t.inventoryLink, icon: 'cube-outline', route: 'Inventory' },
        { key: 'slots', label: t.slotsLink, icon: 'calendar-outline', route: 'Slots' },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>{t.subtitle}</Text>

        {sections.map((section) => {
          const visibleLinks = section.links.filter(
            (link) => (!link.ownerOnly || isOwner(userInfo)) && (!link.adminOnly || isAdmin)
          );
          if (visibleLinks.length === 0) return null;

          return (
            <View key={section.key} style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
              {visibleLinks.map((link) => (
                <TouchableOpacity
                  key={link.key}
                  style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate(link.route as never)}
                >
                  <View style={styles.linkRowInfo}>
                    <Ionicons name={link.icon} size={20} color={colors.textPrimary} />
                    <Text style={[styles.linkRowText, { color: colors.textPrimary }]}>{link.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  linkRowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkRowText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
