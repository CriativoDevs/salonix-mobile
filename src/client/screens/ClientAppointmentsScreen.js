import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../contexts/ToastContext";
import { Button, Card } from "../../components/ui";
import { parseSlotDate, formatDateTimeRange } from "../../utils/date";
import {
  fetchClientUpcoming,
  fetchClientHistory,
  cancelClientAppointment,
} from "../../services/clientBooking";

function AppointmentCard({ item, onCancel, showStatus }) {
  const { colors } = useTheme();
  const start = parseSlotDate(item?.slot?.start_time);
  const end = parseSlotDate(item?.slot?.end_time);
  const canCancel = item?.status === "scheduled";

  return (
    <View style={styles.card}>
    <Card variant="default">
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.serviceName, { color: colors.textPrimary }]}>
            {item?.service?.name || "Serviço"}
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {item?.professional?.name || "Profissional"}
          </Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {formatDateTimeRange(start, end)}
        </Text>
      </View>
      {showStatus && (
        <Text style={[styles.statusBadge, { color: colors.brandPrimary }]}>
          {item?.status}
        </Text>
      )}
      {canCancel && (
        <Button variant="link" onPress={() => onCancel(item)}>
          Cancelar
        </Button>
      )}
    </Card>
    </View>
  );
}

export default function ClientAppointmentsScreen({ navigation }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
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
      showToast({ type: "error", message: "Falha ao carregar agendamentos." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

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
      showToast({ type: "success", message: "Agendamento cancelado." });
    } catch {
      showToast({ type: "error", message: "Não foi possível cancelar." });
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Agendamentos</Text>
        <Button variant="link" onPress={() => navigation.navigate("ClientBookingCreate")}>
          Novo agendamento
        </Button>
      </View>

      <View style={styles.tabs}>
        <Button
          variant={activeTab === "upcoming" ? "primary" : "link"}
          onPress={() => setActiveTab("upcoming")}
        >
          {`Próximos (${upcoming.length}${upcomingHasMore ? "+" : ""})`}
        </Button>
        <Button
          variant={activeTab === "history" ? "primary" : "link"}
          onPress={() => setActiveTab("history")}
        >
          {`Histórico (${history.length}${historyHasMore ? "+" : ""})`}
        </Button>
      </View>

      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 24 }}>Carregando…</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              onCancel={onCancel}
              showStatus={activeTab === "history"}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, padding: 24 }}>
              {activeTab === "upcoming"
                ? "Nenhum agendamento futuro."
                : "Nenhum histórico disponível."}
            </Text>
          }
          ListFooterComponent={
            hasMore ? (
              <Button variant="link" onPress={onLoadMore}>
                Carregar mais
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
  title: { fontSize: 24, fontWeight: "700" },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  listContent: { padding: 20, gap: 12 },
  card: { marginBottom: 12 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  serviceName: { fontSize: 16, fontWeight: "600" },
  statusBadge: { marginTop: 6, fontSize: 12, fontWeight: "600" },
});
