import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { Button, Card } from "../../components/ui";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import { parseSlotDate, formatDateTimeRange } from "../../utils/date";
import {
  fetchClientUpcoming,
  fetchClientHistory,
  cancelClientAppointment,
} from "../../services/clientBooking";

const COPY = {
  pt: {
    title: "Agendamentos",
    newBooking: "Novo agendamento",
    upcoming: "Próximos",
    history: "Histórico",
    loading: "Carregando…",
    noUpcoming: "Nenhum agendamento futuro.",
    noHistory: "Nenhum histórico disponível.",
    loadMore: "Carregar mais",
    cancel: "Cancelar",
    cancelled: "Agendamento cancelado.",
    cancelFailed: "Não foi possível cancelar.",
    loadFailed: "Falha ao carregar agendamentos.",
    defaultService: "Serviço",
    defaultProfessional: "Profissional",
    status: {
      scheduled: "Agendado",
      completed: "Concluído",
      paid: "Pago",
      cancelled: "Cancelado",
    },
  },
  en: {
    title: "Appointments",
    newBooking: "New booking",
    upcoming: "Upcoming",
    history: "History",
    loading: "Loading…",
    noUpcoming: "No upcoming appointments.",
    noHistory: "No history available.",
    loadMore: "Load more",
    cancel: "Cancel",
    cancelled: "Appointment cancelled.",
    cancelFailed: "Could not cancel.",
    loadFailed: "Failed to load appointments.",
    defaultService: "Service",
    defaultProfessional: "Professional",
    status: {
      scheduled: "Scheduled",
      completed: "Completed",
      paid: "Paid",
      cancelled: "Cancelled",
    },
  },
};

function useStatusBadgeStyle(statusKey) {
  const { colors } = useTheme();
  return useMemo(() => {
    switch (statusKey) {
      case "completed":
        return { backgroundColor: colors.infoBackground, textColor: colors.info };
      case "paid":
        return { backgroundColor: colors.successBackground, textColor: colors.success };
      case "cancelled":
        return { backgroundColor: colors.errorBackground, textColor: colors.error };
      default:
        return { backgroundColor: colors.surface, textColor: colors.textSecondary };
    }
  }, [colors, statusKey]);
}

function AppointmentCard({ item, onCancel, showStatus, t }) {
  const { colors } = useTheme();
  const start = parseSlotDate(item?.slot?.start_time);
  const end = parseSlotDate(item?.slot?.end_time);
  const canCancel = item?.status === "scheduled";
  const statusKey = String(item?.status || "").toLowerCase();
  const badge = useStatusBadgeStyle(statusKey);

  return (
    <View style={styles.card}>
      <Card variant="default">
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.serviceName, { color: colors.textPrimary }]}>
              {item?.service?.name || t.defaultService}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {item?.professional?.name || t.defaultProfessional}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {formatDateTimeRange(start, end)}
          </Text>
        </View>
        {showStatus && (
          <View
            style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}
          >
            <Text style={{ color: badge.textColor, fontSize: 12, fontWeight: "600" }}>
              {t.status[statusKey] || item?.status}
            </Text>
          </View>
        )}
        {canCancel && (
          <Button variant="link" onPress={() => onCancel(item)}>
            {t.cancel}
          </Button>
        )}
      </Card>
    </View>
  );
}

export default function ClientAppointmentsScreen({ navigation }) {
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const t = COPY[language] || COPY.pt;

  const [activeTab, setActiveTab] = useState("upcoming");
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [upcomingHasMore, setUpcomingHasMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, h] = await Promise.all([
        fetchClientUpcoming(),
        fetchClientHistory(),
      ]);
      setUpcoming(u.results);
      setHistory(h.results);
      setUpcomingHasMore(u.hasMore);
      setHistoryHasMore(h.hasMore);
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

  const onCancel = async (item) => {
    try {
      await cancelClientAppointment(item.id);
      setUpcoming((prev) => prev.filter((x) => x.id !== item.id));
      setHistory((prev) => [{ ...item, status: "cancelled" }, ...prev]);
      showToast({ type: "success", message: t.cancelled });
    } catch {
      showToast({ type: "error", message: t.cancelFailed });
    }
  };

  const onLoadMoreUpcoming = async () => {
    const { results, hasMore } = await fetchClientUpcoming({ offset: upcoming.length });
    setUpcoming((prev) => [...prev, ...results]);
    setUpcomingHasMore(hasMore);
  };

  const onLoadMoreHistory = async () => {
    const { results, hasMore } = await fetchClientHistory({ offset: history.length });
    setHistory((prev) => [...prev, ...results]);
    setHistoryHasMore(hasMore);
  };

  const data = activeTab === "upcoming" ? upcoming : history;
  const hasMore = activeTab === "upcoming" ? upcomingHasMore : historyHasMore;
  const onLoadMore = activeTab === "upcoming" ? onLoadMoreUpcoming : onLoadMoreHistory;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={styles.headerActions}>
          <LanguageToggle
            language={language}
            onToggle={() => setLanguage(language === "pt" ? "en" : "pt")}
            size={18}
          />
          <ThemeToggle size={20} />
        </View>
      </View>

      <View style={styles.newBookingRow}>
        <Button variant="link" onPress={() => navigation.navigate("ClientBookingCreate")}>
          {t.newBooking}
        </Button>
      </View>

      <View style={styles.tabs}>
        <Button
          variant={activeTab === "upcoming" ? "primary" : "link"}
          onPress={() => setActiveTab("upcoming")}
        >
          {`${t.upcoming} (${upcoming.length}${upcomingHasMore ? "+" : ""})`}
        </Button>
        <Button
          variant={activeTab === "history" ? "primary" : "link"}
          onPress={() => setActiveTab("history")}
        >
          {`${t.history} (${history.length}${historyHasMore ? "+" : ""})`}
        </Button>
      </View>

      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 24 }}>{t.loading}</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              onCancel={onCancel}
              showStatus={activeTab === "history"}
              t={t}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, padding: 24 }}>
              {activeTab === "upcoming" ? t.noUpcoming : t.noHistory}
            </Text>
          }
          ListFooterComponent={
            hasMore ? (
              <Button variant="link" onPress={onLoadMore}>
                {t.loadMore}
              </Button>
            ) : null
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "700" },
  newBookingRow: { paddingHorizontal: 20, alignItems: "flex-end" },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  listContent: { padding: 20, gap: 12 },
  card: { marginBottom: 12 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  serviceName: { fontSize: 16, fontWeight: "600" },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
