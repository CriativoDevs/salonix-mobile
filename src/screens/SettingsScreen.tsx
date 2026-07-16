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
    subtitle: 'Configurações do salão',
    businessHoursLink: 'Horário de Funcionamento',
    brandingLink: 'Marca',
    notificationsLink: 'Notificações',
    generalLink: 'Geral',
    reportsLink: 'Relatórios',
    creditsPlanLink: 'Créditos e Plano',
  },
  en: {
    title: 'Settings',
    subtitle: 'Salon configuration',
    businessHoursLink: 'Business Hours',
    brandingLink: 'Branding',
    notificationsLink: 'Notifications',
    generalLink: 'General',
    reportsLink: 'Reports',
    creditsPlanLink: 'Credits and Plan',
  },
} as const;

type LinkRow = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  ownerOnly?: boolean;
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { userInfo } = useAuth() as any;
  const t = COPY.pt;

  const links: LinkRow[] = [
    { key: 'businessHours', label: t.businessHoursLink, icon: 'time-outline', route: 'BusinessHours' },
    { key: 'branding', label: t.brandingLink, icon: 'image-outline', route: 'Branding' },
    { key: 'notifications', label: t.notificationsLink, icon: 'notifications-outline', route: 'Notifications' },
    { key: 'general', label: t.generalLink, icon: 'settings-outline', route: 'General' },
    { key: 'reports', label: t.reportsLink, icon: 'bar-chart-outline', route: 'Reports', ownerOnly: true },
    { key: 'creditsPlan', label: t.creditsPlanLink, icon: 'card-outline', route: 'CreditsPlan', ownerOnly: true },
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

        {links
          .filter((link) => !link.ownerOnly || isOwner(userInfo))
          .map((link) => (
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
