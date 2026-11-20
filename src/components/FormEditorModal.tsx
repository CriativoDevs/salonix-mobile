import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    editTitle: 'Editar ficha',
    newTitle: 'Nova ficha',
    description:
      'Defina os campos que o cliente preenche. Campos já usados mantêm as respostas ao editar.',
    cancel: 'Cancelar',
    save: 'Salvar',
    formTitle: 'Título da ficha',
    active: 'Ficha ativa',
    clientEditable: 'Permitir que o cliente edite as próprias respostas',
    fields: 'Campos',
    addField: 'Adicionar campo',
    noFields: 'Nenhum campo ainda. Adicione o primeiro campo.',
    fieldLabel: 'Nome do campo',
    fieldType: 'Tipo',
    required: 'Obrigatório',
    options: 'Opções (uma por linha ou separadas por vírgula)',
    moveUp: 'Subir',
    moveDown: 'Descer',
    remove: 'Remover',
    removeTitle: 'Remover campo',
    removeMessage:
      'Ao guardar, as respostas já preenchidas pelos clientes neste campo serão apagadas. Continuar?',
    titleRequired: 'Informe o título da ficha.',
    labelRequired: 'Todos os campos precisam de um nome.',
    optionsRequired: 'Campos de seleção precisam de pelo menos uma opção.',
    types: {
      text: 'Texto curto',
      textarea: 'Texto longo',
      number: 'Número',
      boolean: 'Sim/Não',
      select: 'Seleção',
      date: 'Data',
    },
  },
  en: {
    editTitle: 'Edit form',
    newTitle: 'New form',
    description:
      'Define the fields the client fills in. Fields already in use keep their answers when editing.',
    cancel: 'Cancel',
    save: 'Save',
    formTitle: 'Form title',
    active: 'Active form',
    clientEditable: 'Allow the client to edit their own answers',
    fields: 'Fields',
    addField: 'Add field',
    noFields: 'No fields yet. Add the first field.',
    fieldLabel: 'Field name',
    fieldType: 'Type',
    required: 'Required',
    options: 'Options (one per line or comma-separated)',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove',
    removeTitle: 'Remove field',
    removeMessage:
      'When you save, the answers clients already gave for this field will be deleted. Continue?',
    titleRequired: 'Enter the form title.',
    labelRequired: 'Every field needs a name.',
    optionsRequired: 'Select fields need at least one option.',
    types: {
      text: 'Short text',
      textarea: 'Long text',
      number: 'Number',
      boolean: 'Yes/No',
      select: 'Select',
      date: 'Date',
    },
  },
} as const;

export type FormFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date';
const FIELD_TYPES: FormFieldType[] = ['text', 'textarea', 'number', 'boolean', 'select', 'date'];

export interface FormFieldPayload {
  id?: number;
  label: string;
  field_type: FormFieldType;
  required: boolean;
  options: string[] | null;
  order: number;
}

export interface FormSubmitPayload {
  title: string;
  is_active: boolean;
  client_editable: boolean;
  fields: FormFieldPayload[];
}

interface DraftField {
  key: string;
  id?: number;
  label: string;
  field_type: FormFieldType;
  required: boolean;
  optionsText: string;
}

interface FormEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: FormSubmitPayload) => Promise<void> | void;
  form?: any | null;
  busy?: boolean;
  errorMessage?: string | null;
}

function parseOptions(text: string): string[] {
  return String(text || '')
    .split(/[\n,]/)
    .map((o) => o.trim())
    .filter(Boolean);
}

function fieldFromApi(field: any): DraftField {
  return {
    key: `field-${field.id}`,
    id: field.id,
    label: field.label || '',
    field_type: field.field_type || 'text',
    required: Boolean(field.required),
    optionsText: Array.isArray(field.options) ? field.options.join('\n') : '',
  };
}

