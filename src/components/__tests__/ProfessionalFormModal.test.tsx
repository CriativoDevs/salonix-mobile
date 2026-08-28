import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfessionalFormModal } from '../ProfessionalFormModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      error: '#ef4444',
      success: '#22c55e',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

const mockFetchServices = jest.fn();
jest.mock('../../api/services', () => ({
  fetchServices: (...args: any[]) => mockFetchServices(...args),
}));

const mockUpdateStaffMember = jest.fn();
const mockDisableStaffMember = jest.fn();
jest.mock('../../api/staff', () => ({
  updateStaffMember: (...args: any[]) => mockUpdateStaffMember(...args),
  disableStaffMember: (...args: any[]) => mockDisableStaffMember(...args),
}));

const mockRequestMediaLibraryPermissions = jest.fn();
const mockRequestCameraPermissions = jest.fn();
const mockLaunchImageLibrary = jest.fn();
const mockLaunchCamera = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: any[]) => mockRequestMediaLibraryPermissions(...args),
  requestCameraPermissionsAsync: (...args: any[]) => mockRequestCameraPermissions(...args),
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibrary(...args),
  launchCameraAsync: (...args: any[]) => mockLaunchCamera(...args),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockGetInfoAsync = jest.fn();
jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: (...args: any[]) => mockGetInfoAsync(...args),
}));

describe('ProfessionalFormModal - photo', () => {
  const initialData = {
    id: '10',
    name: 'João Costa',
    email: 'joao@example.com',
    phone_number: '',
    job_title: 'Cabeleireiro',
    bio: '',
    staff_member: 7,
    staff_member_data: { id: 7, photo: '/media/staff_photos/old.jpg' },
    service_ids: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchServices.mockResolvedValue([]);
    mockRequestMediaLibraryPermissions.mockResolvedValue({ granted: true });
    mockRequestCameraPermissions.mockResolvedValue({ granted: true });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
  });

  const pickFromGallery = async (getByText: any, alertSpy: jest.SpyInstance, buttonText = 'Alterar foto') => {
    await fireEvent.press(getByText(buttonText));
    const options = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
    const galleryOption = options.find((o: any) => o.text === 'Escolher da galeria');
    await galleryOption.onPress();
  };

  it('does not show a photo picker when creating a new professional (no staff account yet)', async () => {
    const { queryByText, findByPlaceholderText } = await render(
      <ProfessionalFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );

    await findByPlaceholderText('Nome completo');
    expect(queryByText('Adicionar foto')).toBeNull();
    expect(queryByText('Alterar foto')).toBeNull();
  });

  it('shows the Avatar preview with the existing photo when editing', async () => {
    const { getByTestId, getByText } = await render(
      <ProfessionalFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={initialData} />
    );

    await waitFor(() => {
      expect(getByTestId('professional-form-avatar').props.source.uri).toContain('/media/staff_photos/old.jpg');
    });
    expect(getByText('Alterar foto')).toBeTruthy();
  });

  it('updates the Avatar preview after picking a new photo from the gallery', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/professional.jpg', mimeType: 'image/jpeg', fileName: 'professional.jpg' }],
    });

    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = await render(
      <ProfessionalFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={initialData} />
    );

    await waitFor(() => expect(getByText('Alterar foto')).toBeTruthy());
    await pickFromGallery(getByText, alertSpy);

    await waitFor(() => {
      expect(getByTestId('professional-form-avatar').props.source.uri).toBe('file:///tmp/professional.jpg');
    });

    alertSpy.mockRestore();
  });

  it('includes photoFile in the payload passed to onSubmit when saving with a new photo', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/professional.jpg', mimeType: 'image/jpeg', fileName: 'professional.jpg' }],
    });

    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByTestId } = await render(
      <ProfessionalFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={initialData} />
    );

    await waitFor(() => expect(getByText('Alterar foto')).toBeTruthy());
    await pickFromGallery(getByText, alertSpy);

    await waitFor(() => {
      expect(getByTestId('professional-form-avatar').props.source.uri).toBe('file:///tmp/professional.jpg');
    });

    await fireEvent.press(getByText('Salvar'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          photoFile: {
            uri: 'file:///tmp/professional.jpg',
            name: 'professional.jpg',
            mimeType: 'image/jpeg',
          },
        })
      );
    });

    alertSpy.mockRestore();
  });

  it('does not include photoFile when no new photo was picked', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByText } = await render(
      <ProfessionalFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={initialData} />
    );

    await waitFor(() => expect(getByText('Salvar')).toBeTruthy());
    await fireEvent.press(getByText('Salvar'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].photoFile).toBeUndefined();
  });

  it('rejects a file larger than 2MB with an error message and does not set the photo', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/big.jpg', mimeType: 'image/jpeg', fileName: 'big.jpg' }],
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 3 * 1024 * 1024 });

    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(
      <ProfessionalFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={initialData} />
    );

    await waitFor(() => expect(getByText('Alterar foto')).toBeTruthy());
    await pickFromGallery(getByText, alertSpy);

    await waitFor(() => {
      expect(getByText('O ficheiro deve ter no máximo 2MB.')).toBeTruthy();
    });

    alertSpy.mockRestore();
  });

  it('rejects an unsupported mime type with an error message and does not set the photo', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/doc.pdf', mimeType: 'application/pdf', fileName: 'doc.pdf' }],
    });

    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(
      <ProfessionalFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={initialData} />
    );

    await waitFor(() => expect(getByText('Alterar foto')).toBeTruthy());
    await pickFromGallery(getByText, alertSpy);

    await waitFor(() => {
      expect(getByText('Formato não suportado. Use JPEG, PNG, GIF ou WEBP.')).toBeTruthy();
    });
    expect(mockGetInfoAsync).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
