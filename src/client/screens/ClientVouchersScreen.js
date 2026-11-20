import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import * as Clipboard from "expo-clipboard";
import { Button } from "../../components/ui";
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
    copy: "Copiar",
    copyLabel: "Copiar código",
    copied: "Código copiado.",
    copyFailed: "Não foi possível copiar o código.",
    assignedOn: "Atribuído em",
    usedOn: "Usado em",
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
    copy: "Copy",
    copyLabel: "Copy code",
    copied: "Code copied.",
    copyFailed: "Could not copy the code.",
    assignedOn: "Assigned on",
    usedOn: "Used on",
    status: {
      active: "Active",
      used: "Used",
      expired: "Expired",
    },
  },
};

const NOTCH_SIZE = 20;

function formatDate(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "en" ? "en-US" : "pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

function VoucherCard({ item, t, language, onCopy }) {
  const { colors } = useTheme();
  const statusKey = String(item?.status || "").toLowerCase();
  const isActive = statusKey === "active";
  const badge = useStatusBadgeStyle(statusKey);
  const accent = isActive ? colors.brandPrimary : colors.disabled || colors.border;
  const assigned = formatDate(item?.assigned_at, language);
  const usedAt = statusKey === "used" ? formatDate(item?.used_at, language) : "";

  return (
    <View
      style={[
        styles.ticket,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !isActive && styles.ticketInactive,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />

      <View style={styles.ticketBody}>
        <View style={styles.topRow}>
          <Text style={[styles.benefit, { color: colors.textPrimary }]}>
            {describeVoucherBenefit(item, language)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={{ color: badge.textColor, fontSize: 12, fontWeight: "600" }}>
              {t.status[statusKey] || item?.status}
            </Text>
          </View>
        </View>

        <View style={styles.perforation}>
          <View
            style={[
              styles.notch,
              styles.notchLeft,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          />
          <View style={[styles.dashed, { borderColor: colors.border }]} />
          <View
            style={[
              styles.notch,
              styles.notchRight,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.codeBlock}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>{t.code}</Text>
            <Text
              selectable
              style={[styles.code, { color: isActive ? colors.brandPrimary : colors.textSecondary }]}
            >
              {item?.voucher_code}
            </Text>
          </View>
          {isActive ? (
            <Button
              variant="link"
              size="sm"
              onPress={() => onCopy(item?.voucher_code)}
              accessibilityLabel={`${t.copyLabel} ${item?.voucher_code}`}
            >
              {t.copy}
            </Button>
          ) : null}
        </View>

        {assigned || usedAt ? (
          <View style={styles.dates}>
            {assigned ? (
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {t.assignedOn} {assigned}
              </Text>
            ) : null}
            {usedAt ? (
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {t.usedOn} {usedAt}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
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

  const handleCopy = useCallback(
    async (code) => {
      try {
        await Clipboard.setStringAsync(String(code));
        showToast({ type: "success", message: t.copied });
      } catch {
        showToast({ type: "error", message: t.copyFailed });
      }
    },
    [showToast, t.copied, t.copyFailed]
  );

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
          renderItem={({ item }) => (
            <VoucherCard item={item} t={t} language={language} onCopy={handleCopy} />
          )}
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
  listContent: { padding: 20, gap: 14 },
  ticket: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  ticketInactive: { opacity: 0.7 },
  accent: { width: 6 },
  ticketBody: { flex: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  benefit: { flex: 1, fontSize: 18, fontWeight: "700" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  perforation: {
    height: NOTCH_SIZE,
    marginVertical: 10,
    marginHorizontal: -16,
    justifyContent: "center",
  },
  dashed: {
    marginHorizontal: NOTCH_SIZE / 2 + 6,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  notch: {
    position: "absolute",
    top: 0,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    borderWidth: 1,
  },
  notchLeft: { left: -NOTCH_SIZE / 2 - 1 },
  notchRight: { right: -NOTCH_SIZE / 2 - 1 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  codeBlock: { flexShrink: 1 },
  codeLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  code: { fontSize: 20, fontWeight: "700", letterSpacing: 2, fontVariant: ["tabular-nums"] },
  dates: { marginTop: 8, gap: 2 },
  dateText: { fontSize: 12 },
});
