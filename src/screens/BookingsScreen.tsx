import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import useBookings from '../hooks/useBookings';
import BookingCard from '../components/BookingCard';
import { BookingFilters } from '../components/BookingFilters';
import { BookingListHeader } from '../components/BookingListHeader';
import client from '../api/client';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { isOwner } from '../utils/permissions';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { MonthView } from '../components/calendar/MonthView';
import { ImportAppointmentsModal } from '../components/ImportAppointmentsModal';
import { exportAppointmentsCSV } from '../api/bookings';
import { saveAndShareCSV } from '../utils/csvFileSharing';
import { BookingItem } from '../hooks/bookingsShared';
import { useToast } from '../contexts/ToastContext';
import { ActionMenu } from '../components/ui/ActionMenu';

interface BookingFiltersState {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string | number;
}

const COPY = {
  pt: {
    exportError: 'Erro',
    exportErrorMessage: 'Não foi possível exportar os agendamentos.',
    cancelSuccess: 'Agendamento cancelado com sucesso',
    cancelError: 'Erro',
    cancelErrorMessage: 'Falha ao cancelar agendamento',
    emptyTitle: 'Nenhum agendamento encontrado',
    emptyHintFiltered: 'Tente ajustar os filtros',
    emptyHintDefault: 'Clique em + para criar um novo agendamento',
    viewAgenda: 'Agenda',
    viewDay: 'Dia',
    viewWeek: 'Semana',
    viewMonth: 'Mês',
    cancelModalTitle: 'Cancelar Agendamento',
    cancelModalMessage: 'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.',
    no: 'Não',
    yesCancel: 'Sim, Cancelar',
    importExportTitle: 'Importar/Exportar',
    importCsv: 'Importar CSV',
    exportCsv: 'Exportar CSV',
  },
  en: {
    exportError: 'Error',
    exportErrorMessage: 'Could not export the appointments.',
    cancelSuccess: 'Appointment cancelled successfully',
    cancelError: 'Error',
    cancelErrorMessage: 'Failed to cancel appointment',
    emptyTitle: 'No appointments found',
    emptyHintFiltered: 'Try adjusting the filters',
    emptyHintDefault: 'Tap + to create a new appointment',
    viewAgenda: 'Agenda',
    viewDay: 'Day',
    viewWeek: 'Week',
    viewMonth: 'Month',
    cancelModalTitle: 'Cancel Appointment',
    cancelModalMessage: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
    no: 'No',
    yesCancel: 'Yes, Cancel',
    importExportTitle: 'Import/Export',
    importCsv: 'Import CSV',
    exportCsv: 'Export CSV',
  },
} as const;

const BookingsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BookingFiltersState>({});

  // Data from hook
  const {
    appointments,
    totalCount,
    loading,
    loadingMore,
    error,
    customers,
    refetch,
    loadMore,
  } = useBookings(filters);

  // Modal state for cancellation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);

  // Ref to track if we're already loading more
  const isLoadingMore = useRef(false);

  type CalendarViewMode = 'agenda' | 'day' | 'week' | 'month';
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importExportMenuVisible, setImportExportMenuVisible] = useState(false);

  const handleExportCSV = async () => {
    try {
      const content = await exportAppointmentsCSV({ slug });
      await saveAndShareCSV(content, 'agendamentos.csv');
    } catch (err) {
      console.error('Error exporting appointments:', err);
      Alert.alert(t.exportError, t.exportErrorMessage);
    }
  };

  const handleImportExport = () => {
    setImportExportMenuVisible(true);
  };

  const handleImportSuccess = () => {
    refetch();
  };

  const handlePressCalendarAppointment = (appointment: BookingItem) => {
    navigation.navigate('BookingDetail', { id: appointment.id });
  };

  const handleSelectMonthDay = (date: Date) => {
    setReferenceDate(date);
    setViewMode('day');
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFiltersChange = (newFilters: BookingFiltersState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  const handleCardPress = (appointmentId: string) => {
    navigation.navigate('BookingDetail', { id: appointmentId });
  };

  const handleCardAction = (appointmentId: string, action: 'details' | 'cancel') => {
    if (action === 'details') {
      navigation.navigate('BookingDetail', { id: appointmentId });
    } else if (action === 'cancel') {
      setSelectedAppointmentId(appointmentId);
      setShowCancelModal(true);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointmentId) return;

    setCancellingAppointmentId(selectedAppointmentId);
    try {
      await client.patch(
        `/api/appointments/${selectedAppointmentId}/`,
        { status: 'cancelled' },
        { params: { 'X-Tenant-Slug': slug } }
      );

      // Refresh the list
      refetch();

      showToast({ type: 'success', message: t.cancelSuccess });
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      Alert.alert(t.cancelError, t.cancelErrorMessage);
    } finally {
      setCancellingAppointmentId(null);
      setShowCancelModal(false);
      setSelectedAppointmentId(null);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && !isLoadingMore.current) {
      isLoadingMore.current = true;
      loadMore();
      // Reset flag after a short delay
      setTimeout(() => {
        isLoadingMore.current = false;
      }, 500);
    }
  };

  const hasActiveFilters = Boolean(
    filters.status || filters.dateFrom || filters.dateTo || filters.customerId
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      );
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 8 }}>
          {t.emptyTitle}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {hasActiveFilters ? t.emptyHintFiltered : t.emptyHintDefault}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={{ paddingVertical: 16, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.brandPrimary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Filter Section */}
      {showFilters && (
        <View style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16 }}>
          <BookingFilters
            filters={filters}
            customers={customers}
            onFiltersChange={handleFiltersChange}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </View>
      )}

      {/* Header */}
      <View style={{ paddingHorizontal: 16 }}>
        <BookingListHeader
          totalCount={totalCount}
          onToggleFilters={handleToggleFilters}
          onAdd={() => navigation.navigate('BookingCreate')}
          onImportExport={handleImportExport}
          filtersActive={hasActiveFilters}
          showImportExport={isOwner(userInfo)}
        />
      </View>

      {/* Calendar view mode toggle */}
      <View style={styles.viewModeRow}>
        {(['agenda', 'day', 'week', 'month'] as CalendarViewMode[]).map((mode) => {
          const label =
            mode === 'agenda' ? t.viewAgenda : mode === 'day' ? t.viewDay : mode === 'week' ? t.viewWeek : t.viewMonth;
          const active = viewMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.viewModeButton,
                { backgroundColor: active ? colors.brandPrimary : 'transparent' },
              ]}
            >
              <Text style={{ color: active ? colors.surface : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content: Agenda list or calendar views */}
      {viewMode === 'agenda' && (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <BookingCard
                appointment={item}
                onPress={() => handleCardPress(item.id.toString())}
                onAction={(action) => handleCardAction(item.id.toString(), action)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.brandPrimary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          scrollEventThrottle={16}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          referenceDate={referenceDate}
          onChangeReferenceDate={setReferenceDate}
          onPressAppointment={handlePressCalendarAppointment}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          referenceDate={referenceDate}
          onChangeReferenceDate={setReferenceDate}
          onPressAppointment={handlePressCalendarAppointment}
        />
      )}

      {viewMode === 'month' && (
        <MonthView referenceDate={referenceDate} onSelectDay={handleSelectMonthDay} />
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 20,
              width: '85%',
              maxWidth: 300,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>
              {t.cancelModalTitle}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
              {t.cancelModalMessage}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.textSecondary,
                  opacity: pressed ? 0.7 : 1,
                })}
                onPress={() => setShowCancelModal(false)}
                disabled={cancellingAppointmentId !== null}
              >
                <Text style={{ textAlign: 'center', color: colors.textPrimary, fontWeight: '600' }}>
                  {t.no}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: pressed || cancellingAppointmentId !== null ? 0.7 : 1,
                })}
                onPress={handleConfirmCancel}
                disabled={cancellingAppointmentId !== null}
              >
                {cancellingAppointmentId ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={{ textAlign: 'center', color: colors.surface, fontWeight: '600' }}>
                    {t.yesCancel}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ImportAppointmentsModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
        slug={slug}
      />

      <ActionMenu
        visible={importExportMenuVisible}
        onClose={() => setImportExportMenuVisible(false)}
        title={t.importExportTitle}
        options={[
          { label: t.importCsv, onPress: () => setImportModalVisible(true) },
          { label: t.exportCsv, onPress: handleExportCSV },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  viewModeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});

export default BookingsScreen;