export function FormEditorModal({
  visible,
  onClose,
  onSubmit,
  form,
  busy = false,
  errorMessage,
}: FormEditorModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [clientEditable, setClientEditable] = useState(false);
  const [fields, setFields] = useState<DraftField[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!visible) return;
    setTitle(form?.title || '');
    setIsActive(form ? Boolean(form.is_active) : true);
    setClientEditable(Boolean(form?.client_editable));
    setFields(Array.isArray(form?.fields) ? form.fields.map(fieldFromApi) : []);
    setLocalError(null);
  }, [visible, form]);

  const addField = () => {
    seq.current += 1;
    setFields((prev) => [
      ...prev,
      { key: `draft-${seq.current}`, label: '', field_type: 'text', required: false, optionsText: '' },
    ]);
    setLocalError(null);
  };

  const updateField = (key: string, patch: Partial<DraftField>) => {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
    setLocalError(null);
  };

  const moveField = (index: number, delta: number) => {
    setFields((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const doRemove = (key: string) => setFields((prev) => prev.filter((f) => f.key !== key));

  const removeField = (field: DraftField) => {
    if (field.id == null) {
      doRemove(field.key);
      return;
    }
    // Campo existente: remover apaga as respostas dos clientes (BE).
    Alert.alert(t.removeTitle, t.removeMessage, [
      { text: t.cancel, style: 'cancel' },
      { text: t.remove, style: 'destructive', onPress: () => doRemove(field.key) },
    ]);
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setLocalError(t.titleRequired);
      return;
    }
    for (const field of fields) {
      if (!field.label.trim()) {
        setLocalError(t.labelRequired);
        return;
      }
      if (field.field_type === 'select' && parseOptions(field.optionsText).length === 0) {
        setLocalError(t.optionsRequired);
        return;
      }
    }

    await onSubmit({
      title: trimmedTitle,
      is_active: isActive,
      client_editable: clientEditable,
      fields: fields.map((field, index) => {
        const payload: FormFieldPayload = {
          label: field.label.trim(),
          field_type: field.field_type,
          required: field.required,
          options: field.field_type === 'select' ? parseOptions(field.optionsText) : null,
          order: index,
        };
        // id existente preserva as respostas gravadas (sem id o BE recria o campo).
        if (field.id != null) payload.id = field.id;
        return payload;
      }),
    });
  };

  const typeOptions = FIELD_TYPES.map((value) => ({ value, label: t.types[value] }));
  const displayError = localError || errorMessage;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={form?.id ? t.editTitle : t.newTitle}
      description={t.description}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onPress={onClose} disabled={busy} style={{ flex: 1 }}>
            {t.cancel}
          </Button>
          <Button onPress={handleSubmit} loading={busy} disabled={busy} style={{ flex: 1 }}>
            {t.save}
          </Button>
        </>
      }
    >
      <View>
        <View style={styles.group}>
          <Input
            testID="form-title-input"
            label={t.formTitle}
            value={title}
            maxLength={200}
            onChangeText={(text) => {
              setTitle(text);
              setLocalError(null);
            }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>{t.active}</Text>
          <Switch testID="form-active-switch" value={isActive} onValueChange={setIsActive} />
        </View>
        <View style={[styles.switchRow, styles.group]}>
          <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>{t.clientEditable}</Text>
          <Switch
            testID="form-client-editable-switch"
            value={clientEditable}
            onValueChange={setClientEditable}
          />
        </View>

        <View style={styles.fieldsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.fields}</Text>
          <TouchableOpacity testID="form-add-field" onPress={addField} style={styles.addBtn}>
            <Ionicons name="add" size={18} color={colors.brandPrimary} />
            <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600' }}>
              {t.addField}
            </Text>
          </TouchableOpacity>
        </View>

        {fields.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>{t.noFields}</Text>
        ) : (
          fields.map((field, index) => (
            <View
              key={field.key}
              style={[styles.fieldCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <View style={styles.group}>
                <Input
                  testID={`field-label-${index}`}
                  label={t.fieldLabel}
                  value={field.label}
                  maxLength={200}
                  onChangeText={(text) => updateField(field.key, { label: text })}
                />
              </View>
              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>{t.fieldType}</Text>
                <Select
                  testID={`field-type-${index}`}
                  title={t.fieldType}
                  options={typeOptions}
                  selectedValue={field.field_type}
                  onValueChange={(value) => updateField(field.key, { field_type: value as FormFieldType })}
                />
              </View>
              {field.field_type === 'select' ? (
                <View style={styles.group}>
                  <Input
                    testID={`field-options-${index}`}
                    label={t.options}
                    value={field.optionsText}
                    multiline
                    onChangeText={(text) => updateField(field.key, { optionsText: text })}
                  />
                </View>
              ) : null}
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>{t.required}</Text>
                <Switch
                  testID={`field-required-${index}`}
                  value={field.required}
                  onValueChange={(value) => updateField(field.key, { required: value })}
                />
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  testID={`field-up-${index}`}
                  accessibilityLabel={t.moveUp}
                  onPress={() => moveField(index, -1)}
                  disabled={index === 0}
                  style={[styles.iconBtn, index === 0 && styles.disabled]}
                >
                  <Ionicons name="arrow-up" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`field-down-${index}`}
                  accessibilityLabel={t.moveDown}
                  onPress={() => moveField(index, 1)}
                  disabled={index === fields.length - 1}
                  style={[styles.iconBtn, index === fields.length - 1 && styles.disabled]}
                >
                  <Ionicons name="arrow-down" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`field-remove-${index}`}
                  accessibilityLabel={t.remove}
                  onPress={() => removeField(field)}
                  style={styles.iconBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

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
  group: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  switchLabel: { flex: 1, fontSize: 14 },
  fieldsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  iconBtn: { padding: 8 },
  disabled: { opacity: 0.35 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12 },
});
