import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useAuth } from '../hooks/useAuth';

interface SlotFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    professionals: any[];
    busy?: boolean;
}

export function SlotFormModal({ visible, onClose, onSubmit, professionals, busy = false }: SlotFormModalProps) {
    const { colors } = useTheme();
    const { userInfo } = useAuth();

    const [form, setForm] = useState({
        professional_id: '',
        date: new Date(),
        start_time: new Date(),
        end_time: new Date(),
    });

    // Filtrar profissionais com base no papel do usuário
    const availableProfessionals = React.useMemo(() => {
        if (!userInfo) return [];
        
        // Se for admin/manager/owner, vê todos
        const isAdmin = userInfo.is_superuser || userInfo.role === 'owner' || userInfo.role === 'manager';
        
        if (isAdmin) {
            return professionals;
        }

        // Se for colaborador, só vê a si mesmo
        return professionals.filter(p => 
            (p.user === userInfo.id) || 
            (p.email === userInfo.email) ||
            (p.staff_member === userInfo.id)
        );
    }, [professionals, userInfo]);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (visible) {
            // Reset form when modal opens
            const now = new Date();
            const startTime = new Date(now);
            startTime.setHours(9, 0, 0, 0);
            const endTime = new Date(now);
            endTime.setHours(10, 0, 0, 0);

            setForm({
                professional_id: availableProfessionals.length > 0 ? String(availableProfessionals[0].id) : '',
                date: now,
                start_time: startTime,
                end_time: endTime,
            });
            setErrors({});
        }
    }, [visible, availableProfessionals]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.professional_id) {
            newErrors.professional = 'Selecione um profissional';
        }

        if (form.end_time <= form.start_time) {
            newErrors.time = 'Horário de término deve ser após o início';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            const startDateTime = new Date(form.date);
            startDateTime.setHours(form.start_time.getHours(), form.start_time.getMinutes(), 0, 0);

            const endDateTime = new Date(form.date);
            endDateTime.setHours(form.end_time.getHours(), form.end_time.getMinutes(), 0, 0);

            await onSubmit({
                professional_id: form.professional_id,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro ao criar o horário.');
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Modal
            visible={visible}
            onClose={onClose}
            title="Criar Horário Disponível"
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
                        Criar
                    </Button>
                </>
            }
        >
            <View style={styles.formContent}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Profissional</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Picker
                            selectedValue={form.professional_id}
                            onValueChange={(value) => setForm({ ...form, professional_id: String(value) })}
                            style={{ color: colors.textPrimary }}
                            enabled={availableProfessionals.length > 1}
                        >
                            <Picker.Item label="Selecione..." value="" />
                            {availableProfessionals.map((prof) => (
                                <Picker.Item key={prof.id} label={prof.name} value={String(prof.id)} />
                            ))}
                        </Picker>
                    </View>
                    {errors.professional && (
                        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
                            {errors.professional}
                        </Text>
                    )}
                </View>

                {/* Date Picker */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Data</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: colors.textPrimary }}>{formatDate(form.date)}</Text>
                        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={form.date}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    setForm({ ...form, date: selectedDate });
                                }
                            }}
                        />
                    )}
                </View>

                {/* Start Time */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Horário de Início</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowStartTimePicker(true)}
                    >
                        <Text style={{ color: colors.textPrimary }}>{formatTime(form.start_time)}</Text>
                        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showStartTimePicker && (
                        <DateTimePicker
                            value={form.start_time}
                            mode="time"
                            display="default"
                            onChange={(event, selectedTime) => {
                                setShowStartTimePicker(false);
                                if (selectedTime) {
                                    setForm({ ...form, start_time: selectedTime });
                                }
                            }}
                        />
                    )}
                </View>

                {/* End Time */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Horário de Término</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowEndTimePicker(true)}
                    >
                        <Text style={{ color: colors.textPrimary }}>{formatTime(form.end_time)}</Text>
                        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showEndTimePicker && (
                        <DateTimePicker
                            value={form.end_time}
                            mode="time"
                            display="default"
                            onChange={(event, selectedTime) => {
                                setShowEndTimePicker(false);
                                if (selectedTime) {
                                    setForm({ ...form, end_time: selectedTime });
                                }
                            }}
                        />
                    )}
                    {errors.time && (
                        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
                            {errors.time}
                        </Text>
                    )}
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
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
});
