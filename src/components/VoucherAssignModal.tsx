import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchCustomers } from '../api/customers';
import { useTenant } from '../hooks/useTenant';

const COPY = {
  pt: {
    title: 'Atribuir a cliente',
    description: (code: string) =>
      `Busque o cliente pelo nome ou e-mail, ou marque vários, para atribuir o voucher ${code}.`,
    searchLabel: 'Cliente',
    searchPlaceholder: 'Nome ou e-mail do cliente',
    loading: 'Carregando...',
    searchFailed: 'Falha ao buscar clientes.',
    selectAll: 'Selecionar todos',
    selected: (name: string) => `Selecionado: ${name}`,
    selectedCount: (count: number) => `${count} clientes selecionados`,
    clearSelection: 'Limpar',
    sendEmail: 'Enviar por e-mail',
    noEmail: 'Este cliente não tem e-mail cadastrado.',
    bulkNoEmail:
      'Atribuição em massa não envia e-mail automático — envie individualmente depois, se precisar.',
    cancel: 'Cancelar',
    confirm: 'Atribuir voucher',
    confirmBulk: (count: number) => `Atribuir a ${count} clientes`,
    assignError: 'Não foi possível atribuir o voucher.',
  },
  en: {
    title: 'Assign to client',
    description: (code: string) =>
      `Search for the client by name or email, or check several, to assign voucher ${code}.`,
    searchLabel: 'Client',
    searchPlaceholder: 'Client name or email',
    loading: 'Loading...',
    searchFailed: 'Failed to search clients.',
    selectAll: 'Select all',
    selected: (name: string) => `Selected: ${name}`,
    selectedCount: (count: number) => `${count} clients selected`,
    clearSelection: 'Clear',
    sendEmail: 'Send by email',
    noEmail: 'This client has no email registered.',
    bulkNoEmail:
      'Bulk assignment does not send an automatic email — send individually afterwards if needed.',
    cancel: 'Cancel',
    confirm: 'Assign voucher',
    confirmBulk: (count: number) => `Assign to ${count} clients`,
    assignError: 'Could not assign the voucher.',
  },
} as const;

interface ClientOption {
  id: number | string;
  name: string;
  email?: string | null;
  phone_number?: string | null;
}

interface VoucherAssignModalProps {
  visible: boolean;
  voucher?: { id: number | string; code: string } | null;
  busy?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (data: { client: ClientOption; sendEmail: boolean }) => Promise<void> | void;
  onSubmitBulk?: (clients: ClientOption[]) => Promise<void> | void;
}

