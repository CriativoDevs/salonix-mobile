import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

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
            onClose={onClose}
            title={initialData ? 'Editar Cliente' : 'Novo Cliente'}
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
                        onPress={handleSubmit}
                        loading={busy}
                        disabled={busy}
                        style={{ flex: 1 }}
                    >
                        Salvar
                    </Button>
                </>
            }
        >
            <View style={styles.formContent}>
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
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    formContent: {
        // Padding is handled by Modal
    },
    inputGroup: {
        marginBottom: 16,
    },
});
