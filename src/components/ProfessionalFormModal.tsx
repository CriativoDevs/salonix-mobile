import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal'; // Importando o Modal genérico flutuante
import { updateStaffMember, disableStaffMember } from '../api/staff';

import { useTenant } from '../hooks/useTenant';
import { fetchServices } from '../api/services';

interface ProfessionalData {
    id?: string;
    name: string;
    email: string;
    phone_number: string;
    job_title?: string;
    bio?: string;
    user?: any;
    staff_member?: number;
    role?: string;
    is_active?: boolean;
    // Normalized staff member data
    staff_member_data?: any;
    service_ids?: number[];
}

interface ProfessionalFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: ProfessionalData) => Promise<void>;
    initialData?: ProfessionalData | null;
    busy?: boolean;
}

export function ProfessionalFormModal({ visible, onClose, onSubmit, initialData, busy = false }: ProfessionalFormModalProps) {
    const { colors } = useTheme();
    const { slug } = useTenant();
    const [activeTab, setActiveTab] = useState<'details' | 'permissions'>('details');
    
    // Determina se é criação ou edição
    const isEditing = !!initialData;

    const [form, setForm] = useState<ProfessionalData>({
        name: '',
        email: '',
        phone_number: '',
        job_title: '',
        bio: '',
    });

    const [permissionsForm, setPermissionsForm] = useState({
        role: 'collaborator',
        is_active: true,
    });
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [allServices, setAllServices] = useState<any[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [permissionLoading, setPermissionLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            loadServices();
            if (initialData) {
                setForm({
                    id: initialData.id,
                    name: initialData.name || '',
                    email: initialData.email || '',
                    phone_number: initialData.phone_number || '',
                    job_title: initialData.job_title || '',
                    bio: initialData.bio || '',
                });

                // Initialize permissions from data
                setPermissionsForm({
                    role: initialData.role || initialData.user?.role || 'collaborator',
                    is_active: initialData.is_active !== false, // Default true
                });

                setSelectedServiceIds(initialData.service_ids || []);
            } else {
                setForm({
                    name: '',
                    email: '',
                    phone_number: '',
                    job_title: '',
                    bio: '',
                });
                setPermissionsForm({ role: 'collaborator', is_active: true });
                setSelectedServiceIds([]);
            }
            setErrors({});
            setActiveTab('details');
        }
    }, [visible, initialData]);

    const loadServices = async () => {
        if (!slug) return;
        setServicesLoading(true);
        try {
            const data = await fetchServices({ slug } as any);
            setAllServices(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error('Error loading services for modal:', error);
        } finally {
            setServicesLoading(false);
        }
    };

    const toggleService = (id: number) => {
        setSelectedServiceIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (!form.email.trim() && !form.phone_number.trim()) {
            newErrors.contact = 'Informe e-mail ou telefone';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await onSubmit({
                ...form,
                service_ids: selectedServiceIds
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro ao salvar o profissional.');
        }
    };

    const handleUpdatePermissions = async () => {
        if (!initialData?.user?.id && !initialData?.staff_member) {
            Alert.alert('Aviso', 'Este profissional não tem um usuário vinculado para gerenciar permissões.');
            return;
        }

        setPermissionLoading(true);
        try {
            // Determine the staff ID (could be directly on item or nested in user)
            const staffId = initialData.staff_member || initialData.user?.id;

            if (staffId) {
                if (!permissionsForm.is_active) {
                    await disableStaffMember(staffId, { slug });
                } else {
                    // Update role and ensure active
                    // Using updateStaffMember from api/staff.js
                    await updateStaffMember(staffId, {
                        role: permissionsForm.role,
                        is_active: true
                    }, { slug });
                }
                Alert.alert('Sucesso', 'Permissões atualizadas com sucesso.');
                onClose(); // Close modal on success or maybe just refresh data?
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            Alert.alert('Erro', 'Não foi possível atualizar as permissões.');
        } finally {
            setPermissionLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            onClose={onClose}
            title={initialData ? 'Editar Profissional' : 'Novo Profissional'}
            size="lg"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onPress={onClose}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onPress={activeTab === 'details' ? handleSubmit : handleUpdatePermissions}
                        loading={activeTab === 'details' ? busy : permissionLoading}
                        style={{ flex: 1 }}
                    >
                        {activeTab === 'details' ? (initialData ? 'Salvar' : 'Convidar') : 'Salvar Permissões'}
                    </Button>
                </>
            }
        >
            <View>
                {/* Tabs */}
                {initialData && (
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'details' && { borderBottomColor: colors.brandPrimary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('details')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'details' ? colors.brandPrimary : colors.textSecondary }]}>
                                Dados Profissionais
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'permissions' && { borderBottomColor: colors.brandPrimary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('permissions')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'permissions' ? colors.brandPrimary : colors.textSecondary }]}>
                                Permissões
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.formContent}>
                    {activeTab === 'details' ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Input
                                    label="Nome"
                                    placeholder="Nome completo"
                                    value={form.name}
                                    onChangeText={(text) => setForm({ ...form, name: text })}
                                    error={errors.name}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Input
                                    label="E-mail"
                                    placeholder="profissional@email.com"
                                    value={form.email}
                                    onChangeText={(text) => setForm({ ...form, email: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {isEditing && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Input
                                            label="Telefone"
                                            placeholder="+351 912 345 678"
                                            value={form.phone_number}
                                            onChangeText={(text) => setForm({ ...form, phone_number: text })}
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    {errors.contact && (
                                        <Text style={{ color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 4 }}>
                                            {errors.contact}
                                        </Text>
                                    )}

                                    <View style={styles.inputGroup}>
                                        <Input
                                            label="Especialidade"
                                            placeholder="Ex: Cabeleireiro Senior"
                                            value={form.job_title}
                                            onChangeText={(text) => setForm({ ...form, job_title: text })}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Input
                                            label="Bio / Observações"
                                            placeholder="Breve descrição..."
                                            value={form.bio}
                                            onChangeText={(text) => setForm({ ...form, bio: text })}
                                            multiline
                                            numberOfLines={3}
                                            style={{ height: 80, textAlignVertical: 'top' }}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Serviços Prestados</Text>
                                        <View style={styles.servicesGrid}>
                                            {allServices.map((service) => (
                                                <TouchableOpacity
                                                    key={service.id}
                                                    onPress={() => toggleService(service.id)}
                                                    style={[
                                                        styles.serviceItem,
                                                        {
                                                            borderColor: selectedServiceIds.includes(service.id) ? colors.brandPrimary : colors.border,
                                                            backgroundColor: selectedServiceIds.includes(service.id) ? `${colors.brandPrimary}15` : 'transparent'
                                                        }
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.serviceText,
                                                        { color: selectedServiceIds.includes(service.id) ? colors.brandPrimary : colors.textSecondary }
                                                    ]}>
                                                        {service.name}
                                                    </Text>
                                                    {selectedServiceIds.includes(service.id) && (
                                                        <Ionicons name="checkmark-circle" size={16} color={colors.brandPrimary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                            {allServices.length === 0 && !servicesLoading && (
                                                <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
                                                    Nenhum serviço cadastrado no salão.
                                                </Text>
                                            )}
                                            {servicesLoading && <ActivityIndicator size="small" color={colors.brandPrimary} />}
                                        </View>
                                    </View>
                                </>
                            )}
                        </>
                    ) : (
                        <View style={styles.permissionContainer}>
                            <View style={[styles.infoBox, { backgroundColor: colors.surfaceVariant }]}>
                                <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Informações Profissionais</Text>
                                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                                    <Text style={{ fontWeight: '600' }}>Nome:</Text> {form.name}
                                </Text>
                                <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
                                    <Text style={{ fontWeight: '600' }}>E-mail:</Text> {form.email || '—'}
                                </Text>
                            </View>

                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Papel</Text>

                            <TouchableOpacity
                                style={[styles.radioOption, { borderColor: permissionsForm.role === 'collaborator' ? colors.brandPrimary : colors.border }]}
                                onPress={() => setPermissionsForm({ ...permissionsForm, role: 'collaborator' })}
                            >
                                <View style={[styles.radioCircle, { borderColor: permissionsForm.role === 'collaborator' ? colors.brandPrimary : colors.textSecondary }]}>
                                    {permissionsForm.role === 'collaborator' && <View style={[styles.radioDot, { backgroundColor: colors.brandPrimary }]} />}
                                </View>
                                <Text style={[styles.radioText, { color: colors.textPrimary }]}>Colaborador</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.radioOption, { borderColor: permissionsForm.role === 'manager' ? colors.brandPrimary : colors.border }]}
                                onPress={() => setPermissionsForm({ ...permissionsForm, role: 'manager' })}
                            >
                                <View style={[styles.radioCircle, { borderColor: permissionsForm.role === 'manager' ? colors.brandPrimary : colors.textSecondary }]}>
                                    {permissionsForm.role === 'manager' && <View style={[styles.radioDot, { backgroundColor: colors.brandPrimary }]} />}
                                </View>
                                <Text style={[styles.radioText, { color: colors.textPrimary }]}>Gerente (Manager)</Text>
                            </TouchableOpacity>

                            <View style={[styles.statusBox, { backgroundColor: colors.surfaceVariant, marginTop: 24 }]}>
                                <View>
                                    <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Status e acesso</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                        Alterar o status ajusta o acesso deste membro ao painel.
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
                                    <TouchableOpacity onPress={() => setPermissionsForm({ ...permissionsForm, is_active: true })}>
                                        <Text style={{ color: permissionsForm.is_active ? colors.success : colors.textSecondary, fontWeight: '600' }}>Ativar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setPermissionsForm({ ...permissionsForm, is_active: false })}>
                                        <Text style={{ color: !permissionsForm.is_active ? colors.error : colors.textSecondary, fontWeight: '600' }}>Desativar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 0,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    formContent: {
        // Padding removido pois o Modal já tem padding interno
    },
    inputGroup: {
        marginBottom: 16,
    },
    permissionContainer: {
        paddingVertical: 8,
    },
    infoBox: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    radioDot: {
        height: 10,
        width: 10,
        borderRadius: 5,
    },
    radioText: {
        fontSize: 14,
        fontWeight: '500',
    },
    statusBox: {
        padding: 16,
        borderRadius: 8,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    serviceText: {
        fontSize: 13,
        fontWeight: '500',
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
});
