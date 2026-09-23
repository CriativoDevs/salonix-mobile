import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    nameRequired: 'Nome do item é obrigatório',
    unitRequired: 'Unidade é obrigatória',
    invalidQuantity: 'Quantidade inválida',
    invalidMinimum: 'Estoque mínimo inválido',
    errorTitle: 'Erro',
    saveError: 'Ocorreu um erro ao salvar o item.',
    editTitle: 'Editar Item',
    newTitle: 'Novo Item',
    description: 'Cadastre o item e defina um estoque mínimo para saber quando repor.',
    cancel: 'Cancelar',
    save: 'Salvar',
    name: 'Nome',
    namePlaceholder: 'Ex.: Shampoo profissional 1L',
    unit: 'Unidade',
    unitPlaceholder: 'Ex.: un, ml, kg',
    currentQuantity: 'Quantidade atual',
    initialQuantity: 'Quantidade inicial',
    minimumStock: 'Estoque mínimo',
    optional: 'Opcional',
    minimumStockDescription: 'Quando a quantidade ficar igual ou abaixo deste valor, o item entra em alerta.',
  },
  en: {
    nameRequired: 'Item name is required',
    unitRequired: 'Unit is required',
    invalidQuantity: 'Invalid quantity',
    invalidMinimum: 'Invalid minimum stock',
    errorTitle: 'Error',
    saveError: 'An error occurred while saving the item.',
    editTitle: 'Edit Item',
    newTitle: 'New Item',
    description: 'Register the item and set a minimum stock to know when to restock.',
    cancel: 'Cancel',
    save: 'Save',
    name: 'Name',
    namePlaceholder: 'E.g.: Professional shampoo 1L',
    unit: 'Unit',
    unitPlaceholder: 'E.g.: unit, ml, kg',
    currentQuantity: 'Current quantity',
    initialQuantity: 'Initial quantity',
    minimumStock: 'Minimum stock',
    optional: 'Optional',
    minimumStockDescription: 'When the quantity reaches or falls below this value, the item enters alert status.',
  },
} as const;

interface InventoryItemFormData {
  id?: string | number;
  name: string;
  unit: string;
  quantity: string;
  minimum_quantity: string;
}

interface InventoryItemSubmitPayload {
  name: string;
  unit: string;
  quantity: number;
  minimum_quantity: number | null;
}

interface InventoryItemFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryItemSubmitPayload) => Promise<void>;
  initialData?: {
    id?: string | number;
    name: string;
    unit: string;
    quantity: string | number;
    minimum_quantity?: string | number | null;
  } | null;
  busy?: boolean;
}

const EMPTY_FORM: InventoryItemFormData = { name: '', unit: '', quantity: '0', minimum_quantity: '' };

export function InventoryItemFormModal({ visible, onClose, onSubmit, initialData, busy = false }: InventoryItemFormModalProps) {
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const [form, setForm] = useState<InventoryItemFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setForm({
          id: initialData.id,
          name: initialData.name || '',
          unit: initialData.unit || '',
          quantity: initialData.quantity != null ? String(initialData.quantity) : '0',
          minimum_quantity:
            initialData.minimum_quantity != null ? String(initialData.minimum_quantity) : '',
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

    if (!form.unit.trim()) {
      newErrors.unit = t.unitRequired;
    }

    if (form.quantity.trim() !== '' && Number.isNaN(Number(form.quantity))) {
      newErrors.quantity = t.invalidQuantity;
    }

    if (form.minimum_quantity.trim() !== '' && Number.isNaN(Number(form.minimum_quantity))) {
      newErrors.minimum_quantity = t.invalidMinimum;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit({
        name: form.name.trim(),
        unit: form.unit.trim(),
        quantity: form.quantity.trim() === '' ? 0 : Number(form.quantity),
        minimum_quantity: form.minimum_quantity.trim() === '' ? null : Number(form.minimum_quantity),
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
      description={t.description}
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
            label={t.unit}
            placeholder={t.unitPlaceholder}
            value={form.unit}
            onChangeText={(text) => setForm({ ...form, unit: text })}
            error={errors.unit}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={initialData ? t.currentQuantity : t.initialQuantity}
            placeholder="0"
            value={form.quantity}
            onChangeText={(text) => setForm({ ...form, quantity: text })}
            keyboardType="number-pad"
            error={errors.quantity}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={t.minimumStock}
            placeholder={t.optional}
            value={form.minimum_quantity}
            onChangeText={(text) => setForm({ ...form, minimum_quantity: text })}
            keyboardType="number-pad"
            error={errors.minimum_quantity}
            description={t.minimumStockDescription}
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
