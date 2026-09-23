/**
 * Utilitários para o botão "Enviar via WhatsApp" (Click-to-Chat, protocolo wa.me).
 * Espelha a lógica de src/utils/whatsapp.js do frontend web (FEW-WHATSAPP-01),
 * adaptada para consumo em React Native (Linking.openURL, sem <a href>).
 */

export type WhatsAppEventType = 'confirmation' | 'reminder' | 'cancellation';

export interface WhatsAppAppointment {
  customerName?: string | null;
  clientName?: string | null;
  customerPhone?: string | null;
  serviceName?: string | null;
  professionalName?: string | null;
  salonName?: string | null;
  slotStart?: string | null;
}

/**
 * Normaliza número PT para formato internacional sem "+".
 * "912345678" -> "351912345678"
 * "+351912345678" -> "351912345678"
 * "351912345678" -> "351912345678"
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('351') && digits.length === 12) return digits;
  if (digits.length === 9) return `351${digits}`;
  return digits;
}

/**
 * Gera a URL wa.me (WhatsApp Click-to-Chat) para um número e mensagem.
 */
export function buildWhatsAppUrl(phone?: string | null, message?: string | null): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message || '')}`;
}

function formatAppointmentDateTime(startTime?: string | null): string {
  if (!startTime) return '';
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return '';
  const formatted = date.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const time = date.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatted} às ${time}`;
}

/**
 * Gera o texto da mensagem de WhatsApp para um agendamento.
 * eventType: 'confirmation' | 'reminder' | 'cancellation'
 */
export function buildWhatsAppMessage(
  appointment?: WhatsAppAppointment | null,
  eventType?: WhatsAppEventType | string
): string | null {
  if (!appointment) return null;

  const clientName = appointment.customerName || appointment.clientName || '';
  const serviceName = appointment.serviceName || '';
  const professionalName = appointment.professionalName || '';
  const salonName = appointment.salonName || '';
  const dt = formatAppointmentDateTime(appointment.slotStart);

  const templates: Record<string, string> = {
    confirmation:
      `Olá ${clientName} 👋\n\nA sua marcação está confirmada!\n\n` +
      `📅 ${dt}\n✂️ ${serviceName}\n👤 ${professionalName}\n\n` +
      `Até breve! — ${salonName}`,
    reminder:
      `Olá ${clientName}! 👋\n\nLembrete: tem uma marcação em breve.\n\n` +
      `📅 ${dt}\n✂️ ${serviceName}\n👤 ${professionalName}\n\n` +
      `Até já! — ${salonName}`,
    cancellation:
      `Olá ${clientName},\n\nA sua marcação foi cancelada.\n\n` +
      `📅 ${dt}\n✂️ ${serviceName}\n\n` +
      `Para remarcar, fale connosco. — ${salonName}`,
  };

  return templates[eventType as string] ?? null;
}
