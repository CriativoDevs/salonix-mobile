import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { importStaffCSV, fetchStaffImportTemplate } from '../api/staff';
import { saveAndShareCSV } from '../utils/csvFileSharing';

type PickedFile = { uri: string; name: string; mimeType?: string };

type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; error: string }[];
};

interface ImportStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slug?: string;
}

export function ImportStaffModal({ visible, onClose, onSuccess, slug }: ImportStaffModalProps) {
  const { colors } = useTheme();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setSummary(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    setSummary(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const content = await fetchStaffImportTemplate({ slug });
      await saveAndShareCSV(content, 'modelo-staff.csv');
    } catch (error) {
      console.error('Error downloading template:', error);
      Alert.alert('Erro', 'Não foi possível descarregar o modelo.');
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await importStaffCSV(file, { dryRun: true, slug } as any);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error previewing import:', error);
      Alert.alert('Erro', 'Não foi possível pré-visualizar o ficheiro.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await importStaffCSV(file, { dryRun: false, slug } as any);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error confirming import:', error);
      Alert.alert('Erro', 'Não foi possível importar o ficheiro.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Importar Colaboradores"
      footer={
        summary ? (
          <>
            <Button variant="secondary" onPress={handleClose} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button onPress={handleConfirm} loading={busy} disabled={busy} style={{ flex: 1 }}>
              Confirmar importação
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onPress={handleClose} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button onPress={handlePreview} loading={busy} disabled={busy || !file} style={{ flex: 1 }}>
              Pré-visualizar
            </Button>
          </>
        )
      }
    >
      <View style={styles.content}>
        <Button variant="secondary" onPress={handlePickFile} style={{ marginBottom: 8 }}>
          Escolher ficheiro CSV
        </Button>

        {file && (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>{file.name}</Text>
        )}

        <Button variant="link" onPress={handleDownloadTemplate}>
          Descarregar modelo CSV
        </Button>

        {summary && (
          <View style={styles.summary}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600', marginBottom: 8 }}>
              Resumo da pré-visualização
            </Text>
            <Text style={{ color: colors.textPrimary }}>Criados: {summary.created}</Text>
            <Text style={{ color: colors.textPrimary }}>Atualizados: {summary.updated}</Text>
            <Text style={{ color: colors.textPrimary }}>Ignorados: {summary.skipped}</Text>
            {summary.errors.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {summary.errors.map((rowError, index) => (
                  <Text key={`${rowError.line}-${index}`} style={{ color: colors.error, fontSize: 12 }}>
                    Linha {rowError.line}: {rowError.error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {},
  summary: {
    marginTop: 16,
  },
});
