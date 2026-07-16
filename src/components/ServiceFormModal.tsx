import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface ServiceFormData {
  id?: string | number;
  name: string;
  price_eur: string;
  duration_minutes: string;
}

interface ServiceSubmitPayload {
  name: string;
  price_eur: string;
  duration_minutes: number;
}

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceSubmitPayload) => Promise<void>;
  initialData?: {
    id?: string | number;
    name: string;
    price_eur: string | number;
    duration_minutes: string | number;
  } | null;
  busy?: boolean;
}

const EMPTY_FORM: ServiceFormData = { name: '', price_eur: '', duration_minutes: '' };

export function ServiceFormModal({ visible, onClose, onSubmit, initialData, busy = false }: ServiceFormModalProps) {
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setForm({
          id: initialData.id,
          name: initialData.name || '',
          price_eur: initialData.price_eur != null ? String(initialData.price_eur) : '',
          duration_minutes: initialData.duration_minutes != null ? String(initialData.duration_minutes) : '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [visible, initialData]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = 'Nome do serviço é obrigatório';
    }

    const price = parseFloat(form.price_eur.replace(',', '.'));
    if (!form.price_eur.trim() || Number.isNaN(price) || price <= 0) {
      newErrors.price_eur = 'Preço deve ser maior que zero';
    }

    const duration = parseInt(form.duration_minutes, 10);
    if (!form.duration_minutes.trim() || Number.isNaN(duration) || duration <= 0) {
      newErrors.duration_minutes = 'Duração deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const price = parseFloat(form.price_eur.replace(',', '.'));
    const duration = parseInt(form.duration_minutes, 10);

    try {
      await onSubmit({
        name: form.name.trim(),
        price_eur: price.toFixed(2),
        duration_minutes: duration,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o serviço.');
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'Editar Serviço' : 'Novo Serviço'}
      footer={
        <>
          <Button variant="secondary" onPress={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button onPress={handleSubmit} loading={busy} disabled={busy} style={{ flex: 1 }}>
            Salvar
          </Button>
        </>
      }
    >
      <View style={styles.formContent}>
        <View style={styles.inputGroup}>
          <Input
            label="Nome"
            placeholder="Ex.: Corte de cabelo"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            error={errors.name}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Preço (€)"
            placeholder="0.00"
            value={form.price_eur}
            onChangeText={(text) => setForm({ ...form, price_eur: text })}
            keyboardType="decimal-pad"
            error={errors.price_eur}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Duração (min)"
            placeholder="30"
            value={form.duration_minutes}
            onChangeText={(text) => setForm({ ...form, duration_minutes: text })}
            keyboardType="number-pad"
            error={errors.duration_minutes}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  formContent: {},
  inputGroup: {
    marginBottom: 16,
  },
});
