import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

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
      newErrors.name = 'Nome do item é obrigatório';
    }

    if (!form.unit.trim()) {
      newErrors.unit = 'Unidade é obrigatória';
    }

    if (form.quantity.trim() !== '' && Number.isNaN(Number(form.quantity))) {
      newErrors.quantity = 'Quantidade inválida';
    }

    if (form.minimum_quantity.trim() !== '' && Number.isNaN(Number(form.minimum_quantity))) {
      newErrors.minimum_quantity = 'Estoque mínimo inválido';
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
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o item.');
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'Editar Item' : 'Novo Item'}
      description="Cadastre o item e defina um estoque mínimo para saber quando repor."
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
            placeholder="Ex.: Shampoo profissional 1L"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            error={errors.name}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Unidade"
            placeholder="Ex.: un, ml, kg"
            value={form.unit}
            onChangeText={(text) => setForm({ ...form, unit: text })}
            error={errors.unit}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={initialData ? 'Quantidade atual' : 'Quantidade inicial'}
            placeholder="0"
            value={form.quantity}
            onChangeText={(text) => setForm({ ...form, quantity: text })}
            keyboardType="number-pad"
            error={errors.quantity}
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Estoque mínimo"
            placeholder="Opcional"
            value={form.minimum_quantity}
            onChangeText={(text) => setForm({ ...form, minimum_quantity: text })}
            keyboardType="number-pad"
            error={errors.minimum_quantity}
            description="Quando a quantidade ficar igual ou abaixo deste valor, o item entra em alerta."
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
