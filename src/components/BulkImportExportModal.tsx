import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { importCustomersCSV, fetchCustomersImportTemplate } from '../api/customers';
import { importAppointmentsCSV, fetchAppointmentsImportTemplate } from '../api/bookings';
import { importServicesCSV, fetchServicesImportTemplate } from '../api/services';
import { importStaffCSV, fetchStaffImportTemplate } from '../api/staff';
import { saveAndShareZip } from '../utils/zipFileSharing';

type PickedFile = { uri: string; name: string; mimeType?: string };

type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; error: string }[];
};

type EntityKey = 'customers' | 'appointments' | 'services' | 'staff';

const ENTITY_CONFIG: Record<
  EntityKey,
  {
    fileName: string;
    label: string;
    importFn: (file: PickedFile, opts: { dryRun: boolean; slug?: string }) => Promise<{ summary: ImportSummary }>;
    templateFn: (opts: { slug?: string }) => Promise<string>;
  }
> = {
  customers: {
    fileName: 'customers.csv',
    label: 'Clientes',
    importFn: importCustomersCSV as any,
    templateFn: fetchCustomersImportTemplate as any,
  },
  appointments: {
    fileName: 'appointments.csv',
    label: 'Agendamentos',
    importFn: importAppointmentsCSV as any,
    templateFn: fetchAppointmentsImportTemplate as any,
  },
  services: {
    fileName: 'services.csv',
    label: 'Serviços',
    importFn: importServicesCSV as any,
    templateFn: fetchServicesImportTemplate as any,
  },
  staff: {
    fileName: 'staff.csv',
    label: 'Colaboradores',
    importFn: importStaffCSV as any,
    templateFn: fetchStaffImportTemplate as any,
  },
};

const ENTITY_ORDER: EntityKey[] = ['customers', 'appointments', 'services', 'staff'];

interface BulkImportExportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slug?: string;
}

export function BulkImportExportModal({ visible, onClose, onSuccess, slug }: BulkImportExportModalProps) {
  const { colors } = useTheme();
  const [zipFileName, setZipFileName] = useState<string | null>(null);
  const [entityFiles, setEntityFiles] = useState<Partial<Record<EntityKey, PickedFile>> | null>(null);
  const [summaries, setSummaries] = useState<Partial<Record<EntityKey, ImportSummary>> | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setZipFileName(null);
    setEntityFiles(null);
    setSummaries(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickZip = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/zip', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const zip = await JSZip.loadAsync(base64, { base64: true });

    const files: Partial<Record<EntityKey, PickedFile>> = {};
    for (const key of ENTITY_ORDER) {
      const { fileName } = ENTITY_CONFIG[key];
      const entry = zip.files[fileName];
      if (!entry) continue;
      const content = await entry.async('string');
      const tempUri = `${FileSystem.cacheDirectory}${key}-import.csv`;
      await FileSystem.writeAsStringAsync(tempUri, content);
      files[key] = { uri: tempUri, name: fileName, mimeType: 'text/csv' };
    }

    if (Object.keys(files).length === 0) {
      Alert.alert('Erro', 'Nenhuma entidade reconhecida neste ZIP.');
      return;
    }

    setZipFileName(asset.name);
    setEntityFiles(files);
    setSummaries(null);
  };

  const handleDownloadTemplateZip = async () => {
    try {
      const zip = new JSZip();
      for (const key of ENTITY_ORDER) {
        const { fileName, templateFn } = ENTITY_CONFIG[key];
        const content = await templateFn({ slug });
        zip.file(fileName, content);
      }
      const base64 = await zip.generateAsync({ type: 'base64' });
      await saveAndShareZip(base64, 'modelo-dados.zip');
    } catch (error) {
      console.error('Error downloading template zip:', error);
      Alert.alert('Erro', 'Não foi possível descarregar o modelo.');
    }
  };

  const runImport = async (dryRun: boolean) => {
    if (!entityFiles) return null;
    const entries = Object.entries(entityFiles) as [EntityKey, PickedFile][];
    const results = await Promise.allSettled(
      entries.map(([key, file]) => ENTITY_CONFIG[key].importFn(file, { dryRun, slug }))
    );
    const next: Partial<Record<EntityKey, ImportSummary>> = {};
    const failedKeys: EntityKey[] = [];
    entries.forEach(([key], index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        next[key] = result.value.summary;
      } else {
        failedKeys.push(key);
      }
    });
    return { summaries: next, failedKeys };
  };

  const handlePreview = async () => {
    if (!entityFiles) return;
    setBusy(true);
    try {
      const result = await runImport(true);
      if (!result) return;
      setSummaries(result.summaries);
      if (result.failedKeys.length > 0) {
        const labels = result.failedKeys.map((key) => ENTITY_CONFIG[key].label).join(', ');
        Alert.alert('Erro parcial', `Não foi possível pré-visualizar: ${labels}.`);
        setEntityFiles((current) => {
          if (!current) return current;
          const next = { ...current };
          result.failedKeys.forEach((key) => delete next[key]);
          return next;
        });
      }
    } catch (error) {
      console.error('Error previewing bulk import:', error);
      Alert.alert('Erro', 'Não foi possível pré-visualizar o ficheiro.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!entityFiles) return;
    setBusy(true);
    try {
      const result = await runImport(false);
      if (!result) return;
      if (result.failedKeys.length > 0) {
        const failedLabels = result.failedKeys.map((key) => ENTITY_CONFIG[key].label).join(', ');
        Alert.alert('Importação parcial', `Não foi possível importar: ${failedLabels}. As restantes entidades foram importadas.`);
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error confirming bulk import:', error);
      Alert.alert('Erro', 'Não foi possível importar o ficheiro.');
    } finally {
      setBusy(false);
    }
  };

  const presentEntities = entityFiles ? (Object.keys(entityFiles) as EntityKey[]) : [];

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Importar Tudo"
      footer={
        summaries ? (
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
            <Button onPress={handlePreview} loading={busy} disabled={busy || !entityFiles} style={{ flex: 1 }}>
              Pré-visualizar
            </Button>
          </>
        )
      }
    >
      <View style={styles.content}>
        <Button variant="secondary" onPress={handlePickZip} disabled={busy} style={{ marginBottom: 8 }}>
          Escolher ficheiro ZIP
        </Button>

        {zipFileName && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{zipFileName}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {presentEntities.map((key) => (
                <Text key={key} style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
                  {ENTITY_CONFIG[key].label}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Button variant="link" onPress={handleDownloadTemplateZip}>
          Descarregar modelo ZIP
        </Button>

        {summaries && (
          <View style={styles.summary}>
            {presentEntities.map((key) => {
              const summary = summaries[key];
              if (!summary) return null;
              return (
                <View key={key} style={{ marginBottom: 16 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', marginBottom: 8 }}>
                    {ENTITY_CONFIG[key].label}
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
              );
            })}
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
