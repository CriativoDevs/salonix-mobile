import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Keyboard, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer, resendCustomerInvite, exportCustomersCSV } from '../api/customers';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { ImportCustomersModal } from '../components/ImportCustomersModal';
import { ShareRegistrationLinkModal } from '../components/ShareRegistrationLinkModal';
import { Avatar } from '../components/ui/Avatar';
import { saveAndShareCSV } from '../utils/csvFileSharing';
import { getRegistrationLink, resolveMediaUrl } from '../utils/env';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { useToast } from '../contexts/ToastContext';
import { ActionMenu } from '../components/ui/ActionMenu';

const COPY = {
  pt: {
    exportError: 'Não foi possível exportar os clientes.',
    saveError: 'Não foi possível salvar o cliente.',
    deleteError: 'Não foi possível excluir o cliente.',
    resendError: 'Não foi possível reenviar o convite.',
    resendSuccess: 'Convite reenviado com sucesso.',
    errorTitle: 'Erro',
    deleteTitle: 'Excluir Cliente',
    deleteMessage: (name: string) => `Tem certeza que deseja excluir ${name}?`,
    cancel: 'Cancelar',
    delete: 'Excluir',
    inactive: 'Inativo',
    title: 'Clientes',
    countSuffix: (n: number) => `${n} clientes`,
    filters: 'Filtros',
    newCustomer: 'Novo cliente',
    importExport: 'Importar/Exportar',
    shareLink: 'Partilhar link',
    generateQrCode: 'Gerar QR Code',
    searchPlaceholder: 'Buscar cliente...',
    withInactive: 'Com inativos',
    onlyActive: 'Apenas ativos',
    emptyTitle: 'Nenhum cliente encontrado.',
    addNewCustomer: 'Adicionar novo cliente',
    importCsv: 'Importar CSV',
    exportCsv: 'Exportar CSV',
    edit: 'Editar',
    resendInvite: 'Reenviar Convite',
  },
  en: {
    exportError: 'Could not export the customers.',
    saveError: 'Could not save the customer.',
    deleteError: 'Could not delete the customer.',
    resendError: 'Could not resend the invite.',
    resendSuccess: 'Invite resent successfully.',
    errorTitle: 'Error',
    deleteTitle: 'Delete Customer',
    deleteMessage: (name: string) => `Are you sure you want to delete ${name}?`,
    cancel: 'Cancel',
    delete: 'Delete',
    inactive: 'Inactive',
    title: 'Customers',
    countSuffix: (n: number) => `${n} customers`,
    filters: 'Filters',
    newCustomer: 'New customer',
    importExport: 'Import/Export',
    shareLink: 'Share link',
    generateQrCode: 'Generate QR Code',
    searchPlaceholder: 'Search customer...',
    withInactive: 'With inactive',
    onlyActive: 'Active only',
    emptyTitle: 'No customer found.',
    addNewCustomer: 'Add new customer',
    importCsv: 'Import CSV',
    exportCsv: 'Export CSV',
    edit: 'Edit',
    resendInvite: 'Resend Invite',
  },
} as const;

