import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking, Alert } from 'react-native';
import WhatsAppButton from '../WhatsAppButton';

const baseAppointment = {
  customerName: 'Maria',
  customerPhone: '912345678',
  serviceName: 'Corte de cabelo',
  professionalName: 'Ana',
  salonName: 'Salão Exemplo',
  slotStart: '2026-10-01T15:30:00Z',
};

describe('WhatsAppButton', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('abre a URL wa.me com o número normalizado quando o cliente tem telefone', async () => {
    const { getByRole, unmount } = await render(
      <WhatsAppButton appointment={baseAppointment} eventType="confirmation" label="Enviar confirmação" />
    );

    const button = getByRole('button', { name: 'Enviar confirmação' });
    fireEvent.press(button);

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/351912345678')
      );
    });

    unmount();
  });

  it('não renderiza nada quando o cliente não tem telefone', async () => {
    const { queryByRole } = await render(
      <WhatsAppButton
        appointment={{ ...baseAppointment, customerPhone: '' }}
        eventType="confirmation"
        label="Enviar confirmação"
      />
    );

    expect(queryByRole('button', { name: 'Enviar confirmação' })).toBeNull();
  });

  it('não renderiza nada quando não há appointment', async () => {
    const { queryByRole } = await render(
      <WhatsAppButton appointment={null} eventType="confirmation" label="Enviar" />
    );

    expect(queryByRole('button')).toBeNull();
  });

  it('não renderiza nada para eventType desconhecido', async () => {
    const { queryByRole } = await render(
      <WhatsAppButton appointment={baseAppointment} eventType="unknown" label="Enviar" />
    );

    expect(queryByRole('button')).toBeNull();
  });

  it('mostra alerta quando o WhatsApp não pode ser aberto', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const { getByRole } = await render(
      <WhatsAppButton appointment={baseAppointment} eventType="reminder" label="Enviar lembrete" />
    );

    fireEvent.press(getByRole('button', { name: 'Enviar lembrete' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
    // A URL do lembrete não deve ter sido aberta (o canOpenURL negou a abertura).
    expect(Linking.openURL).not.toHaveBeenCalledWith(expect.stringContaining('Lembrete'));
  });
});
