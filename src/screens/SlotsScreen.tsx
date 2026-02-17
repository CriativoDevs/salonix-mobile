import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { Card } from '../components/ui/Card';
import { fetchSlots, createSlot, deleteSlot } from '../api/slots';
import { fetchProfessionals } from '../api/professionals';
import { SlotFormModal } from '../components/SlotFormModal';

export default function SlotsScreen() {
    const { colors } = useTheme();
    const { slug } = useTenant();

    const [slots, setSlots] = useState<any[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAvailableOnly, setShowAvailableOnly] = useState(true);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Modal & Actions State
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const LIMIT = 20;

    // Load professionals on mount
    useEffect(() => {
        loadProfessionals();
    }, [slug]);

    const loadProfessionals = async () => {
        try {
            const data = await fetchProfessionals({ slug, limit: 100 } as any);
            const results = Array.isArray(data) ? data : data.results || [];
            setProfessionals(results);
        } catch (error) {
            console.error('Error loading professionals:', error);
        }
    };

    const loadData = useCallback(async (shouldRefresh = false) => {
        if (loading && !shouldRefresh) return;

        if (shouldRefresh) {
            setRefreshing(true);
            setPage(0);
        } else {
            if (!hasMore && page > 0) return;
        }

        try {
            const currentOffset = shouldRefresh ? 0 : page * LIMIT;

            // Format date for API if selected
            const dateStr = selectedDate
                ? selectedDate.toISOString().split('T')[0]
                : undefined;

            const data = await fetchSlots({
                limit: LIMIT,
                offset: currentOffset,
                professional_id: selectedProfessional || undefined,
                is_available: showAvailableOnly ? true : undefined,
                slug,
            } as any);

            const results = Array.isArray(data) ? data : data.results || [];
            if (data.count !== undefined) setTotalCount(data.count);
            else if (shouldRefresh) setTotalCount(results.length);

            // Filter by date if selected
            let filteredResults = results;
            if (dateStr) {
                filteredResults = results.filter((slot: any) =>
                    slot.start_time?.startsWith(dateStr)
                );
            }

            if (shouldRefresh) {
                setSlots(filteredResults);
            } else {
                setSlots(prev => [...prev, ...filteredResults]);
            }

            setHasMore(results.length >= LIMIT);
            if (!shouldRefresh) {
                setPage(prev => prev + 1);
            } else {
                setPage(1);
            }

        } catch (error) {
            console.error('Error fetching slots:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedProfessional, selectedDate, showAvailableOnly, page, hasMore, loading, slug]);

    // Initial load and filter changes
    useEffect(() => {
        setLoading(true);
        setSlots([]);
        setPage(0);
        setHasMore(true);

        const timer = setTimeout(() => {
            loadData(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [selectedProfessional, selectedDate, showAvailableOnly]);

    const onRefresh = () => {
        loadData(true);
    };

    const onEndReached = () => {
        if (!loading && !refreshing && hasMore) {
            loadData(false);
        }
    };

    const handleCreate = () => {
        setModalVisible(true);
    };

    const handleSave = async (data: any) => {
        setActionLoading(true);
        try {
            await createSlot({ ...data, slug });
            setModalVisible(false);
            loadData(true);
        } catch (error) {
            console.error('Error creating slot:', error);
            Alert.alert('Erro', 'Não foi possível criar o horário.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = (slot: any) => {
        Alert.alert(
            'Excluir Horário',
            `Tem certeza que deseja excluir este horário?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSlot(slot.id, { slug });
                            setSlots(prev => prev.filter(s => s.id !== slot.id));
                            setTotalCount(prev => Math.max(0, prev - 1));
                        } catch (error) {
                            console.error('Error deleting slot:', error);
                            Alert.alert('Erro', 'Não foi possível excluir o horário.');
                        }
                    }
                }
            ]
        );
    };

    const showOptions = (slot: any) => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Excluir'],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handleDelete(slot);
                }
            );
        } else {
            Alert.alert(
                'Opções',
                'Selecione uma ação',
                [
                    { text: 'Excluir', onPress: () => handleDelete(slot), style: 'destructive' },
                    { text: 'Cancelar', style: 'cancel' },
                ]
            );
        }
    };

    // Group slots by date
    const groupedSlots = useMemo(() => {
        const groups: { [key: string]: any[] } = {};

        slots.forEach(slot => {
            const date = slot.start_time?.slice(0, 10) || 'Sem data';
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(slot);
        });

        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [slots]);

    const formatDate = (dateStr: string) => {
        if (dateStr === 'Sem data') return dateStr;
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return '';
        // Format: "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM:SS"
        const timePart = dateTimeStr.includes('T')
            ? dateTimeStr.split('T')[1].slice(0, 5)
            : dateTimeStr.split(' ')[1]?.slice(0, 5);
        return timePart || '';
    };

    const renderSlotItem = ({ item }: { item: any }) => {
        const professional = professionals.find(p => p.id === item.professional);
        const timeRange = `${formatTime(item.start_time)} – ${formatTime(item.end_time)}`;

        return (
            <TouchableOpacity
                onLongPress={() => showOptions(item)}
                style={styles.slotCard}
            >
                <Card>
                    <View style={styles.slotContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.slotTime, { color: colors.textPrimary }]}>
                                {timeRange}
                            </Text>
                            {professional && (
                                <Text style={[styles.slotProfessional, { color: colors.textSecondary }]}>
                                    {professional.name}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderDateGroup = ({ item }: { item: [string, any[]] }) => {
        const [date, dateSlots] = item;

        return (
            <View style={styles.dateGroup}>
                <Text style={[styles.dateHeader, { color: colors.textPrimary }]}>
                    {formatDate(date)}
                </Text>
                {dateSlots.map((slot) => (
                    <View key={slot.id}>
                        {renderSlotItem({ item: slot })}
                    </View>
                ))}
            </View>
        );
    };

    const hasActiveFilters = Boolean(selectedProfessional || selectedDate || !showAvailableOnly);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16 }}>
                <View style={{ marginBottom: 16 }}>
                    <Text className="text-3xl font-bold" style={{ color: colors.textPrimary, marginBottom: 4 }}>
                        Horários
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                        {totalCount} horários disponíveis
                    </Text>

                    <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                        <TouchableOpacity
                            onPress={() => setShowFilters(!showFilters)}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Ionicons
                                name="funnel-outline"
                                size={18}
                                color={hasActiveFilters || showFilters ? colors.brandPrimary : colors.textSecondary}
                            />
                            <Text style={{
                                color: hasActiveFilters || showFilters ? colors.brandPrimary : colors.textSecondary,
                                fontSize: 13,
                                fontWeight: '600',
                                marginLeft: 6
                            }}>
                                Filtros
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleCreate}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Ionicons name="add" size={18} color={colors.brandPrimary} />
                            <Text style={{
                                color: colors.brandPrimary,
                                fontSize: 13,
                                fontWeight: '600',
                                marginLeft: 6
                            }}>
                                Novo horário
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={[styles.filters, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    {/* Professional Filter */}
                    <View style={styles.filterGroup}>
                        <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Profissional</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Picker
                                selectedValue={selectedProfessional}
                                onValueChange={(value) => setSelectedProfessional(String(value))}
                                style={{ color: colors.textPrimary }}
                            >
                                <Picker.Item label="Todos" value="" />
                                {professionals.map((prof) => (
                                    <Picker.Item key={prof.id} label={prof.name} value={String(prof.id)} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Date Filter */}
                    <View style={styles.filterGroup}>
                        <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Data</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ color: selectedDate ? colors.textPrimary : colors.textSecondary }}>
                                {selectedDate
                                    ? selectedDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                    : 'Selecione uma data'}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        {selectedDate && (
                            <TouchableOpacity
                                onPress={() => setSelectedDate(null)}
                                style={{ marginTop: 4 }}
                            >
                                <Text style={{ color: colors.brandPrimary, fontSize: 12 }}>Limpar data</Text>
                            </TouchableOpacity>
                        )}
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) {
                                        setSelectedDate(date);
                                    }
                                }}
                            />
                        )}
                    </View>

                    {/* Available Only Toggle */}
                    <TouchableOpacity
                        style={[styles.filterToggle, {
                            borderColor: showAvailableOnly ? colors.brandPrimary : colors.border,
                            backgroundColor: showAvailableOnly ? `${colors.brandPrimary}15` : 'transparent'
                        }]}
                        onPress={() => setShowAvailableOnly(!showAvailableOnly)}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: showAvailableOnly ? colors.brandPrimary : colors.textSecondary }
                        ]}>
                            {showAvailableOnly ? '✓ Apenas disponíveis' : 'Todos os horários'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* List */}
            <FlatList
                data={groupedSlots}
                renderItem={renderDateGroup}
                keyExtractor={item => item[0]}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loading && !refreshing ? (
                        <ActivityIndicator size="small" color={colors.brandPrimary} style={styles.footerLoader} />
                    ) : null
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Nenhum horário encontrado.
                            </Text>
                            <TouchableOpacity onPress={handleCreate} style={{ marginTop: 16 }}>
                                <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>
                                    Adicionar novo horário
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />

            <SlotFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSave}
                professionals={professionals}
                busy={actionLoading}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filters: {
        padding: 16,
    },
    filterGroup: {
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    filterToggle: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    dateGroup: {
        marginBottom: 24,
    },
    dateHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    slotCard: {
        marginBottom: 8,
    },
    slotContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    slotTime: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    slotProfessional: {
        fontSize: 14,
    },
    deleteButton: {
        padding: 8,
    },
    footerLoader: {
        paddingVertical: 16,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
});
