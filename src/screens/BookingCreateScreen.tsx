import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { fetchSlots, fetchAvailableDates } from '../api/slots';
import { fetchCustomers } from '../api/customers';
import client from '../api/client';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { formatCurrency, parseSlotDate } from '../utils/date';
import { createAppointment } from '../api/bookings';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const BookingCreateScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Data lists
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selections
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const toISODate = (date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Step 1: Load Professionals for Service
  async function loadProfessionals(serviceId: number) {
    try {
      setLoading(true);
      const response = await client.get('public/professionals/', {
        params: { service_id: serviceId, limit: 100, tenant: slug },
        headers: { 'X-Tenant-Slug': slug }
      });
      const data = response.data;
      let results = Array.isArray(data) ? data : data.results || [];

      // Filtragem de segurança para Colaboradores
      // Se o usuário não for Admin/Manager, ele só pode ver/agendar para si mesmo
      if (userInfo && userInfo.role !== 'owner' && userInfo.role !== 'manager' && !userInfo.is_superuser) {
        results = results.filter((p: any) => 
          (p.user === userInfo.id) || 
          (p.email === userInfo.email) ||
          (p.staff_member === userInfo.id)
        );
      }

      setProfessionals(results);
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Load Slots for Professional and Date
  async function loadSlots(professionalId: number, date: Date) {
    try {
      if (!date || isNaN(date.getTime())) return;
      setLoading(true);
      const dateStr = toISODate(date);
      if (!dateStr) return;
      const response = await fetchSlots({
        professional_id: professionalId,
        date_from: `${dateStr}T00:00:00Z`,
        date_to: `${dateStr}T23:59:59Z`,
        is_available: true,
        limit: 100,
        slug
      } as any);
      setSlots(Array.isArray(response) ? response : response.results || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Load/Search Customers
  async function searchCustomers() {
    try {
      setLoadingCustomers(true);
      const data = await fetchCustomers({
        search: searchQuery,
        limit: 100,
        slug
      } as any);
      const results = Array.isArray(data) ? data : data.results || [];
      setCustomers(results);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  }

  // Carregar datas disponíveis quando o profissional é selecionado
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!selectedProfessional) return;
      try {
        const dates = await fetchAvailableDates({
          professional_id: selectedProfessional.id,
          slug
        });
        setAvailableDates(dates || []);

        // Se a data selecionada não tem slots, tenta selecionar a primeira disponível
        const dateStr = toISODate(selectedDate);
        if (dates && dates.length > 0 && (!dateStr || !dates.includes(dateStr))) {
          const firstAvail = parseSlotDate(dates[0]);
          if (firstAvail) {
            setSelectedDate(firstAvail);
            loadSlots(selectedProfessional.id, firstAvail);
          }
        }
      } catch (error) {
        console.error('Error loading available dates:', error);
      }
    };
    if (step === 2) loadAvailableDates();
  }, [selectedProfessional, step]);

  // Initial Load: Services
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const response = await client.get('public/services/', {
          params: { limit: 100, tenant: slug },
          headers: { 'X-Tenant-Slug': slug }
        });
        const data = response.data;
        setServices(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) loadServices();
  }, [slug]);

  useEffect(() => {
    if (step === 3) searchCustomers();
  }, [searchQuery, step]);

  const nextStep = () => {
    if (step === 0 && selectedService) {
      loadProfessionals(selectedService.id);
      setStep(1);
    } else if (step === 1 && selectedProfessional) {
      loadSlots(selectedProfessional.id, selectedDate);
      setStep(2);
    } else if (step === 2 && selectedSlot) {
      setStep(3);
    } else if (step === 3 && selectedCustomer) {
      setStep(4);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const payload = {
        professional: selectedProfessional.id,
        service: selectedService.id,
        customer: selectedCustomer.id,
        slot: selectedSlot.id,
        notes: notes,
        status: 'scheduled'
      };
      await createAppointment(payload, { slug: slug as string });
      Alert.alert('Sucesso', 'Agendamento criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Erro', 'Não foi possível criar o agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={step === 0 ? () => navigation.goBack() : prevStep} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
        {step === 4 ? 'Resumo' : 'Novo Agendamento'}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderServiceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Qual serviço deseja agendar?</Text>
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedService?.id === item.id ? colors.brandPrimary : colors.border
              }
            ]}
            onPress={() => setSelectedService(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                {item.duration_minutes} min • {formatCurrency(item.price_eur)}
              </Text>
            </View>
            {selectedService?.id === item.id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.brandPrimary} />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );

  const renderProfessionalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Com qual profissional?</Text>
      <FlatList
        data={professionals}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedProfessional?.id === item.id ? colors.brandPrimary : colors.border
              }
            ]}
            onPress={() => setSelectedProfessional(item)}
          >
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
            <Text style={[styles.itemName, { color: colors.textPrimary, flex: 1, marginLeft: 12 }]}>
              {item.name}
            </Text>
            {selectedProfessional?.id === item.id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.brandPrimary} />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );

  const renderDateStrip = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d);
    }

    return (
      <View style={{ marginBottom: 24 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dates}
          keyExtractor={(d) => toISODate(d) || Math.random().toString()}
          renderItem={({ item: d }) => {
            const dateStr = toISODate(d);
            const selectedDateStr = toISODate(selectedDate);
            const isSelected = selectedDateStr === dateStr;
            const hasSlots = dateStr ? availableDates.includes(dateStr) : false;

            return (
              <TouchableOpacity
                onPress={() => {
                  setSelectedDate(d);
                  loadSlots(selectedProfessional.id, d);
                  setSelectedSlot(null);
                }}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginRight: 8,
                  backgroundColor: isSelected ? colors.brandPrimary : colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.brandPrimary : colors.border,
                  opacity: hasSlots ? 1 : 0.5
                }}
              >
                <Text style={{
                  fontSize: 12,
                  color: isSelected ? '#fff' : colors.textSecondary,
                  marginBottom: 4,
                  fontWeight: '600'
                }}>
                  {d.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase()}
                </Text>
                <Text style={{
                  fontSize: 18,
                  color: isSelected ? '#fff' : colors.textPrimary,
                  fontWeight: '700'
                }}>
                  {d.getDate()}
                </Text>
                {hasSlots && !isSelected && (
                  <View style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.brandPrimary,
                    marginTop: 4
                  }} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const renderDateSlotStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Quando?</Text>

      {renderDateStrip()}

      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Ou escolha outra data</Text>
      <TouchableOpacity
        style={[styles.datePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.brandPrimary} />
        <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
          {selectedDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
              loadSlots(selectedProfessional.id, date);
              setSelectedSlot(null);
            }
          }}
        />
      )}

      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginTop: 32 }]}>Horários disponíveis</Text>
      <TimeSlotPicker
        slots={slots}
        selectedSlotId={selectedSlot?.id}
        onSlotSelect={setSelectedSlot}
        loading={loading}
      />
    </ScrollView>
  );

  const renderCustomerStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Para qual cliente?</Text>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar cliente por nome, email ou tel..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loadingCustomers ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.itemCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedCustomer?.id === item.id ? colors.brandPrimary : colors.border
                }
              ]}
              onPress={() => setSelectedCustomer(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                  {item.email || item.phone_number || 'Sem contato'}
                </Text>
              </View>
              {selectedCustomer?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.brandPrimary} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>
              Nenhum cliente encontrado.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );

  const renderSummaryStep = () => {
    const slotDate = parseSlotDate(selectedSlot?.start_time);
    const timeStr = slotDate ? slotDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    const dateStr = selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    return (
      <ScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Tudo certo?</Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Ionicons name="cut-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Serviço</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedService.name}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Profissional</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedProfessional.name}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Data e Hora</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{dateStr} às {timeStr}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Cliente</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedCustomer.name}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Valor</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatCurrency(selectedService.price_eur)}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginTop: 20 }]}>Notas (opcional)</Text>
        <TextInput
          style={[styles.notesInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Adicionar observações..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </ScrollView>
    );
  };

  const isNextDisabled = () => {
    if (step === 0) return !selectedService;
    if (step === 1) return !selectedProfessional;
    if (step === 2) return !selectedSlot;
    if (step === 3) return !selectedCustomer;
    return false;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {renderHeader()}

      <View style={{ flex: 1 }}>
        {step === 0 && renderServiceStep()}
        {step === 1 && renderProfessionalStep()}
        {step === 2 && renderDateSlotStep()}
        {step === 3 && renderCustomerStep()}
        {step === 4 && renderSummaryStep()}
      </View>

      {/* Footer Navigation */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step < 4 ? (
          <Button
            onPress={nextStep}
            disabled={isNextDisabled()}
            variant="link"
            size="lg"
            style={{ alignSelf: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: isNextDisabled() ? colors.textSecondary : colors.brandPrimary, fontWeight: '600', fontSize: 16 }}>
                Continuar
              </Text>
              <Ionicons name="chevron-forward" size={18} color={isNextDisabled() ? colors.textSecondary : colors.brandPrimary} />
            </View>
          </Button>
        ) : (
          <Button
            onPress={handleConfirm}
            loading={loading}
            variant="link"
            size="lg"
            style={{ alignSelf: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 16 }}>
                Confirmar Agendamento
              </Text>
              <Ionicons name="checkmark" size={18} color={colors.brandPrimary} />
            </View>
          </Button>
        )}
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
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetail: {
    fontSize: 13,
    marginTop: 4,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});

export default BookingCreateScreen;
