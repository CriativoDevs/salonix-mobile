import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { fetchProfessionals, updateProfessional, deleteProfessional } from '../api/professionals';
import { fetchStaffMembers, inviteStaffMember } from '../api/staff';
import { ProfessionalFormModal } from '../components/ProfessionalFormModal';
import { useTenant } from '../hooks/useTenant';

export default function TeamScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { slug } = useTenant();

    const [professionals, setProfessionals] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Modal & Actions State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const LIMIT = 20;

    const loadData = useCallback(async (shouldRefresh = false) => {
        if (loading && !shouldRefresh) return;

        if (shouldRefresh) {
            setRefreshing(true);
            setPage(0);
        } else {
            if (!hasMore && page > 0) return;
        }

        try {
            // Load Staff Members (needed for resolving names/emails/permissions)
            // We fetch this every time we refresh to keep permissions in sync
            let currentStaff = staff;
            if (shouldRefresh || staff.length === 0) {
                const staffData = await fetchStaffMembers({ slug });
                const staffList = Array.isArray(staffData) ? staffData : staffData.staff || [];
                setStaff(staffList);
                currentStaff = staffList;
            }

            // Load Professionals - fetch without search to get all, then filter locally
            // This ensures we can search across merged staff data
            const currentOffset = shouldRefresh ? 0 : page * LIMIT;
            const data = await fetchProfessionals({
                limit: LIMIT * 2, // Fetch more to account for client-side filtering
                offset: currentOffset,
                search: '', // Don't filter on server - we'll filter locally after merging
                is_active: showInactive ? undefined : true,
                slug,
            } as any);

            let results = Array.isArray(data) ? data : data.results || [];

            // Apply client-side filtering after merging with staff data
            if (search.trim()) {
                const searchLower = search.toLowerCase().trim();
                results = results.filter((prof: any) => {
                    const staffMember = currentStaff.find((s: any) => s.id === prof.staff_member);

                    // Build searchable text from all relevant fields
                    const profName = prof.name || '';
                    const staffName = staffMember
                        ? `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim()
                        : '';
                    const email = prof.email || staffMember?.email || '';
                    const phone = prof.phone_number || staffMember?.phone_number || '';
                    const jobTitle = prof.job_title || prof.specialization || '';
                    const bio = prof.bio || '';

                    const searchableText = `${profName} ${staffName} ${email} ${phone} ${jobTitle} ${bio}`.toLowerCase();
                    return searchableText.includes(searchLower);
                });
            }

            // Limit results to LIMIT items
            results = results.slice(0, LIMIT);

            if (data.count !== undefined) setTotalCount(data.count);
            else if (shouldRefresh) setTotalCount(results.length);

            if (shouldRefresh) {
                setProfessionals(results);
            } else {
                setProfessionals(prev => [...prev, ...results]);
            }

            setHasMore(results.length >= LIMIT);
            if (!shouldRefresh) {
                setPage(prev => prev + 1);
            } else {
                setPage(1);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, showInactive, page, hasMore, loading, staff.length, slug]);

    // Initial load and search/filter changes
    useEffect(() => {
        setLoading(true);
        setProfessionals([]);
        setPage(0);
        setHasMore(true);

        const timer = setTimeout(() => {
            loadData(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [search, showInactive]);

    const onRefresh = () => {
        loadData(true);
    };

    const onEndReached = () => {
        if (!loading && !refreshing && hasMore) {
            loadData(false);
        }
    };

    const handleCreate = () => {
        setSelectedProfessional(null);
        setModalVisible(true);
    };

    const handleEdit = (professional: any) => {
        setSelectedProfessional(professional);
        setModalVisible(true);
    };

    const handleSave = async (data: any) => {
        setActionLoading(true);
        try {
            if (selectedProfessional) {
                await updateProfessional(selectedProfessional.id, { ...data, slug });
                // Update local list (simple update, might need refresh to sync staff data completely)
                setProfessionals(prev => prev.map(p => p.id === selectedProfessional.id ? { ...p, ...data } : p));

                // Refresh to get updated permissions if they changed
                if (data.role || data.is_active !== undefined) {
                    loadData(true);
                }
            } else {
                // Modo Criação: Usa inviteStaffMember (backend cria Professional automaticamente)
                await inviteStaffMember({
                    name: data.name,
                    email: data.email,
                    role: data.role || 'collaborator',
                }, { slug });

                // Refresh completo para pegar o novo Staff e o novo Professional criado
                loadData(true);
                Alert.alert('Sucesso', 'Convite enviado com sucesso!');
            }
            setModalVisible(false);
        } catch (error: any) {
            console.error('Error saving professional:', error);
            const msg = error.response?.data?.detail || error.message || 'Não foi possível salvar.';
            Alert.alert('Erro', msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = (professional: any) => {
        Alert.alert(
            'Excluir Profissional',
            `Tem certeza que deseja excluir ${professional.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProfessional(professional.id, { slug });
                            setProfessionals(prev => prev.filter(p => p.id !== professional.id));
                            setTotalCount(prev => Math.max(0, prev - 1));
                        } catch (error) {
                            console.error('Error deleting professional:', error);
                            Alert.alert('Erro', 'Não foi possível excluir o profissional.');
                        }
                    }
                }
            ]
        );
    };

    const handleResendInvite = async (professional: any) => {
        // Placeholder se a funcionalidade de reenviar convite for necessária
        // Para implementar corretamente, precisamos de um endpoint específico de staff
        Alert.alert("Aviso", "Funcionalidade de reenviar convite em manutenção.");
    };

    const showOptions = (professional: any) => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Editar', 'Reenviar Convite', 'Excluir'],
                    destructiveButtonIndex: 3,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handleEdit(professional);
                    if (buttonIndex === 2) handleResendInvite(professional);
                    if (buttonIndex === 3) handleDelete(professional);
                }
            );
        } else {
            Alert.alert(
                'Opções',
                `Selecione uma ação para ${professional.name} `,
                [
                    { text: 'Editar', onPress: () => handleEdit(professional) },
                    { text: 'Reenviar Convite', onPress: () => handleResendInvite(professional) },
                    { text: 'Excluir', onPress: () => handleDelete(professional), style: 'destructive' },
                    { text: 'Cancelar', style: 'cancel' },
                ]
            );
        }
    };

    const renderItem = ({ item }) => {
        // Find links staff member
        const staffMember = staff.find(s => s.id === item.staff_member);

        // Data Normalization (Handle flat or nested user structure)
        // Order of precedence: Professional Name -> Staff Name -> User Name -> 'Sem Nome'
        const staffName = staffMember
            ? `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim() || staffMember.email
            : null;

        const name = item.name || staffName || (item.user?.first_name ? `${item.user.first_name} ${item.user.last_name || ''}`.trim() : 'Sem Nome');

        const email = item.email || staffMember?.email || item.user?.email || '—';
        const phone = item.phone_number || staffMember?.phone_number || item.user?.phone_number;
        const jobTitle = item.job_title || item.specialization || 'Colaborador';

        // Resolve Role and Status
        // If staff member exists, use their role/status. Otherwise fallback to professional data.
        const role = staffMember?.role || item.role || (item.is_owner ? 'OWNER' : 'COLABORADOR');

        // Status logic:
        // If staff member exists:
        // - if staff.status is 'invited' -> INVITED
        // - of staff.status is 'disabled' -> DISABLED
        // - if staff.status is 'active' AND professional.is_active -> ACTIVE
        // - else -> DISABLED
        let status = 'INATIVO';
        let isActive = false;

        if (staffMember) {
            if (staffMember.status === 'invited') status = 'CONVITE';
            else if (staffMember.status === 'disabled') status = 'DESATIVADO';
            else if (staffMember.status === 'active' && item.is_active !== false) {
                status = 'ATIVO';
                isActive = true;
            }
        } else {
            if (item.is_active !== false) {
                status = 'ATIVO';
                isActive = true;
            }
        }

        const normalizedItem = {
            ...item,
            name,
            email,
            phone_number: phone,
            job_title: jobTitle,
            bio: item.bio || item.description,
            role,      // Pass resolved role
            status,    // Pass resolved status string
            is_active: isActive, // Pass resolved boolean
            staff_member_data: staffMember // Pass full staff object for modal
        };

        return (
            <View style={styles.card}>
                <Card
                    onPress={() => handleEdit(normalizedItem)}
                    onLongPress={() => showOptions(normalizedItem)}
                >
                    <View style={styles.cardContent}>
                        {/* Name & Job */}
                        <View style={{ marginBottom: 8 }}>
                            <Text style={[styles.name, { color: colors.textPrimary }]}>
                                {name}
                            </Text>
                            {jobTitle ? (
                                <Text style={[styles.jobTitle, { color: colors.textSecondary }]}>
                                    {jobTitle}
                                </Text>
                            ) : null}
                            {email ? (
                                <Text style={[styles.email, { color: colors.textSecondary }]}>
                                    {email}
                                </Text>
                            ) : null}
                        </View>

                        {/* Badges */}
                        <View style={styles.badgeContainer}>
                            <View style={[styles.badge, { backgroundColor: role === 'OWNER' ? '#E9D5FF' : '#CCFBF1' }]}>
                                <Text style={[styles.badgeText, { color: role === 'OWNER' ? '#6B21A8' : '#0F766E' }]}>
                                    {role}
                                </Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: isActive ? '#DCFCE7' : '#F3F4F6', marginLeft: 8 }]}>
                                <Text style={[styles.badgeText, { color: isActive ? '#15803D' : '#374151' }]}>
                                    {isActive ? 'ATIVO' : 'INATIVO'}
                                </Text>
                            </View>
                        </View>

                        {/* Manage Action */}
                        <TouchableOpacity
                            style={{ marginTop: 12 }}
                            onPress={() => handleEdit(normalizedItem)}
                        >
                            <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 14 }}>
                                Gerenciar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            </View>
        );
    };

    const hasActiveFilters = Boolean(search || showInactive);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16 }}>
                <View style={{ marginBottom: 16 }}>
                    <Text className="text-3xl font-bold" style={{ color: colors.textPrimary, marginBottom: 4 }}>
                        Equipe
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                        {totalCount} profissionais
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
                                Novo profissional
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Filters Collapsible */}
            {showFilters && (
                <View style={[styles.filters, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    <View style={styles.searchInput}>
                        <Input
                            placeholder="Buscar profissional..."
                            value={search}
                            onChangeText={setSearch}
                            onSubmitEditing={() => loadData(true)}
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterToggle, { borderColor: showInactive ? colors.brandPrimary : colors.border }]}
                        onPress={() => setShowInactive(!showInactive)}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: showInactive ? colors.brandPrimary : colors.textSecondary }
                        ]}>
                            {showInactive ? 'Com inativos' : 'Apenas ativos'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* List */}
            <FlatList
                data={professionals}
                renderItem={renderItem}
                keyExtractor={item => String(item.id)}
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
                                Nenhum profissional encontrado.
                            </Text>
                            <TouchableOpacity onPress={handleCreate} style={{ marginTop: 16 }}>
                                <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>
                                    Adicionar novo profissional
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />

            <ProfessionalFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSave}
                initialData={selectedProfessional}
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
    searchInput: {
        marginBottom: 12,
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
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        marginBottom: 12,
    },
    cardContent: {

    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    jobTitle: {
        fontSize: 14,
        marginBottom: 2,
    },
    email: {
        fontSize: 13,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
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
