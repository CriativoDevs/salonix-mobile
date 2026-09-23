import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal'; // Importando o Modal genérico flutuante
import { Avatar } from './ui/Avatar';
import { ActionMenu } from './ui/ActionMenu';
import { updateStaffMember, disableStaffMember } from '../api/staff';
import { resolveMediaUrl } from '../utils/env';
import { useToast } from '../contexts/ToastContext';

import { useTenant } from '../hooks/useTenant';
import { fetchServices } from '../api/services';

const COPY = {
    pt: {
        nameRequired: 'Nome é obrigatório',
        contactRequired: 'Informe e-mail ou telefone',
        errorTitle: 'Erro',
        saveError: 'Ocorreu um erro ao salvar o profissional.',
        unsupportedFormat: 'Formato não suportado. Use JPEG, PNG, GIF ou WEBP.',
        fileTooLarge: 'O ficheiro deve ter no máximo 2MB.',
        galleryPermission: 'Permissão de galeria necessária.',
        cameraPermission: 'Permissão de câmara necessária.',
        noLinkedUser: 'Este profissional não tem um usuário vinculado para gerenciar permissões.',
        permissionsUpdated: 'Permissões atualizadas com sucesso.',
        permissionsUpdateError: 'Não foi possível atualizar as permissões.',
        editTitle: 'Editar Profissional',
        newTitle: 'Novo Profissional',
        cancel: 'Cancelar',
        save: 'Salvar',
        invite: 'Convidar',
        savePermissions: 'Salvar Permissões',
        professionalDataTab: 'Dados Profissionais',
        permissionsTab: 'Permissões',
        changePhoto: 'Alterar foto',
        addPhoto: 'Adicionar foto',
        name: 'Nome',
        namePlaceholder: 'Nome completo',
        email: 'E-mail',
        phone: 'Telefone',
        specialty: 'Especialidade',
        specialtyPlaceholder: 'Ex: Cabeleireiro Senior',
        bio: 'Bio / Observações',
        bioPlaceholder: 'Breve descrição...',
        servicesProvided: 'Serviços Prestados',
        noServicesRegistered: 'Nenhum serviço cadastrado no salão.',
        professionalInfo: 'Informações Profissionais',
        nameLabel: 'Nome:',
        emailLabel: 'E-mail:',
        role: 'Papel',
        collaborator: 'Colaborador',
        manager: 'Gerente (Manager)',
        statusAndAccess: 'Status e acesso',
        statusHint: 'Alterar o status ajusta o acesso deste membro ao painel.',
        activate: 'Ativar',
        deactivate: 'Desativar',
        photoMenuTitle: 'Foto do profissional',
        chooseFromGallery: 'Escolher da galeria',
        takePhoto: 'Tirar foto',
    },
    en: {
        nameRequired: 'Name is required',
        contactRequired: 'Provide an email or phone number',
        errorTitle: 'Error',
        saveError: 'An error occurred while saving the professional.',
        unsupportedFormat: 'Unsupported format. Use JPEG, PNG, GIF or WEBP.',
        fileTooLarge: 'The file must be at most 2MB.',
        galleryPermission: 'Gallery permission required.',
        cameraPermission: 'Camera permission required.',
        noLinkedUser: 'This professional has no linked user to manage permissions.',
        permissionsUpdated: 'Permissions updated successfully.',
        permissionsUpdateError: 'Could not update the permissions.',
        editTitle: 'Edit Professional',
        newTitle: 'New Professional',
        cancel: 'Cancel',
        save: 'Save',
        invite: 'Invite',
        savePermissions: 'Save Permissions',
        professionalDataTab: 'Professional Data',
        permissionsTab: 'Permissions',
        changePhoto: 'Change photo',
        addPhoto: 'Add photo',
        name: 'Name',
        namePlaceholder: 'Full name',
        email: 'Email',
        phone: 'Phone',
        specialty: 'Specialty',
        specialtyPlaceholder: 'E.g.: Senior Hairdresser',
        bio: 'Bio / Notes',
        bioPlaceholder: 'Short description...',
        servicesProvided: 'Services Provided',
        noServicesRegistered: 'No service registered at this business.',
        professionalInfo: 'Professional Information',
        nameLabel: 'Name:',
        emailLabel: 'Email:',
        role: 'Role',
        collaborator: 'Collaborator',
        manager: 'Manager',
        statusAndAccess: 'Status and access',
        statusHint: "Changing the status adjusts this member's access to the dashboard.",
        activate: 'Activate',
        deactivate: 'Deactivate',
        photoMenuTitle: 'Professional photo',
        chooseFromGallery: 'Choose from gallery',
        takePhoto: 'Take photo',
    },
} as const;

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface PickedPhoto {
    uri: string;
    name: string;
    mimeType: string;
}

