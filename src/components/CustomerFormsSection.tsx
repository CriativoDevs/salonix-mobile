import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import { FormFieldInput, FormField } from './FormFieldInput';
import {
  fetchForms,
  fetchCustomerFormResponses,
  createFormResponse,
  updateFormResponse,
} from '../api/forms';
import { parseApiError } from '../utils/apiError';

const COPY = {
  pt: {
    title: 'Fichas do cliente',
    loadError: 'Não foi possível carregar as fichas.',
    empty: 'Nenhuma ficha ativa. Crie uma em Fichas.',
    requiredError: (label: string) => `Preencha o campo obrigatório: ${label}`,
    saveError: 'Não foi possível salvar a ficha.',
    saved: 'Ficha salva.',
    save: 'Salvar',
    saving: 'Salvando...',
  },
  en: {
    title: 'Customer forms',
    loadError: 'Could not load the forms.',
    empty: 'No active forms. Create one in Forms.',
    requiredError: (label: string) => `Fill in the required field: ${label}`,
    saveError: 'Could not save the form.',
    saved: 'Form saved.',
    save: 'Save',
    saving: 'Saving...',
  },
} as const;

interface FormDef {
  id: string;
  title: string;
  is_active?: boolean;
  fields?: FormField[];
}
interface Answer {
  field_id: string;
  value?: string | null;
}
interface FormResponse {
  id: string;
  form: string;
  answers?: Answer[];
}

function initialAnswers(form: FormDef, response?: FormResponse) {
  const byField: Record<string, string> = {};
  (response?.answers || []).forEach((a) => {
    byField[a.field_id] = a.value ?? '';
  });
  const values: Record<string, string> = {};
  (form.fields || []).forEach((field) => {
    const stored = byField[field.id];
    values[field.id] = stored !== undefined ? stored : field.field_type === 'boolean' ? 'false' : '';
  });
  return values;
}

interface Props {
  customerId: string;
  slug?: string | null;
}

export function CustomerFormsSection({ customerId, slug }: Props) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Respostas (dado de saúde) vivem só neste estado: sem storage, URL ou log.
  const [forms, setForms] = useState<FormDef[]>([]);
  const [responses, setResponses] = useState<Record<string, FormResponse>>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [savedFormId, setSavedFormId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [allForms, allResponses] = await Promise.all([
        fetchForms({ slug }),
        fetchCustomerFormResponses(customerId, { slug }),
      ]);
      const activeForms: FormDef[] = (allForms as FormDef[]).filter((f) => f.is_active);
      const byForm: Record<string, FormResponse> = {};
      (allResponses as FormResponse[]).forEach((r) => {
        byForm[r.form] = r;
      });
      const nextValues: Record<string, Record<string, string>> = {};
      activeForms.forEach((f) => {
        nextValues[f.id] = initialAnswers(f, byForm[f.id]);
      });
      setForms(activeForms);
      setResponses(byForm);
      setValues(nextValues);
      setLoaded(true);
    } catch {
      // Sem detalhes do erro: payloads de axios podem conter dados de saúde.
      setLoadError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [customerId, slug, t]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded && !loading) load();
  };

  const setValue = (formId: string, fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [formId]: { ...prev[formId], [fieldId]: value } }));
    setFormErrors((prev) => ({ ...prev, [formId]: null }));
    setSavedFormId(null);
  };

  const save = async (form: FormDef) => {
    const formValues = values[form.id] || {};
    for (const field of form.fields || []) {
      if (field.required && !String(formValues[field.id] ?? '').trim()) {
        setFormErrors((prev) => ({ ...prev, [form.id]: t.requiredError(field.label) }));
        return;
      }
    }

    const answers = (form.fields || []).map((field) => ({
      field_id: field.id,
      value: String(formValues[field.id] ?? ''),
    }));

    setSaving(form.id);
    try {
      const existing = responses[form.id];
      const saved = existing
        ? await updateFormResponse(existing.id, { answers }, { slug })
        : await createFormResponse({ form: form.id, customer: customerId, answers }, { slug });
      setResponses((prev) => ({ ...prev, [form.id]: saved }));
      setSavedFormId(form.id);
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, [form.id]: parseApiError(err, t.saveError) }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t.title}</Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {loading && <ActivityIndicator color={colors.brandPrimary} />}
          {loadError && <Text style={{ color: colors.error, fontSize: 13 }}>{loadError}</Text>}
          {loaded && forms.length === 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t.empty}</Text>
          )}

          {forms.map((form) => (
            <View key={form.id} style={[styles.formCard, { borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{form.title}</Text>
              {(form.fields || []).map((field) => (
                <View key={field.id} style={styles.field}>
                  <FormFieldInput
                    field={field}
                    value={values[form.id]?.[field.id] ?? ''}
                    onChange={(v) => setValue(form.id, field.id, v)}
                  />
                </View>
              ))}
              {formErrors[form.id] ? (
                <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: 12 }}>
                  {formErrors[form.id]}
                </Text>
              ) : null}
              {savedFormId === form.id ? (
                <Text style={{ color: colors.success ?? colors.brandPrimary, fontSize: 12 }}>
                  {t.saved}
                </Text>
              ) : null}
              <Button
                variant="link"
                onPress={() => save(form)}
                loading={saving === form.id}
                disabled={saving === form.id}
              >
                {saving === form.id ? t.saving : t.save}
              </Button>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600' },
  body: { marginTop: 12, gap: 12 },
  formCard: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 8 },
  formTitle: { fontSize: 14, fontWeight: '600' },
  field: { marginBottom: 4 },
});
