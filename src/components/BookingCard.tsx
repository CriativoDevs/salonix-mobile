import React, { memo, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

type BookingStatus = 'scheduled' | 'completed' | 'paid' | 'cancelled' | string;

type BookingCardProps = {
  appointment: {
    id: string;
    rangeLabel: string;
    customerName: string;
    serviceName: string;
    professionalName: string;
    status: BookingStatus;
  };
  onPress?: () => void;
  onAction?: (action: 'details' | 'cancel') => void;
};

const COPY = {
  pt: {
    status: {
      scheduled: 'Agendado',
      completed: 'Concluido',
      paid: 'Pago',
      cancelled: 'Cancelado',
    },
    client: 'Cliente',
    service: 'Servico',
    professional: 'Profissional',
    viewDetails: 'Ver detalhes',
    cancel: 'Cancelar',
  },
  en: {
    status: {
      scheduled: 'Scheduled',
      completed: 'Completed',
      paid: 'Paid',
      cancelled: 'Cancelled',
    },
    client: 'Client',
    service: 'Service',
    professional: 'Professional',
    viewDetails: 'View details',
    cancel: 'Cancel',
  },
} as const;

export const BookingCard = memo(({ appointment, onPress, onAction }: BookingCardProps) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const [showActions, setShowActions] = useState(false);

  const statusKey = String(appointment.status || 'scheduled').toLowerCase();

  const badgeStyles = useMemo(() => {
    switch (statusKey) {
      case 'completed':
        return {
          borderColor: colors.info,
          backgroundColor: colors.infoBackground,
          textColor: colors.info,
        };
      case 'paid':
        return {
          borderColor: colors.success,
          backgroundColor: colors.successBackground,
          textColor: colors.success,
        };
      case 'cancelled':
        return {
          borderColor: colors.error,
          backgroundColor: colors.errorBackground,
          textColor: colors.error,
        };
      case 'scheduled':
      default:
        return {
          borderColor: colors.success,
          backgroundColor: colors.successBackground,
          textColor: colors.success,
        };
    }
  }, [colors, statusKey]);

  const canCancel = statusKey === 'scheduled';
  const statusLabel =
    (t.status as Record<string, string>)[statusKey] || appointment.status || t.status.scheduled;

  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
            {appointment.rangeLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: badgeStyles.borderColor,
                backgroundColor: badgeStyles.backgroundColor,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginRight: 8,
              }}
            >
              <Text style={{ color: badgeStyles.textColor, fontSize: 10, fontWeight: '600' }}>
                {statusLabel.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowActions((prev) => !prev)}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 10 }}>
          {appointment.customerName || t.client}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
          {[appointment.serviceName || t.service, appointment.professionalName || t.professional]
            .filter(Boolean)
            .join('  •  ')}
        </Text>
      </TouchableOpacity>

      {showActions && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: 10,
            marginTop: 6,
            paddingVertical: 6,
            paddingHorizontal: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setShowActions(false);
              onAction?.('details');
            }}
            style={{ paddingVertical: 6 }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '500' }}>
              {t.viewDetails}
            </Text>
          </TouchableOpacity>
          {canCancel && (
            <TouchableOpacity
              onPress={() => {
                setShowActions(false);
                onAction?.('cancel');
              }}
              style={{ paddingVertical: 6 }}
            >
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '500' }}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

BookingCard.displayName = 'BookingCard';
export default BookingCard;
