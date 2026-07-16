import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import JSZip from 'jszip';
import { BulkImportExportModal } from '../BulkImportExportModal';

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

const mockReadAsStringAsync = jest.fn();
const mockWriteAsStringAsync = jest.fn();
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: (...args: any[]) => mockReadAsStringAsync(...args),
  writeAsStringAsync: (...args: any[]) => mockWriteAsStringAsync(...args),
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
}));

const mockImportCustomersCSV = jest.fn();
const mockFetchCustomersImportTemplate = jest.fn();
jest.mock('../../api/customers', () => ({
  importCustomersCSV: (...args: any[]) => mockImportCustomersCSV(...args),
  fetchCustomersImportTemplate: (...args: any[]) => mockFetchCustomersImportTemplate(...args),
}));

const mockImportAppointmentsCSV = jest.fn();
const mockFetchAppointmentsImportTemplate = jest.fn();
jest.mock('../../api/bookings', () => ({
  importAppointmentsCSV: (...args: any[]) => mockImportAppointmentsCSV(...args),
  fetchAppointmentsImportTemplate: (...args: any[]) => mockFetchAppointmentsImportTemplate(...args),
}));

const mockImportServicesCSV = jest.fn();
const mockFetchServicesImportTemplate = jest.fn();
jest.mock('../../api/services', () => ({
  importServicesCSV: (...args: any[]) => mockImportServicesCSV(...args),
  fetchServicesImportTemplate: (...args: any[]) => mockFetchServicesImportTemplate(...args),
}));

const mockImportStaffCSV = jest.fn();
const mockFetchStaffImportTemplate = jest.fn();
jest.mock('../../api/staff', () => ({
  importStaffCSV: (...args: any[]) => mockImportStaffCSV(...args),
  fetchStaffImportTemplate: (...args: any[]) => mockFetchStaffImportTemplate(...args),
}));

const mockSaveAndShareZip = jest.fn();
jest.mock('../../utils/zipFileSharing', () => ({
  saveAndShareZip: (...args: any[]) => mockSaveAndShareZip(...args),
}));

async function pickZip(getByText: any, entries: Record<string, string>) {
  const zip = new JSZip();
  Object.entries(entries).forEach(([name, content]) => zip.file(name, content));
  const base64 = await zip.generateAsync({ type: 'base64' });

  mockGetDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///tmp/dados.zip', name: 'dados.zip', mimeType: 'application/zip' }],
  });
  mockReadAsStringAsync.mockResolvedValue(base64);
  mockWriteAsStringAsync.mockResolvedValue(undefined);

  await fireEvent.press(getByText('Escolher ficheiro ZIP'));
  await waitFor(() => expect(getByText('dados.zip')).toBeTruthy());
}

