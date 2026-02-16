import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface CustomerData {
    id?: string;
    name: string;
    email: string;
    phone_number: string;
    notes: string;
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

    const [form, setForm] = useState<CustomerData>({
        name: '',
        email: '',
        phone_number: '',
        notes: '',
    });

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
                });
            } else {
                setForm({
                    name: '',
                    email: '',
                    phone_number: '',
                    notes: '',
                });
            }
            setErrors({});
        }
    }, [visible, initialData]);

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
            await onSubmit(form);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro ao salvar o cliente.');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>
                            {initialData ? 'Editar Cliente' : 'Novo Cliente'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
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
                                placeholder="cliente@email.com"
                                value={form.email}
                                onChangeText={(text) => setForm({ ...form, email: text })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

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
                                label="Notas"
                                placeholder="Preferências, observações..."
                                value={form.notes}
                                onChangeText={(text) => setForm({ ...form, notes: text })}
                                multiline
                                numberOfLines={3}
                                style={{ height: 80, textAlignVertical: 'top' }}
                            />
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <Button
                            variant="link"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: 8 }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="link"
                            onPress={handleSubmit}
                            loading={busy}
                            disabled={busy}
                            style={{ flex: 1, marginLeft: 8 }}
                        >
                            Salvar
                        </Button>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    formContainer: {
        maxHeight: 500,
    },
    formContent: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
});
