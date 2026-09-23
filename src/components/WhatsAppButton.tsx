import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buildWhatsAppUrl, buildWhatsAppMessage, WhatsAppAppointment, WhatsAppEventType } from '../utils/whatsapp';
import { useLanguage } from '../contexts/LanguageContext';

const COPY = {
  pt: {
    unavailableTitle: 'WhatsApp indisponível',
    unavailableMessage: 'Não foi possível abrir o WhatsApp neste dispositivo.',
    errorTitle: 'Erro',
    errorMessage: 'Não foi possível abrir o WhatsApp.',
  },
  en: {
    unavailableTitle: 'WhatsApp unavailable',
    unavailableMessage: 'Could not open WhatsApp on this device.',
    errorTitle: 'Error',
    errorMessage: 'Could not open WhatsApp.',
  },
} as const;

const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_GREEN_DARK = '#128C7E';

interface WhatsAppButtonProps {
  appointment?: WhatsAppAppointment | null;
  eventType: WhatsAppEventType | string;
  label: string;
}

/**
 * Botão "Enviar via WhatsApp" (Click-to-Chat, wa.me).
 * Não renderiza nada se o cliente não tiver telefone registado ou se não
 * for possível montar a mensagem/URL (ex.: eventType desconhecido).
 */
export default function WhatsAppButton({ appointment, eventType, label }: WhatsAppButtonProps) {
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  if (!appointment) return null;

  const phone = appointment.customerPhone;
  const message = buildWhatsAppMessage(appointment, eventType);
  if (!message) return null;

  const url = buildWhatsAppUrl(phone, message);
  if (!url) return null;

  const handlePress = async () => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t.unavailableTitle, t.unavailableMessage);
      }
    } catch (error) {
      console.error('Error opening WhatsApp URL:', error);
      Alert.alert(t.errorTitle, t.errorMessage);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="logo-whatsapp" size={16} color={WHATSAPP_GREEN_DARK} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${WHATSAPP_GREEN}4D`,
    backgroundColor: `${WHATSAPP_GREEN}1A`,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: WHATSAPP_GREEN_DARK,
  },
});
