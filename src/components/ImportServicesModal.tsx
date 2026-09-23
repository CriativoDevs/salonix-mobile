import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { importServicesCSV, fetchServicesImportTemplate } from '../api/services';
import { saveAndShareCSV } from '../utils/csvFileSharing';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    downloadTemplateError: 'Não foi possível descarregar o modelo.',
    previewError: 'Não foi possível pré-visualizar o ficheiro.',
    importError: 'Não foi possível importar o ficheiro.',
    errorTitle: 'Erro',
    title: 'Importar Serviços',
    cancel: 'Cancelar',
    confirmImport: 'Confirmar importação',
    preview: 'Pré-visualizar',
    chooseFile: 'Escolher ficheiro CSV',
    downloadTemplate: 'Descarregar modelo CSV',
    previewSummary: 'Resumo da pré-visualização',
    created: 'Criados',
    updated: 'Atualizados',
    skipped: 'Ignorados',
    line: 'Linha',
  },
  en: {
    downloadTemplateError: 'Could not download the template.',
    previewError: 'Could not preview the file.',
    importError: 'Could not import the file.',
    errorTitle: 'Error',
    title: 'Import Services',
    cancel: 'Cancel',
    confirmImport: 'Confirm import',
    preview: 'Preview',
    chooseFile: 'Choose CSV file',
    downloadTemplate: 'Download CSV template',
    previewSummary: 'Preview summary',
    created: 'Created',
    updated: 'Updated',
    skipped: 'Skipped',
    line: 'Line',
  },
} as const;

type PickedFile = { uri: string; name: string; mimeType?: string };

type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; error: string }[];
};

interface ImportServicesModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slug?: string;
}

export function ImportServicesModal({ visible, onClose, onSuccess, slug }: ImportServicesModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
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
      const content = await fetchServicesImportTemplate({ slug });
      await saveAndShareCSV(content, 'modelo-servicos.csv');
    } catch (error) {
      console.error('Error downloading template:', error);
      Alert.alert(t.errorTitle, t.downloadTemplateError);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await importServicesCSV(file, { dryRun: true, slug } as any);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error previewing import:', error);
      Alert.alert(t.errorTitle, t.previewError);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await importServicesCSV(file, { dryRun: false, slug } as any);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error confirming import:', error);
      Alert.alert(t.errorTitle, t.importError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={t.title}
      footer={
        summary ? (
          <>
            <Button variant="secondary" onPress={handleClose} style={{ flex: 1 }}>
              {t.cancel}
            </Button>
            <Button onPress={handleConfirm} loading={busy} disabled={busy} style={{ flex: 1 }}>
              {t.confirmImport}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onPress={handleClose} style={{ flex: 1 }}>
              {t.cancel}
            </Button>
            <Button onPress={handlePreview} loading={busy} disabled={busy || !file} style={{ flex: 1 }}>
              {t.preview}
            </Button>
          </>
        )
      }
    >
      <View style={styles.content}>
        <Button variant="secondary" onPress={handlePickFile} style={{ marginBottom: 8 }}>
          {t.chooseFile}
        </Button>

        {file && (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>{file.name}</Text>
        )}

        <Button variant="link" onPress={handleDownloadTemplate}>
          {t.downloadTemplate}
        </Button>

        {summary && (
          <View style={styles.summary}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600', marginBottom: 8 }}>
              {t.previewSummary}
            </Text>
            <Text style={{ color: colors.textPrimary }}>{t.created}: {summary.created}</Text>
            <Text style={{ color: colors.textPrimary }}>{t.updated}: {summary.updated}</Text>
            <Text style={{ color: colors.textPrimary }}>{t.skipped}: {summary.skipped}</Text>
            {summary.errors.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {summary.errors.map((rowError, index) => (
                  <Text key={`${rowError.line}-${index}`} style={{ color: colors.error, fontSize: 12 }}>
                    {t.line} {rowError.line}: {rowError.error}
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
