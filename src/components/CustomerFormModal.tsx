import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { hasValidProfileImageDimensions } from '../utils/imageLimits';
import { Modal } from './ui/Modal';
import { Avatar } from './ui/Avatar';
import { resolveMediaUrl } from '../utils/env';
import { useTenant } from '../hooks/useTenant';
import { CustomerFormsSection } from './CustomerFormsSection';

const COPY = {
    pt: {
        nameRequired: 'Nome é obrigatório',
        contactRequired: 'Informe e-mail ou telefone',
        errorTitle: 'Erro',
        saveError: 'Ocorreu um erro ao salvar o cliente.',
        unsupportedFormat: 'Formato não suportado. Use JPEG, PNG, GIF ou WEBP.',
        fileTooLarge: 'O ficheiro deve ter no máximo 2MB.',
        invalidDimensions: 'A imagem deve ter entre 50x50 e 2000x2000 pixels.',
        galleryPermission: 'Permissão de galeria necessária.',
        cameraPermission: 'Permissão de câmara necessária.',
        editTitle: 'Editar Cliente',
        newTitle: 'Novo Cliente',
        cancel: 'Cancelar',
        save: 'Salvar',
        changePhoto: 'Alterar foto',
        addPhoto: 'Adicionar foto',
        name: 'Nome',
        namePlaceholder: 'Nome completo',
        email: 'E-mail',
        phone: 'Telefone',
        notes: 'Notas',
        notesPlaceholder: 'Preferências, observações...',
        photoMenuTitle: 'Foto do cliente',
        chooseFromGallery: 'Escolher da galeria',
        takePhoto: 'Tirar foto',
    },
    en: {
        nameRequired: 'Name is required',
        contactRequired: 'Provide an email or phone number',
        errorTitle: 'Error',
        saveError: 'An error occurred while saving the customer.',
        unsupportedFormat: 'Unsupported format. Use JPEG, PNG, GIF or WEBP.',
        fileTooLarge: 'The file must be at most 2MB.',
        invalidDimensions: 'The image must be between 50x50 and 2000x2000 pixels.',
        galleryPermission: 'Gallery permission required.',
        cameraPermission: 'Camera permission required.',
        editTitle: 'Edit Customer',
        newTitle: 'New Customer',
        cancel: 'Cancel',
        save: 'Save',
        changePhoto: 'Change photo',
        addPhoto: 'Add photo',
        name: 'Name',
        namePlaceholder: 'Full name',
        email: 'Email',
        phone: 'Phone',
        notes: 'Notes',
        notesPlaceholder: 'Preferences, notes...',
        photoMenuTitle: 'Customer photo',
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

interface CustomerData {
    id?: string;
    name: string;
    email: string;
    phone_number: string;
    notes: string;
    photo?: string | null;
    photoFile?: PickedPhoto;
}

interface CustomerFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CustomerData) => Promise<void>;
    initialData?: CustomerData | null;
    busy?: boolean;
}

export function CustomerFormModal({ visible, onClose, onSubmit, initialData, busy = false }: CustomerFormModalProps) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const t = language === 'en' ? COPY.en : COPY.pt;
    const { slug } = useTenant();

    const [form, setForm] = useState<CustomerData>({
        name: '',
        email: '',
        phone_number: '',
        notes: '',
    });
    const [pickedPhoto, setPickedPhoto] = useState<PickedPhoto | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setForm({
                    id: initialData.id,
                    name: initialData.name || '',
                    email: initialData.email || '',
                    phone_number: initialData.phone_number || '',
                    notes: initialData.notes || '',
                    photo: initialData.photo || null,
                });
            } else {
                setForm({
                    name: '',
                    email: '',
                    phone_number: '',
                    notes: '',
                });
            }
            setPickedPhoto(null);
            setPhotoError(null);
            setErrors({});
        }
    }, [visible, initialData]);

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
            await onSubmit(pickedPhoto ? { ...form, photoFile: pickedPhoto } : form);
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

        if (!hasValidProfileImageDimensions(asset)) {
            setPhotoError(t.invalidDimensions);
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

    // Opções de foto inline (sem 2.º Modal): no iOS um Modal irmão apresentado por
    // cima do modal do formulário não aparece e deixa a tela sem toques ao fechar.
    const handleChooseFromGallery = () => {
        setPhotoMenuVisible(false);
        void handlePickFromGallery();
    };

    const handleChooseTakePhoto = () => {
        setPhotoMenuVisible(false);
        void handleTakePhoto();
    };

    const handlePickPhoto = () => {
        setPhotoMenuVisible((visible) => !visible);
    };

    const previewUri = pickedPhoto?.uri || resolveMediaUrl(form.photo);

    return (
        <>
        <Modal
            visible={visible}
            onClose={onClose}
            title={initialData ? t.editTitle : t.newTitle}
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
                        onPress={handleSubmit}
                        loading={busy}
                        disabled={busy}
                        style={{ flex: 1 }}
                    >
                        {t.save}
                    </Button>
                </>
            }
        >
            <View style={styles.formContent}>
                <View style={styles.photoSection}>
                    <Avatar testID="customer-form-avatar" uri={previewUri} name={form.name} size={72} />
                    <TouchableOpacity onPress={handlePickPhoto}>
                        <Text style={{ color: colors.brandPrimary, fontWeight: '600', marginTop: 8 }}>
                            {previewUri ? t.changePhoto : t.addPhoto}
                        </Text>
                    </TouchableOpacity>
                    {photoError && (
                        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{photoError}</Text>
                    )}
                    {photoMenuVisible && (
                        <View style={styles.photoOptions}>
                            <Button variant="link" onPress={handleChooseFromGallery}>
                                {t.chooseFromGallery}
                            </Button>
                            <Button variant="link" onPress={handleChooseTakePhoto}>
                                {t.takePhoto}
                            </Button>
                        </View>
                    )}
                </View>

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
                        placeholder="cliente@email.com"
                        value={form.email}
                        onChangeText={(text) => setForm({ ...form, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

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
                        label={t.notes}
                        placeholder={t.notesPlaceholder}
                        value={form.notes}
                        onChangeText={(text) => setForm({ ...form, notes: text })}
                        multiline
                        numberOfLines={3}
                        style={{ height: 80, textAlignVertical: 'top' }}
                    />
                </View>

                {visible && initialData?.id ? (
                    <CustomerFormsSection key={initialData.id} customerId={initialData.id} slug={slug} />
                ) : null}
            </View>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    formContent: {
        // Padding is handled by Modal
    },
    photoOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        marginTop: 4,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
});
