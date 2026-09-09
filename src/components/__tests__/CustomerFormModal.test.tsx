import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CustomerFormModal } from '../CustomerFormModal';

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
    },
  }),
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

describe('CustomerFormModal - photo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestMediaLibraryPermissions.mockResolvedValue({ granted: true });
    mockRequestCameraPermissions.mockResolvedValue({ granted: true });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
  });

  // Foto do cliente usa `ActionMenu` (themed) em vez de `Alert.alert` com botões —
  // ver src/components/ui/ActionMenu.tsx. Simula-se a interação real: abrir o menu
  // tocando no botão de foto, depois tocar na opção pretendida.
  const pickFromGallery = async (getByText: any, buttonText = 'Adicionar foto') => {
    await fireEvent.press(getByText(buttonText));
    await fireEvent.press(getByText('Escolher da galeria'));
  };

  it('shows an Avatar preview after picking a photo from the gallery', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/customer.jpg', mimeType: 'image/jpeg', fileName: 'customer.jpg' }],
    });

    const { getByText, getByTestId } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );

    await pickFromGallery(getByText);

    await waitFor(() => {
      expect(getByTestId('customer-form-avatar').props.source.uri).toBe('file:///tmp/customer.jpg');
    });
    expect(getByText('Alterar foto')).toBeTruthy();
  });

  it('includes photoFile in the payload passed to onSubmit when creating a customer', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/customer.jpg', mimeType: 'image/jpeg', fileName: 'customer.jpg' }],
    });

    const onSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );

    await pickFromGallery(getByText);
    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'Maria Silva');
    await fireEvent.changeText(getByPlaceholderText('cliente@email.com'), 'maria@example.com');

    await fireEvent.press(getByText('Salvar'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Maria Silva',
          email: 'maria@example.com',
          photoFile: {
            uri: 'file:///tmp/customer.jpg',
            name: 'customer.jpg',
            mimeType: 'image/jpeg',
          },
        })
      );
    });
  });

  it('includes photoFile in the payload passed to onSubmit when editing a customer', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/new.jpg', mimeType: 'image/jpeg', fileName: 'new.jpg' }],
    });

    const onSubmit = jest.fn().mockResolvedValue(undefined);

    const initialData = {
      id: '1',
      name: 'João Costa',
      email: 'joao@example.com',
      phone_number: '',
      notes: '',
      photo: '/media/customer_photos/old.jpg',
    };

    const { getByText, getByTestId } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={initialData} />
    );

    await waitFor(() => expect(getByText('Alterar foto')).toBeTruthy());
    await pickFromGallery(getByText, 'Alterar foto');

    await waitFor(() => {
      expect(getByTestId('customer-form-avatar').props.source.uri).toBe('file:///tmp/new.jpg');
    });

    await fireEvent.press(getByText('Salvar'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          photoFile: { uri: 'file:///tmp/new.jpg', name: 'new.jpg', mimeType: 'image/jpeg' },
        })
      );
    });
  });

  it('does not include photoFile when no new photo was picked', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );

    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'Ana');
    await fireEvent.changeText(getByPlaceholderText('cliente@email.com'), 'ana@example.com');
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

    const onSubmit = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText, queryByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );

    await pickFromGallery(getByText);

    await waitFor(() => {
      expect(getByText('O ficheiro deve ter no máximo 2MB.')).toBeTruthy();
    });
    expect(getByText('Adicionar foto')).toBeTruthy();

    await fireEvent.changeText(getByPlaceholderText('Nome completo'), 'Maria Silva');
    await fireEvent.changeText(getByPlaceholderText('cliente@email.com'), 'maria@example.com');
    await fireEvent.press(getByText('Salvar'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].photoFile).toBeUndefined();
  });

  it('rejects an unsupported mime type with an error message and does not set the photo', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/doc.pdf', mimeType: 'application/pdf', fileName: 'doc.pdf' }],
    });

    const { getByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );

    await pickFromGallery(getByText);

    await waitFor(() => {
      expect(getByText('Formato não suportado. Use JPEG, PNG, GIF ou WEBP.')).toBeTruthy();
    });
    expect(getByText('Adicionar foto')).toBeTruthy();
    expect(mockGetInfoAsync).not.toHaveBeenCalled();
  });

  it('accepts a valid file within size and mime type limits, clearing any previous error', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/customer.png', mimeType: 'image/png', fileName: 'customer.png' }],
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 512 * 1024 });

    const { getByText, getByTestId, queryByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );

    await pickFromGallery(getByText);

    await waitFor(() => {
      expect(getByTestId('customer-form-avatar').props.source.uri).toBe('file:///tmp/customer.png');
    });
    expect(queryByText('O ficheiro deve ter no máximo 2MB.')).toBeFalsy();
    expect(queryByText('Formato não suportado. Use JPEG, PNG, GIF ou WEBP.')).toBeFalsy();
  });
});
