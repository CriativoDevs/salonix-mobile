import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";
import { Button } from "../../components/ui";
import { FormFieldInput } from "../../components/FormFieldInput";
import { fetchClientFormResponses, updateClientFormResponse } from "../../services/clientBooking";

const COPY = {
  pt: {
    title: "Minhas fichas",
    loadError: "Não foi possível carregar as suas fichas.",
    badgeEditable: "Editável",
    badgeReadOnly: "Só leitura",
    badgePending: "Por preencher",
    updatedAt: (date) => `Atualizada em ${date}`,
    requiredError: (label) => `Preencha o campo obrigatório: ${label}`,
    saveError: "Não foi possível guardar a ficha.",
    saved: "Ficha salva.",
    save: "Salvar ficha",
    saving: "Salvando...",
    readOnlyHint: "Esta ficha só pode ser alterada pelo estabelecimento.",
    yes: "Sim",
    no: "Não",
  },
  en: {
    title: "My forms",
    loadError: "Could not load your forms.",
    badgeEditable: "Editable",
    badgeReadOnly: "Read-only",
    badgePending: "To fill in",
    updatedAt: (date) => `Updated on ${date}`,
    requiredError: (label) => `Fill in the required field: ${label}`,
    saveError: "Could not save the form.",
    saved: "Form saved.",
    save: "Save form",
    saving: "Saving...",
    readOnlyHint: "This form can only be changed by the business.",
    yes: "Yes",
    no: "No",
  },
};

function initialValues(response) {
  const byField = {};
  (response.answers || []).forEach((a) => {
    byField[a.field_id] = a.value ?? "";
  });
  const values = {};
  (response.form_fields || []).forEach((field) => {
    const stored = byField[field.id];
    values[field.id] = stored !== undefined ? stored : field.field_type === "boolean" ? "false" : "";
  });
  return values;
}

function hasPending(response) {
  if (!response.form_client_editable) return false;
  const answered = {};
  (response.answers || []).forEach((a) => {
    answered[a.field_id] = String(a.value ?? "").trim();
  });
  return (response.form_fields || []).some((field) => field.required && !answered[field.id]);
}

function formatDate(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "en" ? "en-GB" : "pt-PT");
}

export default function ClientFormsSection() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = COPY[language] || COPY.pt;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Respostas (dado de saúde) vivem só neste estado: sem storage, URL ou log.
  const [responses, setResponses] = useState([]);
  const [values, setValues] = useState({});
  const [open, setOpen] = useState({});
  const [saving, setSaving] = useState(null);
  const [errors, setErrors] = useState({});
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchClientFormResponses()
      .then((data) => {
        if (cancelled) return;
        const nextValues = {};
        const nextOpen = {};
        data.forEach((r) => {
          nextValues[r.id] = initialValues(r);
          nextOpen[r.id] = data.length === 1 || hasPending(r);
        });
        setResponses(data);
        setValues(nextValues);
        setOpen(nextOpen);
      })
      .catch(() => {
        // Sem detalhes do erro: payloads de axios podem conter dados de saúde.
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setValue = (responseId, fieldId, value) => {
    setValues((prev) => ({ ...prev, [responseId]: { ...prev[responseId], [fieldId]: value } }));
    setErrors((prev) => ({ ...prev, [responseId]: null }));
    setSavedId(null);
  };

  const save = async (response) => {
    const formValues = values[response.id] || {};
    const fields = response.form_fields || [];
    for (const field of fields) {
      if (field.required && !String(formValues[field.id] ?? "").trim()) {
        setErrors((prev) => ({ ...prev, [response.id]: t.requiredError(field.label) }));
        return;
      }
    }
    const answers = fields.map((field) => ({
      field_id: field.id,
      value: String(formValues[field.id] ?? ""),
    }));

    setSaving(response.id);
    try {
      const saved = await updateClientFormResponse(response.id, { answers });
      setResponses((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setValues((prev) => ({ ...prev, [saved.id]: initialValues(saved) }));
      setSavedId(response.id);
    } catch {
      // Mensagem fixa: não ecoar texto vindo do BE (pode conter dados de saúde).
      setErrors((prev) => ({ ...prev, [response.id]: t.saveError }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return null;
  if (loadError) {
    return (
      <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: 13 }}>
        {t.loadError}
      </Text>
    );
  }
  if (responses.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t.title}</Text>
      {responses.map((response) => {
        const fields = response.form_fields || [];
        const editable = Boolean(response.form_client_editable);
        const isOpen = Boolean(open[response.id]);
        const pending = hasPending(response);
        const updated = formatDate(response.updated_at, language);
        return (
          <View
            key={response.id}
            testID={`client-form-${response.id}`}
            style={[styles.card, { borderColor: colors.border }]}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setOpen((prev) => ({ ...prev, [response.id]: !prev[response.id] }))}
              style={styles.cardHeader}
            >
              <View style={styles.cardHeaderText}>
                <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
                  {response.form_title}
                </Text>
                <View style={styles.badges}>
                  <Text
                    style={[
                      styles.badge,
                      { color: editable ? colors.success || colors.brandPrimary : colors.textSecondary },
                    ]}
                  >
                    {editable ? t.badgeEditable : t.badgeReadOnly}
                  </Text>
                  {pending ? (
                    <Text style={[styles.badge, { color: colors.warning || colors.error }]}>
                      {t.badgePending}
                    </Text>
                  ) : null}
                  {updated ? (
                    <Text style={[styles.badge, { color: colors.textSecondary }]}>
                      {t.updatedAt(updated)}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Ionicons
                name={isOpen ? "chevron-down" : "chevron-forward"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {isOpen ? (
              <View style={[styles.body, { borderTopColor: colors.border }]}>
                {editable ? (
                  <>
                    {fields.map((field) => (
                      <FormFieldInput
                        key={field.id}
                        field={field}
                        value={values[response.id]?.[field.id] ?? ""}
                        onChange={(v) => setValue(response.id, field.id, v)}
                      />
                    ))}
                    {errors[response.id] ? (
                      <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: 12 }}>
                        {errors[response.id]}
                      </Text>
                    ) : null}
                    {savedId === response.id ? (
                      <Text style={{ color: colors.success || colors.brandPrimary, fontSize: 12 }}>
                        {t.saved}
                      </Text>
                    ) : null}
                    <Button
                      variant="link"
                      onPress={() => save(response)}
                      loading={saving === response.id}
                      disabled={saving === response.id}
                    >
                      {saving === response.id ? t.saving : t.save}
                    </Button>
                  </>
                ) : (
                  <>
                    {fields.map((field) => {
                      const raw = values[response.id]?.[field.id] ?? "";
                      const display =
                        field.field_type === "boolean" ? (raw === "true" ? t.yes : t.no) : raw;
                      return (
                        <View key={field.id}>
                          <Text style={[styles.readLabel, { color: colors.textSecondary }]}>
                            {field.label}
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                            {String(display).trim() || "—"}
                          </Text>
                        </View>
                      );
                    })}
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {t.readOnlyHint}
                    </Text>
                  </>
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, marginTop: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 },
  cardHeaderText: { flex: 1, gap: 4 },
  formTitle: { fontSize: 15, fontWeight: "600" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { fontSize: 12, fontWeight: "500" },
  body: { borderTopWidth: 1, padding: 12, gap: 12 },
  readLabel: { fontSize: 12, marginBottom: 2 },
});
