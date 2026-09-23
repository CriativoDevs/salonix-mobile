import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    title: 'Agendamentos',
    countSuffix: (n: number) => `${n} agendamentos`,
    filters: 'Filtros',
    newAppointment: 'Novo agendamento',
    importExport: 'Importar/Exportar',
  },
  en: {
    title: 'Appointments',
    countSuffix: (n: number) => `${n} appointments`,
    filters: 'Filters',
    newAppointment: 'New appointment',
    importExport: 'Import/Export',
  },
} as const;

type BookingListHeaderProps = {
  totalCount: number;
  onToggleFilters?: () => void;
  onAdd?: () => void;
  onImportExport?: () => void;
  filtersActive?: boolean;
  showImportExport: boolean;
};

export const BookingListHeader: React.FC<BookingListHeaderProps> = ({
  totalCount,
  onToggleFilters,
  onAdd,
  onImportExport,
  filtersActive = false,
  showImportExport,
}) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  return (
    <View style={{ marginBottom: 16, paddingBottom: 4 }}>
      <Text className="text-3xl font-bold" style={{ color: colors.textPrimary, marginBottom: 4 }}>
        {t.title}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
        {t.countSuffix(totalCount)}
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
            {t.filters}
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
            {t.newAppointment}
          </Text>
        </TouchableOpacity>

        {showImportExport && (
          <TouchableOpacity
            onPress={onImportExport}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
            <Text style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontWeight: '600',
              marginLeft: 6
            }}>
              {t.importExport}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
