import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Input } from './ui/Input';
import { DatePickerInput } from './DatePickerInput';
import { useTheme } from '../hooks/useTheme';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'completed', label: 'Concluido' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' },
];

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
        Filtros
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
        label="Data inicial"
        placeholder="Selecione uma data"
        value={filters.dateFrom || ''}
        onDateChange={(date) => updateFilters({ dateFrom: date })}
      />

      <DatePickerInput
        label="Data final"
        placeholder="Selecione uma data"
        value={filters.dateTo || ''}
        onDateChange={(date) => updateFilters({ dateTo: date })}
      />

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 6 }}>
          Cliente
        </Text>
        <Input
          placeholder="Buscar cliente"
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
            Limpar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onApply}
        >
          <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600' }}>
            Aplicar filtros
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
