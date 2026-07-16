import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImportServicesModal } from '../ImportServicesModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
      error: '#ef4444',
      brandPrimary: '#3b82f6',
    },
  }),
}));

const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: any[]) => mockGetDocumentAsync(...args),
}));

const mockImportServicesCSV = jest.fn();
const mockFetchServicesImportTemplate = jest.fn();
jest.mock('../../api/services', () => ({
  importServicesCSV: (...args: any[]) => mockImportServicesCSV(...args),
  fetchServicesImportTemplate: (...args: any[]) => mockFetchServicesImportTemplate(...args),
}));

const mockSaveAndShareCSV = jest.fn();
jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: (...args: any[]) => mockSaveAndShareCSV(...args),
}));

describe('ImportServicesModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('keeps "Pré-visualizar" disabled until a file is chosen, then enables it', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' }],
    });

    const { getByText } = await render(
      <ImportServicesModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Pré-visualizar'));
    expect(mockImportServicesCSV).not.toHaveBeenCalled();

    await fireEvent.press(getByText('Escolher ficheiro CSV'));

    await waitFor(() => {
      expect(getByText('a.csv')).toBeTruthy();
    });

    mockImportServicesCSV.mockResolvedValue({
      summary: { created: 0, updated: 0, skipped: 0, errors: [] },
    });
    await fireEvent.press(getByText('Pré-visualizar'));
    expect(mockImportServicesCSV).toHaveBeenCalled();
  });

  it('shows the dry-run summary after previewing', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' }],
    });
    mockImportServicesCSV.mockResolvedValue({
      summary: { created: 3, updated: 1, skipped: 0, errors: [{ line: 5, error: 'Preço inválido' }] },
    });

    const { getByText } = await render(
      <ImportServicesModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Escolher ficheiro CSV'));
    await waitFor(() => getByText('Pré-visualizar'));
    await fireEvent.press(getByText('Pré-visualizar'));

    await waitFor(() => {
      expect(getByText('Criados: 3')).toBeTruthy();
    });
    expect(getByText('Atualizados: 1')).toBeTruthy();
    expect(getByText('Ignorados: 0')).toBeTruthy();
    expect(getByText('Linha 5: Preço inválido')).toBeTruthy();
    expect(mockImportServicesCSV).toHaveBeenCalledWith(
      { uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' },
      { dryRun: true, slug: 'acme' }
    );
  });

  it('confirms the import and calls onSuccess', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' }],
    });
    mockImportServicesCSV.mockResolvedValue({
      summary: { created: 3, updated: 0, skipped: 0, errors: [] },
    });

    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const { getByText } = await render(
      <ImportServicesModal visible onClose={onClose} onSuccess={onSuccess} slug="acme" />
    );

    await fireEvent.press(getByText('Escolher ficheiro CSV'));
    await waitFor(() => getByText('Pré-visualizar'));
    await fireEvent.press(getByText('Pré-visualizar'));
    await waitFor(() => getByText('Confirmar importação'));
    await fireEvent.press(getByText('Confirmar importação'));

    await waitFor(() => {
      expect(mockImportServicesCSV).toHaveBeenCalledWith(
        { uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' },
        { dryRun: false, slug: 'acme' }
      );
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('downloads the template via saveAndShareCSV', async () => {
    mockFetchServicesImportTemplate.mockResolvedValue('name,price_eur,duration_minutes\n');

    const { getByText } = await render(
      <ImportServicesModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Descarregar modelo CSV'));

    await waitFor(() => {
      expect(mockSaveAndShareCSV).toHaveBeenCalledWith('name,price_eur,duration_minutes\n', 'modelo-servicos.csv');
    });
  });

  it('renders the "Importar Serviços" title', async () => {
    const { getByText } = await render(
      <ImportServicesModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );
    expect(getByText('Importar Serviços')).toBeTruthy();
  });
});