export default function CustomersScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { slug } = useTenant();
    const { userInfo } = useAuth();
    const { showToast } = useToast();
    const { language } = useLanguage();
    const t = language === 'en' ? COPY.en : COPY.pt;

    const [customers, setCustomers] = useState<any[]>([]);
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
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [importExportMenuVisible, setImportExportMenuVisible] = useState(false);
    const [optionsMenuTarget, setOptionsMenuTarget] = useState<any>(null);

    const handleExportCSV = async () => {
        try {
            const content = await exportCustomersCSV({ slug } as any);
            await saveAndShareCSV(content, 'clientes.csv');
        } catch (error) {
            console.error('Error exporting customers:', error);
            Alert.alert(t.errorTitle, t.exportError);
        }
    };

    const handleImportExport = () => {
        setImportExportMenuVisible(true);
    };

    const handleImportSuccess = () => {
        loadCustomers(true);
    };

    const handleShareLink = async () => {
        try {
            await Share.share({ message: getRegistrationLink(slug) });
        } catch (error) {
            console.error('Error sharing registration link:', error);
        }
    };

    const LIMIT = 20;

    const loadCustomers = useCallback(async (shouldRefresh = false) => {
        if (loading && !shouldRefresh) return;

        if (shouldRefresh) {
            setRefreshing(true);
            setPage(0);
        } else {
            if (!hasMore && page > 0) return;
        }

        try {
            const currentOffset = shouldRefresh ? 0 : page * LIMIT;
            const data = await fetchCustomers({
                limit: LIMIT,
                offset: currentOffset,
                search,
                is_active: showInactive ? undefined : true,
            } as any);

            const results = Array.isArray(data) ? data : data.results || [];
            if (data.count !== undefined) setTotalCount(data.count);
            else if (shouldRefresh) setTotalCount(results.length); // Fallback

            if (shouldRefresh) {
                setCustomers(results);
            } else {
                setCustomers(prev => [...prev, ...results]);
            }

            setHasMore(results.length >= LIMIT);
            if (!shouldRefresh) {
                setPage(prev => prev + 1);
            } else {
                setPage(1);
            }

        } catch (error) {
            console.error('Error fetching customers:', error);
            // TODO: Show toast error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, showInactive, page, hasMore, loading]);

    // Initial load and search/filter changes
    useEffect(() => {
        setLoading(true);
        setCustomers([]);
        setPage(0);
        setHasMore(true);

        const timer = setTimeout(() => {
            loadCustomers(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [search, showInactive]);

    const onRefresh = () => {
        loadCustomers(true);
    };

    const onEndReached = () => {
        if (!loading && !refreshing && hasMore) {
            loadCustomers(false);
        }
    };

    const handleCreate = () => {
        setSelectedCustomer(null);
        setModalVisible(true);
    };

    const handleEdit = (customer: any) => {
        setSelectedCustomer(customer);
        setModalVisible(true);
    };

    const handleSave = async (data: any) => {
        setActionLoading(true);
        try {
            if (selectedCustomer) {
                await updateCustomer(selectedCustomer.id, data);
                // Update local list
                setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, ...data } : c));
            } else {
                const newCustomer = await createCustomer(data);
                // Prepend to list
                setCustomers(prev => [newCustomer, ...prev]);
                setTotalCount(prev => prev + 1);
            }
            setModalVisible(false);
        } catch (error) {
            console.error('Error saving customer:', error);
            Alert.alert(t.errorTitle, t.saveError);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = (customer: any) => {
        Alert.alert(
            t.deleteTitle,
            t.deleteMessage(customer.name),
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCustomer(customer.id);
                            setCustomers(prev => prev.filter(c => c.id !== customer.id));
                            setTotalCount(prev => Math.max(0, prev - 1));
                        } catch (error) {
                            console.error('Error deleting customer:', error);
                            Alert.alert(t.errorTitle, t.deleteError);
                        }
                    }
                }
            ]
        );
    };

    const handleResendInvite = async (customer: any) => {
        try {
            await resendCustomerInvite(customer.id);
            showToast({ type: 'success', message: t.resendSuccess });
        } catch (error) {
            console.error('Error resending invite:', error);
            Alert.alert(t.errorTitle, t.resendError);
        }
    };

    const showOptions = (customer: any) => {
        setOptionsMenuTarget(customer);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Card
                onPress={() => handleEdit(item)}
                onLongPress={() => showOptions(item)}
            >
                <View style={styles.cardRow}>
                    <Avatar
                        testID={`customer-avatar-${item.id}`}
                        uri={resolveMediaUrl(item.photo)}
                        name={item.name}
                        size={44}
                        style={styles.cardAvatar}
                    />
                    <View style={{ flex: 1 }}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                                {item.name}
                            </Text>
                            {!item.is_active && (
                                <View style={[styles.badge, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{t.inactive}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.contactInfo}>
                            {item.email && (
                                <View style={styles.contactRow}>
                                    <Ionicons name="mail-outline" size={14} color={colors.textSecondary} style={styles.icon} />
                                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>{item.email}</Text>
                                </View>
                            )}
                            {item.phone_number && (
                                <View style={styles.contactRow}>
                                    <Ionicons name="call-outline" size={14} color={colors.textSecondary} style={styles.icon} />
                                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>{item.phone_number}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Card>
        </View>
    );

    const hasActiveFilters = Boolean(search || showInactive);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16 }}>


                <View style={{ marginBottom: 16 }}>
                    <Text className="text-3xl font-bold" style={{ color: colors.textPrimary, marginBottom: 4 }}>
                        {t.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                        {t.countSuffix(totalCount)}
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ flexDirection: 'row', marginTop: 12, gap: 16 }}
                    >
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
                                {t.filters}
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
                                {t.newCustomer}
                            </Text>
                        </TouchableOpacity>

                        {isOwner(userInfo) && (
                          <TouchableOpacity
                              onPress={handleImportExport}
                              style={{ flexDirection: 'row', alignItems: 'center' }}
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

                        <TouchableOpacity
                            onPress={handleShareLink}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
                            <Text style={{
                                color: colors.textSecondary,
                                fontSize: 13,
                                fontWeight: '600',
                                marginLeft: 6
                            }}>
                                {t.shareLink}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setQrModalVisible(true)}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Ionicons name="qr-code-outline" size={18} color={colors.textSecondary} />
                            <Text style={{
                                color: colors.textSecondary,
                                fontSize: 13,
                                fontWeight: '600',
                                marginLeft: 6
                            }}>
                                {t.generateQrCode}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>

            {/* Filters Collapsible */}
            {showFilters && (
                <View style={[styles.filters, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    <View style={styles.searchInput}>
                        <Input
                            placeholder={t.searchPlaceholder}
                            value={search}
                            onChangeText={setSearch}
                            onSubmitEditing={() => loadCustomers(true)}
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
                            {showInactive ? t.withInactive : t.onlyActive}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* List */}
            <FlatList
                data={customers}
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
                                {t.emptyTitle}
                            </Text>
                            <TouchableOpacity onPress={handleCreate} style={{ marginTop: 16 }}>
                                <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>
                                    {t.addNewCustomer}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />

            <CustomerFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSave}
                initialData={selectedCustomer}
                busy={actionLoading}
            />

            <ImportCustomersModal
                visible={importModalVisible}
                onClose={() => setImportModalVisible(false)}
                onSuccess={handleImportSuccess}
                slug={slug}
            />

            <ShareRegistrationLinkModal
                visible={qrModalVisible}
                onClose={() => setQrModalVisible(false)}
                slug={slug}
            />

            <ActionMenu
                visible={importExportMenuVisible}
                onClose={() => setImportExportMenuVisible(false)}
                title={t.importExport}
                options={[
                    { label: t.importCsv, onPress: () => setImportModalVisible(true) },
                    { label: t.exportCsv, onPress: handleExportCSV },
                ]}
            />

            <ActionMenu
                visible={!!optionsMenuTarget}
                onClose={() => setOptionsMenuTarget(null)}
                title={optionsMenuTarget?.name}
                options={[
                    { label: t.edit, onPress: () => handleEdit(optionsMenuTarget) },
                    { label: t.resendInvite, onPress: () => handleResendInvite(optionsMenuTarget) },
                    { label: t.delete, onPress: () => handleDelete(optionsMenuTarget), destructive: true },
                ]}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        padding: 4,
        alignSelf: 'flex-start',
        marginLeft: -4,
        marginBottom: 8,
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
    cardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    cardAvatar: {
        marginRight: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '500',
    },
    contactInfo: {
        gap: 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        marginTop: 1,
    },
    contactText: {
        fontSize: 14,
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
