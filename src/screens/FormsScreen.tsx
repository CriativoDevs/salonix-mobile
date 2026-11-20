import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { Card } from '../components/ui/Card';
import { ActionMenu } from '../components/ui/ActionMenu';
import { fetchForms, createForm, updateForm, deleteForm } from '../api/forms';
import { FormEditorModal, FormSubmitPayload } from '../components/FormEditorModal';
import { isOwnerOrManager } from '../utils/permissions';

const COPY = {
  pt: {
    title: 'Fichas',
    subtitle: 'Crie fichas com os campos que os seus clientes preenchem.',
    newForm: 'Nova ficha',
    emptyTitle: 'Nenhuma ficha criada.',
    addFirst: 'Criar primeira ficha',
    edit: 'Editar',
    remove: 'Excluir',
    deleteTitle: 'Excluir ficha',
    deleteMessage: (title: string) =>
      `Tem certeza que deseja excluir a ficha "${title}"? As respostas dos clientes a esta ficha também serão apagadas.`,
    cancel: 'Cancelar',
    errorTitle: 'Erro',
    loadError: 'Não foi possível carregar as fichas.',
    saveError: 'Não foi possível salvar a ficha.',
    deleteError: 'Não foi possível excluir a ficha.',
    active: 'Ativa',
    inactive: 'Inativa',
    clientEdits: 'Cliente edita',
    fieldCount: (n: number) => (n === 1 ? '1 campo' : `${n} campos`),
    denied: 'Sem permissão para gerir fichas.',
  },
  en: {
    title: 'Forms',
    subtitle: 'Create forms with the fields your clients fill in.',
    newForm: 'New form',
    emptyTitle: 'No form created.',
    addFirst: 'Create first form',
    edit: 'Edit',
    remove: 'Delete',
    deleteTitle: 'Delete form',
    deleteMessage: (title: string) =>
      `Are you sure you want to delete the form "${title}"? Client answers to this form will also be deleted.`,
    cancel: 'Cancel',
    errorTitle: 'Error',
    loadError: 'Could not load the forms.',
    saveError: 'Could not save the form.',
    deleteError: 'Could not delete the form.',
    active: 'Active',
    inactive: 'Inactive',
    clientEdits: 'Client edits',
    fieldCount: (n: number) => (n === 1 ? '1 field' : `${n} fields`),
    denied: 'You do not have permission to manage forms.',
  },
} as const;

// Nunca logar o erro: objetos axios carregam payloads (dados de saúde).
function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string') return value;
  }
  return fallback;
}

export default function FormsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { slug } = useTenant();
  const { userInfo } = useAuth() as any;
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const allowed = isOwnerOrManager(userInfo);

  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [menuTarget, setMenuTarget] = useState<any>(null);

  const loadForms = useCallback(
    async (shouldRefresh = false) => {
      if (shouldRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchForms({ slug } as any);
        setForms(Array.isArray(data) ? data : []);
      } catch (error) {
        setLoadError(extractErrorMessage(error, t.loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug, t.loadError]
  );

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    loadForms();
  }, [allowed, loadForms]);

  const handleCreate = () => {
    setSelected(null);
    setFormError(null);
    setFormVisible(true);
  };

  const handleEdit = (form: any) => {
    setSelected(form);
    setFormError(null);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setSelected(null);
    setFormError(null);
  };

  const handleSubmit = async (payload: FormSubmitPayload) => {
    setFormBusy(true);
    setFormError(null);
    try {
      if (selected) {
        const updated = await updateForm(selected.id, payload, { slug } as any);
        setForms((prev) => prev.map((f) => (f.id === selected.id ? updated : f)));
      } else {
        const created = await createForm(payload, { slug } as any);
        setForms((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (error) {
      setFormError(extractErrorMessage(error, t.saveError));
    } finally {
      setFormBusy(false);
    }
  };

  const handleDelete = (form: any) => {
    Alert.alert(t.deleteTitle, t.deleteMessage(form.title), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteForm(form.id, { slug } as any);
            setForms((prev) => prev.filter((f) => f.id !== form.id));
          } catch (error) {
            Alert.alert(t.errorTitle, extractErrorMessage(error, t.deleteError));
          }
        },
      },
    ]);
  };

  const renderBadge = (label: string, color: string, key: string) => (
    <View key={key} style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Card
        testID={`form-item-${item.id}`}
        onPress={() => handleEdit(item)}
        onLongPress={() => setMenuTarget(item)}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          {item.is_active
            ? renderBadge(t.active, colors.success, 'active')
            : renderBadge(t.inactive, colors.textSecondary, 'inactive')}
          {item.client_editable ? renderBadge(t.clientEdits, colors.brandPrimary, 'editable') : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {t.fieldCount(Array.isArray(item.fields) ? item.fields.length : 0)}
          </Text>
          <TouchableOpacity
            testID={`form-delete-${item.id}`}
            accessibilityLabel={t.remove}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="forms-back-button"
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      {!allowed ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.denied}</Text>
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t.subtitle}</Text>
            <TouchableOpacity onPress={handleCreate} style={styles.newBtn}>
              <Ionicons name="add" size={18} color={colors.brandPrimary} />
              <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                {t.newForm}
              </Text>
            </TouchableOpacity>
          </View>

          {loadError ? (
            <Text style={{ color: colors.error, fontSize: 13, paddingHorizontal: 16, marginBottom: 8 }}>
              {loadError}
            </Text>
          ) : null}

          <FlatList
            data={forms}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadForms(true)}
                tintColor={colors.brandPrimary}
              />
            }
            ListFooterComponent={
              loading && !refreshing ? (
                <ActivityIndicator size="small" color={colors.brandPrimary} style={styles.footerLoader} />
              ) : null
            }
            ListEmptyComponent={
              !loading && !loadError ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.emptyTitle}</Text>
                  <TouchableOpacity onPress={handleCreate} style={{ marginTop: 16 }}>
                    <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>{t.addFirst}</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />

          <FormEditorModal
            visible={formVisible}
            onClose={closeForm}
            onSubmit={handleSubmit}
            form={selected}
            busy={formBusy}
            errorMessage={formError}
          />

          <ActionMenu
            visible={!!menuTarget}
            onClose={() => setMenuTarget(null)}
            title={menuTarget?.title}
            options={[
              { label: t.edit, onPress: () => handleEdit(menuTarget) },
              { label: t.remove, onPress: () => handleDelete(menuTarget), destructive: true },
            ]}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  newBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  listContent: { padding: 16, paddingTop: 0 },
  card: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  formTitle: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { fontSize: 13 },
  footerLoader: { paddingVertical: 16 },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