export function VoucherAssignModal({
  visible,
  voucher,
  busy = false,
  errorMessage,
  onClose,
  onSubmit,
  onSubmitBulk,
}: VoucherAssignModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const { slug } = useTenant();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ClientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Map id -> cliente, preserva os selecionados mesmo que a busca mude e
  // eles deixem de aparecer na lista visível.
  const [selected, setSelected] = useState<Map<ClientOption['id'], ClientOption>>(new Map());
  const [sendEmail, setSendEmail] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setResults([]);
      setSelected(new Map());
      setSendEmail(false);
      setSearchError(null);
    }
  }, [visible, voucher, slug]);

  // Pré-carrega os primeiros clientes (ordenados por nome pelo backend) ao
  // abrir o modal, pra não depender só de digitar uma busca pra ver algo.
  useEffect(() => {
    if (!visible) return;
    setSearching(true);
    setSearchError(null);
    fetchCustomers({ limit: 8, slug } as any)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        setResults(list);
        setSearching(false);
      })
      .catch(() => {
        setSearchError(t.searchFailed);
        setSearching(false);
      });
  }, [visible, slug]);

  useEffect(() => {
    if (!visible) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = search.trim();
    if (term.length === 0) {
      return undefined;
    }
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      fetchCustomers({ search: term, limit: 10, slug } as any)
        .then((data: any) => {
          const list = Array.isArray(data) ? data : data?.results || [];
          setResults(list);
          setSearching(false);
        })
        .catch(() => {
          setSearchError(t.searchFailed);
          setSearching(false);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, visible, slug, t]);

  const selectedList = Array.from(selected.values());
  const selectedCount = selected.size;
  const allVisibleSelected =
    results.length > 0 && results.every((client) => selected.has(client.id));

  const toggleClient = (client: ClientOption) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSendEmail(false);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(client.id)) {
        next.delete(client.id);
      } else {
        next.set(client.id, client);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSendEmail(false);
    setSelected((prev) => {
      const next = new Map(prev);
      if (allVisibleSelected) {
        results.forEach((client) => next.delete(client.id));
      } else {
        results.forEach((client) => next.set(client.id, client));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSendEmail(false);
    setSelected(new Map());
  };

  const dropdownOpen = searching || !!searchError || results.length > 0;
  const singleSelected = selectedCount === 1 ? selectedList[0] : null;
  // Nunca confiar em sendEmail isolado do cliente atual — só vale quando
  // exatamente um cliente está selecionado e ele tem e-mail cadastrado.
  const effectiveSendEmail = Boolean(sendEmail && singleSelected?.email);

  const handleSubmit = async () => {
    if (selectedCount === 0) return;
    if (selectedCount === 1) {
      await onSubmit({ client: selectedList[0], sendEmail: effectiveSendEmail });
      return;
    }
    await onSubmitBulk?.(selectedList);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t.title}
      description={voucher?.code ? t.description(voucher.code) : undefined}
      size="md"
      footer={
        <>
          <Button variant="secondary" onPress={onClose} disabled={busy} style={{ flex: 1 }}>
            {t.cancel}
          </Button>
          <Button
            onPress={handleSubmit}
            loading={busy}
            disabled={busy || selectedCount === 0}
            style={{ flex: 1 }}
          >
            {selectedCount > 1 ? t.confirmBulk(selectedCount) : t.confirm}
          </Button>
        </>
      }
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Input
            label={t.searchLabel}
            placeholder={t.searchPlaceholder}
            value={search}
            onChangeText={(text) => setSearch(text)}
          />

          {dropdownOpen ? (
            <View
              style={[
                styles.dropdown,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              {results.length > 0 ? (
                <TouchableOpacity
                  testID="voucher-assign-select-all"
                  onPress={toggleSelectAllVisible}
                  style={[styles.selectAllRow, { borderBottomColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.border,
                        backgroundColor: allVisibleSelected ? colors.brandPrimary : 'transparent',
                      },
                    ]}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    {t.selectAll}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {searching ? (
                <View style={styles.dropdownLoading}>
                  <ActivityIndicator size="small" color={colors.brandPrimary} />
                </View>
              ) : null}

              {!searching && searchError ? (
                <View style={styles.dropdownMessage}>
                  <Text style={{ color: colors.error, fontSize: 13 }}>{searchError}</Text>
                </View>
              ) : null}

              {!searching && !searchError ? (
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {results.map((client, index) => {
                    const isSelected = selected.has(client.id);
                    return (
                      <TouchableOpacity
                        key={String(client.id)}
                        testID={`voucher-assign-client-${client.id}`}
                        onPress={() => toggleClient(client)}
                        style={[
                          styles.resultRow,
                          index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                          isSelected && { backgroundColor: colors.brandPrimary + '11' },
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: colors.border,
                              backgroundColor: isSelected ? colors.brandPrimary : 'transparent',
                            },
                          ]}
                        />
                        <View style={styles.resultTextGroup}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                            {client.name}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                            {client.email || client.phone_number || ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}
            </View>
          ) : null}
        </View>

        {selectedCount > 0 ? (
          <View style={[styles.selectedBox, { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary + '11' }]}>
            <View style={styles.selectedHeader}>
              <Text
                style={{ flex: 1, color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}
              >
                {selectedCount === 1 && singleSelected
                  ? t.selected(singleSelected.name)
                  : t.selectedCount(selectedCount)}
              </Text>
              <TouchableOpacity
                testID="voucher-assign-clear-selection"
                onPress={clearSelection}
                style={styles.clearSelectionButton}
              >
                <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: '600' }}>
                  {t.clearSelection}
                </Text>
              </TouchableOpacity>
            </View>

            {selectedCount === 1 && singleSelected ? (
              <>
                <TouchableOpacity
                  testID="voucher-assign-send-email-toggle"
                  onPress={() => {
                    if (singleSelected.email) setSendEmail((prev) => !prev);
                  }}
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.border,
                        backgroundColor: sendEmail ? colors.brandPrimary : 'transparent',
                      },
                    ]}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.sendEmail}</Text>
                </TouchableOpacity>
                {!singleSelected.email ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                    {t.noEmail}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8 }}>
                {t.bulkNoEmail}
              </Text>
            )}
          </View>
        ) : null}

        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBackground, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontSize: 13 }}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {},
  inputGroup: {
    marginBottom: 12,
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dropdownMessage: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownScroll: {
    maxHeight: 168,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultTextGroup: {
    flex: 1,
  },
  selectedBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearSelectionButton: {
    marginLeft: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
});
