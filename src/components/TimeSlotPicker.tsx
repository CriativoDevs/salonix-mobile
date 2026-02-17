import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { parseSlotDate } from '../utils/date';

interface TimeSlot {
    id: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

interface TimeSlotPickerProps {
    slots: TimeSlot[];
    selectedSlotId: number | null;
    onSlotSelect: (slot: TimeSlot) => void;
    loading?: boolean;
}

const TimeSlotPicker = ({ slots, selectedSlotId, onSlotSelect, loading }: TimeSlotPickerProps) => {
    const { colors } = useTheme();

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="small" color={colors.brandPrimary} />
            </View>
        );
    }

    if (slots.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Nenhum horário disponível para esta data.
                </Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: TimeSlot }) => {
        const startDate = parseSlotDate(item.start_time);
        const timeLabel = startDate ? new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(startDate) : '--:--';

        const isSelected = selectedSlotId === item.id;

        return (
            <TouchableOpacity
                onPress={() => onSlotSelect(item)}
                style={[
                    styles.slotButton,
                    {
                        borderColor: isSelected ? colors.brandPrimary : colors.border,
                        backgroundColor: isSelected ? colors.brandPrimary : colors.surface,
                    }
                ]}
            >
                <Text style={[
                    styles.slotText,
                    { color: isSelected ? 'white' : colors.textPrimary }
                ]}>
                    {timeLabel}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={slots}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            numColumns={4}
            scrollEnabled={false}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.container}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
    },
    center: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    slotButton: {
        flex: 1,
        maxWidth: '23%',
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default TimeSlotPicker;