describe('BulkImportExportModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('detects all 4 entities in a full ZIP and shows each summary after previewing', async () => {
    const { getByText } = await render(
      <BulkImportExportModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await pickZip(getByText, {
      'customers.csv': 'name,email\nAna,ana@x.com\n',
      'services.csv': 'name,price_eur\nCorte,20\n',
      'staff.csv': 'email,role\njoao@x.com,collaborator\n',
      'appointments.csv': 'customer_email,service_name\nana@x.com,Corte\n',
    });

    expect(getByText('Clientes')).toBeTruthy();
    expect(getByText('Serviços')).toBeTruthy();
    expect(getByText('Colaboradores')).toBeTruthy();
    expect(getByText('Agendamentos')).toBeTruthy();

    mockImportCustomersCSV.mockResolvedValue({ summary: { created: 1, updated: 0, skipped: 0, errors: [] } });
    mockImportServicesCSV.mockResolvedValue({ summary: { created: 2, updated: 0, skipped: 0, errors: [] } });
    mockImportStaffCSV.mockResolvedValue({ summary: { created: 3, updated: 0, skipped: 0, errors: [] } });
    mockImportAppointmentsCSV.mockResolvedValue({ summary: { created: 4, updated: 0, skipped: 0, errors: [] } });

    await fireEvent.press(getByText('Pré-visualizar'));

    await waitFor(() => expect(getByText('Criados: 1')).toBeTruthy());
    expect(getByText('Criados: 2')).toBeTruthy();
    expect(getByText('Criados: 3')).toBeTruthy();
    expect(getByText('Criados: 4')).toBeTruthy();

    expect(mockImportCustomersCSV).toHaveBeenCalledWith(
      { uri: 'file:///cache/customers-import.csv', name: 'customers.csv', mimeType: 'text/csv' },
      { dryRun: true, slug: 'acme' }
    );
    expect(mockImportServicesCSV).toHaveBeenCalledWith(
      { uri: 'file:///cache/services-import.csv', name: 'services.csv', mimeType: 'text/csv' },
      { dryRun: true, slug: 'acme' }
    );
    expect(mockImportStaffCSV).toHaveBeenCalledWith(
      { uri: 'file:///cache/staff-import.csv', name: 'staff.csv', mimeType: 'text/csv' },
      { dryRun: true, slug: 'acme' }
    );
    expect(mockImportAppointmentsCSV).toHaveBeenCalledWith(
      { uri: 'file:///cache/appointments-import.csv', name: 'appointments.csv', mimeType: 'text/csv' },
      { dryRun: true, slug: 'acme' }
    );
  });

  it('is tolerant of a partial ZIP (only 2 of 4 entities)', async () => {
    const { getByText, queryByText } = await render(
      <BulkImportExportModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await pickZip(getByText, {
      'customers.csv': 'name,email\nAna,ana@x.com\n',
      'appointments.csv': 'customer_email,service_name\nana@x.com,Corte\n',
    });

    expect(getByText('Clientes')).toBeTruthy();
    expect(getByText('Agendamentos')).toBeTruthy();
    expect(queryByText('Serviços')).toBeNull();
    expect(queryByText('Colaboradores')).toBeNull();
  });

  it('shows an error when no recognized entity is found in the ZIP', async () => {
    const { getByText } = await render(
      <BulkImportExportModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    const zip = new JSZip();
    zip.file('random.txt', 'not a recognized entity');
    const base64 = await zip.generateAsync({ type: 'base64' });

    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/dados.zip', name: 'dados.zip', mimeType: 'application/zip' }],
    });
    mockReadAsStringAsync.mockResolvedValue(base64);

    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await fireEvent.press(getByText('Escolher ficheiro ZIP'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Nenhuma entidade reconhecida neste ZIP.');
    });

    await fireEvent.press(getByText('Pré-visualizar'));
    expect(mockImportCustomersCSV).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('confirms the import with dryRun=false and calls onSuccess', async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const { getByText } = await render(
      <BulkImportExportModal visible onClose={onClose} onSuccess={onSuccess} slug="acme" />
    );

    await pickZip(getByText, {
      'customers.csv': 'name,email\nAna,ana@x.com\n',
      'appointments.csv': 'customer_email,service_name\nana@x.com,Corte\n',
    });

    mockImportCustomersCSV.mockResolvedValue({ summary: { created: 1, updated: 0, skipped: 0, errors: [] } });
    mockImportAppointmentsCSV.mockResolvedValue({ summary: { created: 4, updated: 0, skipped: 0, errors: [] } });

    await fireEvent.press(getByText('Pré-visualizar'));
    await waitFor(() => getByText('Confirmar importação'));
    await fireEvent.press(getByText('Confirmar importação'));

    await waitFor(() => {
      expect(mockImportCustomersCSV).toHaveBeenCalledWith(
        { uri: 'file:///cache/customers-import.csv', name: 'customers.csv', mimeType: 'text/csv' },
        { dryRun: false, slug: 'acme' }
      );
    });
    expect(mockImportAppointmentsCSV).toHaveBeenCalledWith(
      { uri: 'file:///cache/appointments-import.csv', name: 'appointments.csv', mimeType: 'text/csv' },
      { dryRun: false, slug: 'acme' }
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('downloads the template ZIP with the 4 template CSVs aggregated', async () => {
    mockFetchCustomersImportTemplate.mockResolvedValue('name,email\n');
    mockFetchServicesImportTemplate.mockResolvedValue('name,price_eur\n');
    mockFetchStaffImportTemplate.mockResolvedValue('email,role\n');
    mockFetchAppointmentsImportTemplate.mockResolvedValue('customer_email,service_name\n');

    const { getByText } = await render(
      <BulkImportExportModal visible onClose={jest.fn()} onSuccess={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Descarregar modelo ZIP'));

    await waitFor(() => {
      expect(mockSaveAndShareZip).toHaveBeenCalledWith(expect.any(String), 'modelo-dados.zip');
    });

    const [base64Arg] = mockSaveAndShareZip.mock.calls[0];
    const zip = await JSZip.loadAsync(base64Arg, { base64: true });
    expect(await zip.files['customers.csv'].async('string')).toBe('name,email\n');
    expect(await zip.files['services.csv'].async('string')).toBe('name,price_eur\n');
    expect(await zip.files['staff.csv'].async('string')).toBe('email,role\n');
    expect(await zip.files['appointments.csv'].async('string')).toBe('customer_email,service_name\n');
  });
});
