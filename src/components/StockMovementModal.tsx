import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    quantityRequired: 'Informe uma quantidade maior que zero.',
    title: 'Registrar movimentação',
    description: (name: string) => `Registre uma entrada ou saída para ${name}.`,
    cancel: 'Cancelar',
    register: 'Registrar',
    movementType: 'Tipo de movimentação',
    entry: 'Entrada',
    exit: 'Saída',
    quantity: 'Quantidade',
    notesOptional: 'Notas (opcional)',
    notesPlaceholder: 'Ex.: Reposição do fornecedor',
  },
  en: {
    quantityRequired: 'Enter a quantity greater than zero.',
    title: 'Register movement',
    description: (name: string) => `Register an entry or exit for ${name}.`,
    cancel: 'Cancel',
    register: 'Register',
    movementType: 'Movement type',
    entry: 'Entry',
    exit: 'Exit',
    quantity: 'Quantity',
    notesOptional: 'Notes (optional)',
    notesPlaceholder: 'E.g.: Supplier restock',
  },
} as const;

export type StockMovementType = 'in' | 'out';

interface StockMovementSubmitPayload {
  movement_type: StockMovementType;
  quantity: number;
  notes: string;
}

interface StockMovementModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: StockMovementSubmitPayload) => Promise<void>;
  item?: { id: string | number; name: string; unit?: string } | null;
  busy?: boolean;
  errorMessage?: string | null;
}

export function StockMovementModal({
  visible,
  onClose,
  onSubmit,
  item,
  busy = false,
  errorMessage,
}: StockMovementModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const [movementType, setMovementType] = useState<StockMovementType>('in');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMovementType('in');
      setQuantity('');
      setNotes('');
      setLocalError(null);
    }
  }, [visible, item]);

  const handleSubmit = async () => {
    const quantityNumber = Number(quantity);
    if (quantity.trim() === '' || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      setLocalError(t.quantityRequired);
      return;
    }
    setLocalError(null);

    try {
      await onSubmit({
        movement_type: movementType,
        quantity: quantityNumber,
        notes: notes.trim(),
      });
    } catch (error) {
      // Erro de servidor é tratado pelo chamador via `errorMessage`.
    }
  };

  const displayError = localError || errorMessage;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t.title}
      description={item?.name ? t.description(item.name) : undefined}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onPress={onClose} disabled={busy} style={{ flex: 1 }}>
            {t.cancel}
          </Button>
          <Button onPress={handleSubmit} loading={busy} disabled={busy} style={{ flex: 1 }}>
            {t.register}
          </Button>
        </>
      }
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t.movementType}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              testID="stock-movement-type-in"
              onPress={() => setMovementType('in')}
              style={[
                styles.typeOption,
                {
                  borderColor: movementType === 'in' ? colors.success : colors.border,
                  backgroundColor: movementType === 'in' ? colors.successBackground : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  color: movementType === 'in' ? colors.success : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                {t.entry}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="stock-movement-type-out"
              onPress={() => setMovementType('out')}
              style={[
                styles.typeOption,
                {
                  borderColor: movementType === 'out' ? colors.error : colors.border,
                  backgroundColor: movementType === 'out' ? colors.errorBackground : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  color: movementType === 'out' ? colors.error : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                {t.exit}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={t.quantity}
            placeholder="0"
            value={quantity}
            onChangeText={(text) => {
              setQuantity(text);
              setLocalError(null);
            }}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Input
            label={t.notesOptional}
            placeholder={t.notesPlaceholder}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {displayError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBackground, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontSize: 13 }}>{displayError}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {},
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});
