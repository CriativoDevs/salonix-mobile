import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  hint?: string;
  isPrimary?: boolean;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
}

export const StatCard = memo(({ label, value, icon, hint, isPrimary, actionIcon, onActionPress }: StatCardProps) => {
  const { colors } = useTheme();

  const containerStyle = isPrimary
    ? {
        backgroundColor: colors.surfaceVariant,
        borderColor: 'transparent',
      }
    : {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      };

  const labelColor = isPrimary ? colors.textSecondary : colors.textSecondary;
  const valueColor = isPrimary ? colors.success : colors.textPrimary;
  const hintColor = isPrimary ? colors.textSecondary : colors.textSecondary;

  return (
    <View
      style={{
        width: '100%',
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 18,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        ...containerStyle,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: labelColor,
              fontSize: 13,
              fontWeight: '500',
              marginRight: 4,
            }}
          >
            {label}
          </Text>
          {icon && (
            <Ionicons name={icon} size={14} color={labelColor} />
          )}
        </View>
        {actionIcon && onActionPress && (
          <TouchableOpacity
            onPress={onActionPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={actionIcon} size={16} color={labelColor} />
          </TouchableOpacity>
        )}
      </View>

      <Text
        className="text-3xl font-bold mb-1"
        style={{ color: valueColor }}
      >
        {value}
      </Text>

      {hint && (
        <Text className="text-xs" style={{ color: hintColor }}>
          {hint}
        </Text>
      )}
    </View>
  );
});

interface Appointment {
  id: string;
  rangeLabel: string;
  clientName: string;
  service: string;
  professional: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'scheduled' | string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
}

export const AppointmentCard = memo(({ appointment, onPress }: AppointmentCardProps) => {
  const { colors } = useTheme();
  
  const getStatusLabel = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'confirmed':
      case 'scheduled':
        return 'Agendado';
      case 'cancelled':
        return 'Cancelado';
      case 'pending':
        return 'Pendente';
      case 'completed':
        return 'Concluído';
      default:
        return 'Agendado';
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{ 
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
      }}
    >
      {/* Linha 1: TimeLabel + Badge de Status */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 8 
      }}>
        <Text 
          numberOfLines={1} 
          style={{ 
            color: colors.textPrimary,
            fontSize: 13,
            fontWeight: '500',
            flex: 1,
            marginRight: 8
          }}
        >
          {appointment.rangeLabel}
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: 'transparent',
          }}
        >
          <Text 
            style={{ 
              color: colors.textSecondary,
              fontSize: 11,
              fontWeight: '500'
            }}
          >
            {getStatusLabel(appointment.status)}
          </Text>
        </View>
      </View>

      {/* Linha 2: ClientName • Professional */}
      <Text 
        numberOfLines={1}
        style={{ 
          color: colors.textPrimary,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 4
        }}
      >
        {appointment.clientName} • {appointment.professional}
      </Text>
      
      {/* Linha 3: Service */}
      <Text 
        numberOfLines={1}
        style={{ 
          color: colors.textSecondary,
          fontSize: 12
        }}
      >
        {appointment.service}
      </Text>
    </TouchableOpacity>
  );
});

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader = memo(({ title, actionLabel, onAction }: SectionHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View className="flex-row justify-between items-center mb-4 mt-2">
      <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
        {title}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-sm font-medium" style={{ color: colors.brandPrimary }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}

export const EmptyAppointmentsState = memo(({ title, description, actionLabel, onAction }: EmptyStateProps) => {
    const { colors } = useTheme();
    return (
        <View 
            style={{ 
                paddingVertical: 24,
                paddingHorizontal: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderStyle: 'dashed',
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: '100%',
                alignSelf: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 4
            }}
        >
            <Text 
                style={{ 
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '500',
                    textAlign: 'center',
                    marginBottom: 8
                }}
            >
                {title}
            </Text>
            <Text 
                style={{ 
                    color: colors.textSecondary,
                    fontSize: 14,
                    textAlign: 'center',
                    marginBottom: 24
                }}
            >
                {description}
            </Text>
            <TouchableOpacity onPress={onAction}>
                <Text 
                    style={{ 
                        color: colors.brandPrimary,
                        fontSize: 16,
                        fontWeight: '500',
                        textDecorationLine: 'underline'
                    }}
                >
                    {actionLabel}
                </Text>
            </TouchableOpacity>
        </View>
    );
});

interface QuickActionProps {
    label: string;
    onPress: () => void;
}

export const QuickActionBtn = memo(({ label, onPress }: QuickActionProps) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity 
            onPress={onPress}
            style={{ 
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceVariant,
                marginRight: 4,
                marginBottom: 4
            }}
        >
            <Text 
                style={{ 
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: '500'
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
});
