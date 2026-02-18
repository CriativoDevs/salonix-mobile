import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { fetchAppointmentDetail, cancelAppointment, updateAppointment } from '../api/bookings';
import { parseSlotDate, formatDateTimeRange, formatCurrency } from '../utils/date';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluido',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

const BookingDetailScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { id } = route?.params || {};

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchAppointmentDetail(id, { slug });
      setAppointment(data);
    } catch (error) {
      console.error('Error fetching appointment detail:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do agendamento.');
    } finally {
      setLoading(false);
    }
  }, [id, slug]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar Agendamento',
      'Tem certeza que deseja cancelar este agendamento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await cancelAppointment(id, { slug });
              Alert.alert('Sucesso', 'Agendamento cancelado com sucesso.');
              loadData(); // Reload to show updated status
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Erro', 'Falha ao cancelar agendamento.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsCompleted = async () => {
    try {
      setActionLoading(true);
      await updateAppointment(id, { status: 'completed' }, { slug });
      Alert.alert('Sucesso', 'Agendamento marcado como concluído.');
      loadData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Erro', 'Falha ao atualizar agendamento.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const statusKey = String(appointment?.status || 'scheduled').toLowerCase();

  const badgeStyles = useMemo(() => {
    switch (statusKey) {
      case 'completed':
        return { borderColor: colors.info, backgroundColor: colors.infoBackground, textColor: colors.info };
      case 'paid':
        return { borderColor: colors.success, backgroundColor: colors.successBackground, textColor: colors.success };
      case 'cancelled':
        return { borderColor: colors.error, backgroundColor: colors.errorBackground, textColor: colors.error };
      case 'scheduled':
      default:
        return { borderColor: colors.success, backgroundColor: colors.successBackground, textColor: colors.success };
    }
  }, [colors, statusKey]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Detalhes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Detalhes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Agendamento não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = parseSlotDate(appointment.slot?.start_time || appointment.slot_start);
  const endDate = parseSlotDate(appointment.slot?.end_time || appointment.slot_end);
  const rangeLabel = formatDateTimeRange(startDate, endDate);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Detalhes</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
        >
          {/* Status Badge */}
          <View style={styles.statusSection}>
            <View
              style={[
                styles.badge,
                { borderColor: badgeStyles.borderColor, backgroundColor: badgeStyles.backgroundColor },
              ]}
            >
              <Text style={[styles.badgeText, { color: badgeStyles.textColor }]}>
                {STATUS_LABELS[statusKey]?.toUpperCase() || statusKey.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.rangeText, { color: colors.textSecondary }]}>{rangeLabel}</Text>
          </View>

          {/* Info Cards */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>CLIENTE</Text>
            <View style={styles.infoRow}>
              <View>
                <Text style={[styles.mainInfo, { color: colors.textPrimary }]}>
                  {appointment.customer?.name || appointment.client_username || 'Cliente'}
                </Text>
                {appointment.customer?.phone_number && (
                  <TouchableOpacity
                    onPress={() => handleCall(appointment.customer.phone_number)}
                    style={styles.contactRow}
                  >
                    <Ionicons name="call-outline" size={16} color={colors.brandPrimary} />
                    <Text style={[styles.subInfo, { color: colors.brandPrimary, marginLeft: 6 }]}>
                      {appointment.customer.phone_number}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>SERVIÇO</Text>
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mainInfo, { color: colors.textPrimary }]}>
                  {appointment.service?.name || 'Serviço'}
                </Text>
                <Text style={[styles.subInfo, { color: colors.textSecondary }]}>
                  {appointment.service?.duration_minutes || '--'} min •{' '}
                  {formatCurrency(appointment.service?.price_eur ?? 0)}
                </Text>
              </View>
              <Ionicons name="cut-outline" size={24} color={colors.textSecondary} />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>PROFISSIONAL</Text>
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mainInfo, { color: colors.textPrimary }]}>
                  {appointment.professional?.name || 'Profissional'}
                </Text>
              </View>
              <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
            </View>
          </View>

          {appointment.notes && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>NOTAS</Text>
              <Text style={[styles.notesText, { color: colors.textPrimary }]}>{appointment.notes}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.actionsSection}>
          {statusKey === 'scheduled' && (
            <>
              <TouchableOpacity
                onPress={handleMarkAsCompleted}
                disabled={actionLoading}
                style={styles.linkAction}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.brandPrimary} />
                ) : (
                  <Text style={[styles.linkTextPrimary, { color: colors.brandPrimary }]}>
                    Marcar como Concluído
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancel}
                disabled={actionLoading}
                style={styles.linkAction}
              >
                <Text style={[styles.linkTextSecondary, { color: colors.error }]}>
                  Cancelar Agendamento
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainInfo: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  subInfo: {
    fontSize: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsSection: {
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  linkAction: {
    paddingVertical: 6,
  },
  linkTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
  },
  linkTextSecondary: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default BookingDetailScreen;
