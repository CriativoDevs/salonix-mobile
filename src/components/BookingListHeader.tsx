import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

type BookingListHeaderProps = {
  totalCount: number;
  onToggleFilters?: () => void;
  onAdd?: () => void;
  filtersActive?: boolean;
};

export const BookingListHeader: React.FC<BookingListHeaderProps> = ({
  totalCount,
  onToggleFilters,
  onAdd,
  filtersActive = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 16, paddingBottom: 4 }}>
      <Text className="text-3xl font-bold" style={{ color: colors.textPrimary, marginBottom: 4 }}>
        Agendamentos
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
        {totalCount} agendamentos
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
        <TouchableOpacity
          onPress={onToggleFilters}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons 
            name="funnel-outline" 
            size={18} 
            color={filtersActive ? colors.brandPrimary : colors.textSecondary} 
          />
          <Text style={{ 
            color: filtersActive ? colors.brandPrimary : colors.textSecondary, 
            fontSize: 13, 
            fontWeight: '600', 
            marginLeft: 6 
          }}>
            Filtros
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAdd}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="add" size={18} color={colors.brandPrimary} />
          <Text style={{ 
            color: colors.brandPrimary, 
            fontSize: 13, 
            fontWeight: '600', 
            marginLeft: 6 
          }}>
            Novo agendamento
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
