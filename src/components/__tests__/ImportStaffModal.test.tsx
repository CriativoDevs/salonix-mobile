import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImportStaffModal } from '../ImportStaffModal';

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

const mockImportStaffCSV = jest.fn();
const mockFetchStaffImportTemplate = jest.fn();
jest.mock('../../api/staff', () => ({
  importStaffCSV: (...args: any[]) => mockImportStaffCSV(...args),
  fetchStaffImportTemplate: (...args: any[]) => mockFetchStaffImportTemplate(...args),
}));

const mockSaveAndShareCSV = jest.fn();
jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: (...args: any[]) => mockSaveAndShareCSV(...args),
}));

describe('ImportStaffModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('keeps "Pré-visualizar" disabled until a file is chosen, then enables it', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' }],
    });

    const { getByText } = await render(
      <ImportStaffModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Pré-visualizar'));
    expect(mockImportStaffCSV).not.toHaveBeenCalled();

    await fireEvent.press(getByText('Escolher ficheiro CSV'));

    await waitFor(() => {
      expect(getByText('a.csv')).toBeTruthy();
    });

    mockImportStaffCSV.mockResolvedValue({
      summary: { created: 0, updated: 0, skipped: 0, errors: [] },
    });
    await fireEvent.press(getByText('Pré-visualizar'));
    expect(mockImportStaffCSV).toHaveBeenCalled();
  });

  it('shows the dry-run summary after previewing', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' }],
    });
    mockImportStaffCSV.mockResolvedValue({
      summary: { created: 2, updated: 1, skipped: 0, errors: [{ line: 4, error: 'Email inválido' }] },
    });

    const { getByText } = await render(
      <ImportStaffModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Escolher ficheiro CSV'));
    await waitFor(() => getByText('Pré-visualizar'));
    await fireEvent.press(getByText('Pré-visualizar'));

    await waitFor(() => {
      expect(getByText('Criados: 2')).toBeTruthy();
    });
    expect(getByText('Atualizados: 1')).toBeTruthy();
    expect(getByText('Ignorados: 0')).toBeTruthy();
    expect(getByText('Linha 4: Email inválido')).toBeTruthy();
    expect(mockImportStaffCSV).toHaveBeenCalledWith(
      { uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' },
      { dryRun: true, slug: 'acme' }
    );
  });

  it('confirms the import and calls onSuccess', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' }],
    });
    mockImportStaffCSV.mockResolvedValue({
      summary: { created: 2, updated: 0, skipped: 0, errors: [] },
    });

    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const { getByText } = await render(
      <ImportStaffModal visible onClose={onClose} onSuccess={onSuccess} slug="acme" />
    );

    await fireEvent.press(getByText('Escolher ficheiro CSV'));
    await waitFor(() => getByText('Pré-visualizar'));
    await fireEvent.press(getByText('Pré-visualizar'));
    await waitFor(() => getByText('Confirmar importação'));
    await fireEvent.press(getByText('Confirmar importação'));

    await waitFor(() => {
      expect(mockImportStaffCSV).toHaveBeenCalledWith(
        { uri: 'file:///tmp/a.csv', name: 'a.csv', mimeType: 'text/csv' },
        { dryRun: false, slug: 'acme' }
      );
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('downloads the template via saveAndShareCSV', async () => {
    mockFetchStaffImportTemplate.mockResolvedValue('email,role\n');

    const { getByText } = await render(
      <ImportStaffModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Descarregar modelo CSV'));

    await waitFor(() => {
      expect(mockSaveAndShareCSV).toHaveBeenCalledWith('email,role\n', 'modelo-staff.csv');
    });
  });

  it('renders the "Importar Colaboradores" title', async () => {
    const { getByText } = await render(
      <ImportStaffModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );
    expect(getByText('Importar Colaboradores')).toBeTruthy();
  });
});
