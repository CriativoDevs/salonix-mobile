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

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('../CustomerFormsSection', () => {
  const { Text } = require('react-native');
  return {
    CustomerFormsSection: ({ customerId, slug }: any) => (
      <Text>{`forms-section:${customerId}:${slug}`}</Text>
    ),
  };
});

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

beforeEach(() => {
  mockLanguage = 'pt';
});

describe('CustomerFormModal - language', () => {
  it('shows English text when language is en', async () => {
    mockLanguage = 'en';
    const { getByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    expect(getByText('New Customer')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });
});

describe('CustomerFormModal - photo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestMediaLibraryPermissions.mockResolvedValue({ granted: true });
    mockRequestCameraPermissions.mockResolvedValue({ granted: true });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
  });

  // As opções de foto aparecem inline (sem 2.º Modal). Simula-se a interação real:
  // tocar no botão de foto e depois na opção pretendida.
  const pickFromGallery = async (getByText: any, buttonText = 'Adicionar foto') => {
    await fireEvent.press(getByText(buttonText));
    await fireEvent.press(getByText('Escolher da galeria'));
  };

  it('mostra as opções de foto inline, sem segundo Modal (no iOS ele não aparece e trava os toques)', async () => {
    const { getByText, queryByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );

    expect(queryByText('Escolher da galeria')).toBeNull();
    await fireEvent.press(getByText('Adicionar foto'));

    expect(getByText('Escolher da galeria')).toBeTruthy();
    expect(getByText('Tirar foto')).toBeTruthy();
    // O menu themed (ActionMenu) era um 2.º Modal com este título: não pode voltar.
    expect(queryByText('Foto do cliente')).toBeNull();
  });

  it('abre o seletor logo ao tocar na opção e fecha o painel de opções', async () => {
    mockLaunchImageLibrary.mockResolvedValue({ canceled: true });
    const { getByText, queryByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );

    await fireEvent.press(getByText('Adicionar foto'));
    await fireEvent.press(getByText('Escolher da galeria'));

    await waitFor(() => expect(mockLaunchImageLibrary).toHaveBeenCalledTimes(1));
    expect(queryByText('Escolher da galeria')).toBeNull();
  });

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

  it('rejeita foto acima de 2000x2000 px com mensagem clara (o BE responderia 400)', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/big.jpg', mimeType: 'image/jpeg', fileName: 'big.jpg', width: 4032, height: 3024 }],
    });

    const { getByText, findByText, queryByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );

    await pickFromGallery(getByText);

    expect(await findByText('A imagem deve ter entre 50x50 e 2000x2000 pixels.')).toBeTruthy();
    expect(queryByText('Alterar foto')).toBeNull();
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

describe('CustomerFormModal - fichas do cliente', () => {
  it('renders the forms section only when editing an existing customer', async () => {
    const { getByText } = await render(
      <CustomerFormModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        initialData={{ id: 'c9', name: 'Ana', email: 'a@a.com', phone_number: '', notes: '' }}
      />
    );
    expect(getByText('forms-section:c9:acme')).toBeTruthy();
  });

  it('does not render the forms section for a new customer', async () => {
    const { queryByText } = await render(
      <CustomerFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    expect(queryByText(/forms-section/)).toBeNull();
  });
});
