import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VoucherAssignModal } from '../VoucherAssignModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
      error: '#ef4444',
      errorBackground: '#fee2e2',
      brandPrimary: '#3b82f6',
    },
  }),
}));

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

// O Modal real anima com Animated.timing/spring (300ms, useNativeDriver).
// Essas animações continuam rodando via RAF/timers reais entre testes e
// corrompem o rastreamento de act() do React para o próximo teste do
// arquivo (sintoma: render() de um teste seguinte produz árvore vazia).
// Aqui testamos a lógica do VoucherAssignModal, não a animação do Modal
// genérico — substituí-lo por uma versão sem animação remove essa fonte de
// flakiness sem perder cobertura do que este arquivo realmente testa.
jest.mock('../ui/Modal', () => {
  const RN = require('react-native');
  const ReactLib = require('react');
  return {
    Modal: ({ visible, title, description, children, footer }: any) => {
      if (!visible) return null;
      return ReactLib.createElement(
        RN.View,
        null,
        ReactLib.createElement(RN.Text, null, title),
        ReactLib.createElement(RN.Text, null, description),
        children,
        ReactLib.createElement(RN.View, null, footer)
      );
    },
  };
});

const mockFetchCustomers = jest.fn();
jest.mock('../../api/customers', () => ({
  fetchCustomers: (...args: any[]) => mockFetchCustomers(...args),
}));

beforeEach(() => {
  mockLanguage = 'pt';
  mockFetchCustomers.mockReset();
  mockFetchCustomers.mockResolvedValue([]);
});

// Abre o dropdown e espera o preload (chamado ao montar) assentar antes de
// qualquer outra interação — fazer isso ANTES de disparar fireEvent.changeText
// evita uma corrida entre a promise do preload e o wrapper act() do RNTL que
// deixa o ambiente de teste num estado onde updates de estado posteriores
// (ex.: selecionar um cliente) nunca chegam a ser commitados.
async function openDropdownAndWaitPreload(getByPlaceholderText: any, waitForPreloadCall = true) {
  const input = getByPlaceholderText('Nome ou e-mail do cliente');
  fireEvent(input, 'focus');
  if (waitForPreloadCall) {
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalledTimes(1));
    // Garante que a resolução da promise do preload (setResults/setSearching)
    // já foi commitada, não só chamada — sem isso, o commit pode acontecer
    // fora de um act() e corromper o ambiente de teste para o resto do arquivo.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return input;
}

describe('VoucherAssignModal - language', () => {
  it('shows English text when language is en', async () => {
    mockLanguage = 'en';
    const { getByText } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    expect(getByText('Assign to client')).toBeTruthy();
    expect(getByText('Assign voucher')).toBeTruthy();
  });
});

