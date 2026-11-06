import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { Button, Card } from "../../components/ui";
import { fetchClientVouchers } from "../../services/clientBooking";
import { describeVoucherBenefit } from "../../utils/voucherBenefit";

const COPY = {
  pt: {
    back: "Voltar",
    title: "Meus vouchers",
    loading: "Carregando vouchers…",
    empty: "Ainda não tens vouchers atribuídos.",
    loadFailed: "Falha ao carregar vouchers.",
    code: "Código",
    status: {
      active: "Ativo",
      used: "Usado",
      expired: "Expirado",
    },
  },
  en: {
    back: "Back",
    title: "My vouchers",
    loading: "Loading vouchers…",
    empty: "You don't have any vouchers assigned yet.",
    loadFailed: "Failed to load vouchers.",
    code: "Code",
    status: {
      active: "Active",
      used: "Used",
      expired: "Expired",
    },
  },
};

function useStatusBadgeStyle(statusKey) {
  const { colors } = useTheme();
  switch (statusKey) {
    case "used":
      return { backgroundColor: colors.infoBackground, textColor: colors.info };
    case "expired":
      return { backgroundColor: colors.errorBackground, textColor: colors.error };
    default:
      return { backgroundColor: colors.successBackground, textColor: colors.success };
  }
}

function VoucherCard({ item, t, language }) {
  const { colors } = useTheme();
  const statusKey = String(item?.status || "").toLowerCase();
  const badge = useStatusBadgeStyle(statusKey);

  return (
    <View style={styles.card}>
      <Card variant="default">
        <View style={styles.cardRow}>
          <Text style={[styles.code, { color: colors.textPrimary }]}>
            {t.code}: {item?.voucher_code}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={{ color: badge.textColor, fontSize: 12, fontWeight: "600" }}>
              {t.status[statusKey] || item?.status}
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
          {describeVoucherBenefit(item, language)}
        </Text>
      </Card>
    </View>
  );
}

export default function ClientVouchersScreen({ navigation }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const t = COPY[language] || COPY.pt;

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchClientVouchers();
      setVouchers(data);
    } catch {
      showToast({ type: "error", message: t.loadFailed });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, t.loadFailed]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Button variant="link" onPress={() => navigation.goBack()}>
          {t.back}
        </Button>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.title}</Text>
      </View>

      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 24 }}>{t.loading}</Text>
      ) : (
        <FlatList
          data={vouchers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <VoucherCard item={item} t={t} language={language} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, padding: 24 }}>{t.empty}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  listContent: { padding: 20, gap: 12 },
  card: { marginBottom: 12 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  code: { fontSize: 16, fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
