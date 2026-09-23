import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    nameRequired: 'Nome do serviço é obrigatório',
    priceInvalid: 'Preço deve ser maior que zero',
    durationInvalid: 'Duração deve ser maior que zero',
    errorTitle: 'Erro',
    saveError: 'Ocorreu um erro ao salvar o serviço.',
    editTitle: 'Editar Serviço',
    newTitle: 'Novo Serviço',
    cancel: 'Cancelar',
    save: 'Salvar',
    name: 'Nome',
    namePlaceholder: 'Ex.: Corte de cabelo',
    price: 'Preço (€)',
    duration: 'Duração (min)',
  },
  en: {
    nameRequired: 'Service name is required',
    priceInvalid: 'Price must be greater than zero',
    durationInvalid: 'Duration must be greater than zero',
    errorTitle: 'Error',
    saveError: 'An error occurred while saving the service.',
    editTitle: 'Edit Service',
    newTitle: 'New Service',
    cancel: 'Cancel',
    save: 'Save',
    name: 'Name',
    namePlaceholder: 'E.g.: Haircut',
    price: 'Price (€)',
    duration: 'Duration (min)',
  },
} as const;

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
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
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
      newErrors.name = t.nameRequired;
    }

    const price = parseFloat(form.price_eur.replace(',', '.'));
    if (!form.price_eur.trim() || Number.isNaN(price) || price <= 0) {
      newErrors.price_eur = t.priceInvalid;
    }

    const duration = parseInt(form.duration_minutes, 10);
    if (!form.duration_minutes.trim() || Number.isNaN(duration) || duration <= 0) {
      newErrors.duration_minutes = t.durationInvalid;
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
      Alert.alert(t.errorTitle, t.saveError);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={initialData ? t.editTitle : t.newTitle}
      footer={
        <>
          <Button variant="secondary" onPress={onClose} style={{ flex: 1 }}>
            {t.cancel}
          </Button>
          <Button onPress={handleSubmit} loading={busy} disabled={busy} style={{ flex: 1 }}>
            {t.save}
          </Button>
        </>
      }
    >
      <View style={styles.formContent}>
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
            label={t.price}
            placeholder="0.00"
            value={form.price_eur}
            onChangeText={(text) => setForm({ ...form, price_eur: text })}
            keyboardType="decimal-pad"
            error={errors.price_eur}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={t.duration}
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
