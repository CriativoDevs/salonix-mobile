import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/Card';
import { fetchCmsPages, fetchCmsPage } from '../api/cms';

type CmsPageSummary = {
  slug: string;
  title: string;
  summary?: string;
};

type CmsPageDetail = CmsPageSummary & {
  content: string;
};

const COPY = {
  pt: {
    title: 'Como funciona',
    subtitle: 'Tudo o que precisa de saber sobre a plataforma.',
    error: 'Não foi possível carregar o conteúdo.',
    empty: 'Nenhum conteúdo disponível de momento.',
    detailError: 'Não foi possível carregar esta página.',
  },
  en: {
    title: 'How it works',
    subtitle: 'Everything you need to know about the platform.',
    error: 'Could not load the content.',
    empty: 'No content available at the moment.',
    detailError: 'Could not load this page.',
  },
};

// Ordena por número no início do título ("1. ...", "2. ..."), mesma lógica do FEW
// (o backend ordena por published_at, não pela numeração do título).
function sortPagesByTitleNumber(pages: CmsPageSummary[]) {
  const withIndex = pages.map((page, index) => ({ page, index }));
  withIndex.sort((a, b) => {
    const numA = parseInt(a.page.title?.match(/^(\d+)\./)?.[1] || '', 10);
    const numB = parseInt(b.page.title?.match(/^(\d+)\./)?.[1] || '', 10);
    const hasA = !Number.isNaN(numA);
    const hasB = !Number.isNaN(numB);
    if (hasA && hasB) return numA - numB;
    if (hasA) return -1;
    if (hasB) return 1;
    return a.index - b.index;
  });
  return withIndex.map(({ page }) => page);
}

function CmsPageRow({ page, slug, t }: { page: CmsPageSummary; slug?: string; t: typeof COPY.pt }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<CmsPageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail && !loading) {
      setLoading(true);
      setError(false);
      fetchCmsPage(page.slug, { slug })
        .then((data: CmsPageDetail) => setDetail(data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <Card>
        <TouchableOpacity onPress={handleToggle} style={styles.rowHeader} accessibilityRole="button">
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{page.title}</Text>
            {page.summary ? (
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                {page.summary}
              </Text>
            ) : null}
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {expanded && (
          <View style={[styles.rowExpanded, { borderTopColor: colors.border }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} />
            ) : error ? (
              <Text style={{ color: colors.error, fontSize: 13 }}>{t.detailError}</Text>
            ) : detail ? (
              <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20 }}>{detail.content}</Text>
            ) : null}
          </View>
        )}
      </Card>
    </View>
  );
}

export default function HowItWorksScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [pages, setPages] = useState<CmsPageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchCmsPages({ slug })
      .then((data: CmsPageSummary[]) => {
        if (cancelled) return;
        setPages(sortPagesByTitleNumber(Array.isArray(data) ? data : []));
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
  }, [slug]);

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
        ) : pages.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t.empty}</Text>
        ) : (
          pages.map((page) => <CmsPageRow key={page.slug} page={page} slug={slug} t={t} />)
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
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
