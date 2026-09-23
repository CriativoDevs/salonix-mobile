import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Input } from './ui/Input';
import { DatePickerInput } from './DatePickerInput';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    statusAll: 'Todos',
    statusScheduled: 'Agendado',
    statusCompleted: 'Concluido',
    statusPaid: 'Pago',
    statusCancelled: 'Cancelado',
    filters: 'Filtros',
    dateFrom: 'Data inicial',
    dateTo: 'Data final',
    selectDate: 'Selecione uma data',
    client: 'Cliente',
    searchClient: 'Buscar cliente',
    clear: 'Limpar',
    applyFilters: 'Aplicar filtros',
  },
  en: {
    statusAll: 'All',
    statusScheduled: 'Scheduled',
    statusCompleted: 'Completed',
    statusPaid: 'Paid',
    statusCancelled: 'Cancelled',
    filters: 'Filters',
    dateFrom: 'Start date',
    dateTo: 'End date',
    selectDate: 'Select a date',
    client: 'Client',
    searchClient: 'Search client',
    clear: 'Clear',
    applyFilters: 'Apply filters',
  },
} as const;

type BookingFiltersState = {
  status?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  customerId?: string | number | null;
};

type BookingFiltersProps = {
  filters: BookingFiltersState;
  customers: Array<{ id: string | number; name: string }>;
  onFiltersChange: (next: BookingFiltersState) => void;
  onApply?: () => void;
  onClear?: () => void;
};

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  customers,
  onFiltersChange,
  onApply,
  onClear,
}) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const STATUS_OPTIONS = [
    { value: '', label: t.statusAll },
    { value: 'scheduled', label: t.statusScheduled },
    { value: 'completed', label: t.statusCompleted },
    { value: 'paid', label: t.statusPaid },
    { value: 'cancelled', label: t.statusCancelled },
  ];
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomers, setShowCustomers] = useState(false);

  const selectedCustomer = useMemo(() => {
    if (!filters.customerId) return null;
    return customers.find((c) => String(c.id) === String(filters.customerId)) || null;
  }, [customers, filters.customerId]);

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) return customers.slice(0, 10);
    return customers
      .filter((c) => c.name?.toLowerCase().includes(query))
      .slice(0, 10);
  }, [customerQuery, customers]);

  const updateFilters = (patch: Partial<BookingFiltersState>) => {
    onFiltersChange({
      ...filters,
      ...patch,
    });
  };

  const handleClear = () => {
    onFiltersChange({
      status: '',
      dateFrom: '',
      dateTo: '',
      customerId: null,
    });
    setCustomerQuery('');
    setShowCustomers(false);
    onClear?.();
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 10 }}>
        {t.filters}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {STATUS_OPTIONS.map((option) => {
          const isActive = (filters.status || '') === option.value;
          return (
            <TouchableOpacity
              key={option.value || 'all'}
              onPress={() => updateFilters({ status: option.value })}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isActive ? colors.brandPrimary : colors.border,
                backgroundColor: isActive ? colors.infoBackground : colors.surface,
              }}
            >
              <Text style={{ color: isActive ? colors.brandPrimary : colors.textSecondary, fontSize: 12 }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date Fields */}
      <DatePickerInput
        label={t.dateFrom}
        placeholder={t.selectDate}
        value={filters.dateFrom || ''}
        onDateChange={(date) => updateFilters({ dateFrom: date })}
      />

      <DatePickerInput
        label={t.dateTo}
        placeholder={t.selectDate}
        value={filters.dateTo || ''}
        onDateChange={(date) => updateFilters({ dateTo: date })}
      />

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 6 }}>
          {t.client}
        </Text>
        <Input
          placeholder={t.searchClient}
          value={selectedCustomer?.name || customerQuery}
          onChangeText={(value) => {
            setCustomerQuery(value);
            setShowCustomers(true);
            if (!value) {
              updateFilters({ customerId: null });
            }
          }}
        />

        {showCustomers && filteredCustomers.length > 0 && (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              backgroundColor: colors.surface,
              paddingVertical: 4,
              marginTop: 4,
              maxHeight: 180,
            }}
          >
            {filteredCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                onPress={() => {
                  updateFilters({ customerId: customer.id });
                  setCustomerQuery(customer.name || '');
                  setShowCustomers(false);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  {customer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <TouchableOpacity
          onPress={handleClear}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
            {t.clear}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onApply}
        >
          <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600' }}>
            {t.applyFilters}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
