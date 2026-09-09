import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchRoadmap } from '../api/cms';

type RoadmapItem = {
  title: string;
  description: string;
  status: 'delivered' | 'in_progress' | 'planned';
  order: number;
};

const STATUS_ORDER: RoadmapItem['status'][] = ['delivered', 'in_progress', 'planned'];

const STATUS_ICON: Record<RoadmapItem['status'], keyof typeof Ionicons.glyphMap> = {
  delivered: 'checkmark-circle',
  in_progress: 'ellipse',
  planned: 'time-outline',
};

const COPY = {
  pt: {
    title: 'Roadmap',
    subtitle: 'O que já entregámos e o que vem a seguir.',
    error: 'Não foi possível carregar o roadmap.',
    empty: 'Nenhum item no roadmap de momento.',
    status: {
      delivered: 'Entregue',
      in_progress: 'Em progresso',
      planned: 'Planeado',
    },
  },
  en: {
    title: 'Roadmap',
    subtitle: 'What we have already delivered and what is coming next.',
    error: 'Could not load the roadmap.',
    empty: 'No roadmap items at the moment.',
    status: {
      delivered: 'Delivered',
      in_progress: 'In progress',
      planned: 'Planned',
    },
  },
};

export default function RoadmapScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchRoadmap()
      .then((data: RoadmapItem[]) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: items.filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0);

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

        {loading ? (
          <ActivityIndicator size="small" color={colors.brandPrimary} />
        ) : error ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t.error}</Text>
        ) : grouped.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t.empty}</Text>
        ) : (
          grouped.map((group) => (
            <View key={group.status} style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {t.status[group.status]}
              </Text>
              {group.items.map((item) => (
                <View
                  key={item.title}
                  style={[styles.itemRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Ionicons name={STATUS_ICON[group.status]} size={18} color={colors.brandPrimary} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{item.title}</Text>
                    {item.description ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{item.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
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
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
});