describe('VoucherAssignModal', () => {
  it('preloads a client list and shows it in the dropdown once the input is focused', async () => {
    mockFetchCustomers.mockResolvedValue([{ id: 7, name: 'Cliente Pré-carregado', email: 'pre@example.com' }]);
    const { getByPlaceholderText, findByText } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    await openDropdownAndWaitPreload(getByPlaceholderText);
    expect(await findByText('Cliente Pré-carregado')).toBeTruthy();
    expect(mockFetchCustomers).toHaveBeenCalledWith(expect.objectContaining({ limit: 8, slug: 'acme' }));
  });

  it('does not trigger an extra search before 2 characters are typed', async () => {
    const { getByPlaceholderText } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    const input = await openDropdownAndWaitPreload(getByPlaceholderText);
    fireEvent.changeText(input, 'a');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mockFetchCustomers).toHaveBeenCalledTimes(1);
  });

  it('searches clients (debounced) and lists the results', async () => {
    mockFetchCustomers.mockResolvedValue([{ id: 5, name: 'Maria Silva', email: 'maria@example.com' }]);
    const { getByPlaceholderText, findByText } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    const input = await openDropdownAndWaitPreload(getByPlaceholderText);
    await findByText('Maria Silva');
    fireEvent.changeText(input, 'Maria');

    await waitFor(() =>
      expect(mockFetchCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Maria', slug: 'acme' })
      )
    );
    expect(await findByText('Maria Silva')).toBeTruthy();
  });

  it('selects a client and submits with sendEmail false by default', async () => {
    mockFetchCustomers.mockResolvedValue([{ id: 5, name: 'Maria Silva', email: 'maria@example.com' }]);
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, findByText, getByText, getByTestId } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={onSubmit} />
    );
    await openDropdownAndWaitPreload(getByPlaceholderText);
    await findByText('Maria Silva');
    fireEvent.press(getByTestId('voucher-assign-client-5'));
    await findByText('Selecionado: Maria Silva');
    fireEvent.press(getByText('Atribuir voucher'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        client: { id: 5, name: 'Maria Silva', email: 'maria@example.com' },
        sendEmail: false,
      })
    );
  });

  it('toggles sendEmail on when the client has an email', async () => {
    mockFetchCustomers.mockResolvedValue([{ id: 5, name: 'Maria Silva', email: 'maria@example.com' }]);
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, findByText, getByText, getByTestId } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={onSubmit} />
    );
    await openDropdownAndWaitPreload(getByPlaceholderText);
    await findByText('Maria Silva');
    fireEvent.press(getByTestId('voucher-assign-client-5'));
    await findByText('Selecionado: Maria Silva');
    fireEvent.press(getByTestId('voucher-assign-send-email-toggle'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.press(getByText('Atribuir voucher'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        client: { id: 5, name: 'Maria Silva', email: 'maria@example.com' },
        sendEmail: true,
      })
    );
  });

  it('shows a message when the selected client has no email', async () => {
    mockFetchCustomers.mockResolvedValue([{ id: 6, name: 'Joao Sem Email', email: null }]);
    const { getByPlaceholderText, findByText, getByTestId } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    await openDropdownAndWaitPreload(getByPlaceholderText);
    await findByText('Joao Sem Email');
    fireEvent.press(getByTestId('voucher-assign-client-6'));

    expect(await findByText('Este cliente não tem e-mail cadastrado.')).toBeTruthy();
  });

  it('lets the user clear the selection', async () => {
    mockFetchCustomers.mockResolvedValue([{ id: 5, name: 'Maria Silva', email: 'maria@example.com' }]);
    const { getByPlaceholderText, findByText, getByTestId, queryByText } = await render(
      <VoucherAssignModal visible voucher={{ id: 1, code: 'ABC123' }} onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    await openDropdownAndWaitPreload(getByPlaceholderText);
    await findByText('Maria Silva');
    fireEvent.press(getByTestId('voucher-assign-client-5'));
    await findByText('Selecionado: Maria Silva');

    fireEvent.press(getByTestId('voucher-assign-clear-selection'));
    await waitFor(() => expect(queryByText('Selecionado: Maria Silva')).toBeNull());
  });

  it('selects several clients and submits via onSubmitBulk', async () => {
    mockFetchCustomers.mockResolvedValue([
      { id: 5, name: 'Maria Silva', email: 'maria@example.com' },
      { id: 6, name: 'Joao Souza', email: null },
    ]);
    const onSubmitBulk = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, findByText, getByTestId, getByText } = await render(
      <VoucherAssignModal
        visible
        voucher={{ id: 1, code: 'ABC123' }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        onSubmitBulk={onSubmitBulk}
      />
    );
    await openDropdownAndWaitPreload(getByPlaceholderText);
    await findByText('Maria Silva');
    fireEvent.press(getByTestId('voucher-assign-client-5'));
    await findByText('Selecionado: Maria Silva');
    fireEvent.press(getByTestId('voucher-assign-client-6'));
    await findByText('2 clientes selecionados');

    fireEvent.press(getByText('Atribuir a 2 clientes'));

    await waitFor(() =>
      expect(onSubmitBulk).toHaveBeenCalledWith([
        { id: 5, name: 'Maria Silva', email: 'maria@example.com' },
        { id: 6, name: 'Joao Souza', email: null },
      ])
    );
  });

  it('selects all visible clients via the select-all toggle', async () => {
    mockFetchCustomers.mockResolvedValue([
      { id: 5, name: 'Maria Silva', email: 'maria@example.com' },
      { id: 6, name: 'Joao Souza', email: null },
    ]);
    const onSubmitBulk = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, findByText, getByTestId, getByText } = await render(
      <VoucherAssignModal
        visible
        voucher={{ id: 1, code: 'ABC123' }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        onSubmitBulk={onSubmitBulk}
      />
    );
    await openDropdownAndWaitPreload(getByPlaceholderText);
    await findByText('Maria Silva');
    fireEvent.press(getByTestId('voucher-assign-select-all'));
    await findByText('2 clientes selecionados');

    fireEvent.press(getByText('Atribuir a 2 clientes'));

    await waitFor(() => expect(onSubmitBulk).toHaveBeenCalledTimes(1));
  });
});