interface ProfessionalData {
    id?: string;
    name: string;
    email: string;
    phone_number: string;
    job_title?: string;
    bio?: string;
    photo?: string | null;
    photoFile?: PickedPhoto;
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
    const { language } = useLanguage();
    const t = language === 'en' ? COPY.en : COPY.pt;
    const { slug } = useTenant();
    const { showToast } = useToast();
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
    const [pickedPhoto, setPickedPhoto] = useState<PickedPhoto | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

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
                    photo: initialData.photo || initialData.staff_member_data?.photo || null,
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
            setPickedPhoto(null);
            setPhotoError(null);
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
            newErrors.name = t.nameRequired;
        }

        if (!form.email.trim() && !form.phone_number.trim()) {
            newErrors.contact = t.contactRequired;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await onSubmit({
                ...form,
                service_ids: selectedServiceIds,
                ...(pickedPhoto ? { photoFile: pickedPhoto } : {}),
            });
        } catch (error) {
            console.error(error);
            Alert.alert(t.errorTitle, t.saveError);
        }
    };

    const validateAndSetPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
        const mimeType = asset.mimeType || 'image/jpeg';

        if (!ALLOWED_PHOTO_MIME_TYPES.includes(mimeType)) {
            setPhotoError(t.unsupportedFormat);
            return;
        }

        const info = await FileSystem.getInfoAsync(asset.uri);
        if (info.exists && typeof info.size === 'number' && info.size > MAX_PHOTO_BYTES) {
            setPhotoError(t.fileTooLarge);
            return;
        }

        setPhotoError(null);
        setPickedPhoto({
            uri: asset.uri,
            name: asset.fileName || 'photo.jpg',
            mimeType,
        });
    };

    const handlePickFromGallery = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(t.errorTitle, t.galleryPermission);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (result.canceled || !result.assets?.[0]) return;

        await validateAndSetPhoto(result.assets[0]);
    };

    const handleTakePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(t.errorTitle, t.cameraPermission);
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (result.canceled || !result.assets?.[0]) return;

        await validateAndSetPhoto(result.assets[0]);
    };

    const handlePickPhoto = () => {
        setPhotoMenuVisible(true);
    };

    const previewUri = pickedPhoto?.uri || resolveMediaUrl(form.photo);

    const handleUpdatePermissions = async () => {
        if (!initialData?.user?.id && !initialData?.staff_member) {
            showToast({ type: 'warning', message: t.noLinkedUser });
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
                showToast({ type: 'success', message: t.permissionsUpdated });
                onClose(); // Close modal on success or maybe just refresh data?
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            Alert.alert(t.errorTitle, t.permissionsUpdateError);
        } finally {
            setPermissionLoading(false);
        }
    };

    return (
        <>
        <Modal
            visible={visible}
            onClose={onClose}
            title={initialData ? t.editTitle : t.newTitle}
            size="lg"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onPress={onClose}
                        style={{ flex: 1 }}
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        onPress={activeTab === 'details' ? handleSubmit : handleUpdatePermissions}
                        loading={activeTab === 'details' ? busy : permissionLoading}
                        style={{ flex: 1 }}
                    >
                        {activeTab === 'details' ? (initialData ? t.save : t.invite) : t.savePermissions}
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
                                {t.professionalDataTab}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'permissions' && { borderBottomColor: colors.brandPrimary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('permissions')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'permissions' ? colors.brandPrimary : colors.textSecondary }]}>
                                {t.permissionsTab}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.formContent}>
                    {activeTab === 'details' ? (
                        <>
                            {isEditing && (
                                <View style={styles.photoSection}>
                                    <Avatar testID="professional-form-avatar" uri={previewUri} name={form.name} size={72} />
                                    <TouchableOpacity onPress={handlePickPhoto}>
                                        <Text style={{ color: colors.brandPrimary, fontWeight: '600', marginTop: 8 }}>
                                            {previewUri ? t.changePhoto : t.addPhoto}
                                        </Text>
                                    </TouchableOpacity>
                                    {photoError && (
                                        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{photoError}</Text>
                                    )}
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Input
                                    label={t.name}
                                    placeholder={t.namePlaceholder}
                                    value={form.name}
                                    onChangeText={(text) => setForm({ ...form, name: text })}
                                    error={errors.name}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Input
                                    label={t.email}
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
                                            label={t.phone}
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
                                            label={t.specialty}
                                            placeholder={t.specialtyPlaceholder}
                                            value={form.job_title}
                                            onChangeText={(text) => setForm({ ...form, job_title: text })}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Input
                                            label={t.bio}
                                            placeholder={t.bioPlaceholder}
                                            value={form.bio}
                                            onChangeText={(text) => setForm({ ...form, bio: text })}
                                            multiline
                                            numberOfLines={3}
                                            style={{ height: 80, textAlignVertical: 'top' }}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>{t.servicesProvided}</Text>
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
                                                    {t.noServicesRegistered}
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
                                <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>{t.professionalInfo}</Text>
                                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                                    <Text style={{ fontWeight: '600' }}>{t.nameLabel}</Text> {form.name}
                                </Text>
                                <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
                                    <Text style={{ fontWeight: '600' }}>{t.emailLabel}</Text> {form.email || '—'}
                                </Text>
                            </View>

                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.role}</Text>

                            <TouchableOpacity
                                style={[styles.radioOption, { borderColor: permissionsForm.role === 'collaborator' ? colors.brandPrimary : colors.border }]}
                                onPress={() => setPermissionsForm({ ...permissionsForm, role: 'collaborator' })}
                            >
                                <View style={[styles.radioCircle, { borderColor: permissionsForm.role === 'collaborator' ? colors.brandPrimary : colors.textSecondary }]}>
                                    {permissionsForm.role === 'collaborator' && <View style={[styles.radioDot, { backgroundColor: colors.brandPrimary }]} />}
                                </View>
                                <Text style={[styles.radioText, { color: colors.textPrimary }]}>{t.collaborator}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.radioOption, { borderColor: permissionsForm.role === 'manager' ? colors.brandPrimary : colors.border }]}
                                onPress={() => setPermissionsForm({ ...permissionsForm, role: 'manager' })}
                            >
                                <View style={[styles.radioCircle, { borderColor: permissionsForm.role === 'manager' ? colors.brandPrimary : colors.textSecondary }]}>
                                    {permissionsForm.role === 'manager' && <View style={[styles.radioDot, { backgroundColor: colors.brandPrimary }]} />}
                                </View>
                                <Text style={[styles.radioText, { color: colors.textPrimary }]}>{t.manager}</Text>
                            </TouchableOpacity>

                            <View style={[styles.statusBox, { backgroundColor: colors.surfaceVariant, marginTop: 24 }]}>
                                <View>
                                    <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>{t.statusAndAccess}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                        {t.statusHint}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
                                    <TouchableOpacity onPress={() => setPermissionsForm({ ...permissionsForm, is_active: true })}>
                                        <Text style={{ color: permissionsForm.is_active ? colors.success : colors.textSecondary, fontWeight: '600' }}>{t.activate}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setPermissionsForm({ ...permissionsForm, is_active: false })}>
                                        <Text style={{ color: !permissionsForm.is_active ? colors.error : colors.textSecondary, fontWeight: '600' }}>{t.deactivate}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>

        <ActionMenu
            visible={photoMenuVisible}
            onClose={() => setPhotoMenuVisible(false)}
            title={t.photoMenuTitle}
            options={[
                { label: t.chooseFromGallery, onPress: handlePickFromGallery },
                { label: t.takePhoto, onPress: handleTakePhoto },
            ]}
        />
        </>
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
    photoSection: {
        alignItems: 'center',
        marginBottom: 20,
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
