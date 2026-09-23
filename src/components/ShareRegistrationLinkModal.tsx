import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { getRegistrationLink } from '../utils/env';

const COPY = {
  pt: {
    copiedTitle: 'Copiado',
    copiedMessage: 'Link copiado para a área de transferência.',
    errorTitle: 'Erro',
    copyError: 'Não foi possível copiar o link.',
    title: 'QR Code de registo',
    close: 'Fechar',
    copyLink: 'Copiar link',
    unavailable: 'Link indisponível.',
  },
  en: {
    copiedTitle: 'Copied',
    copiedMessage: 'Link copied to clipboard.',
    errorTitle: 'Error',
    copyError: 'Could not copy the link.',
    title: 'Registration QR Code',
    close: 'Close',
    copyLink: 'Copy link',
    unavailable: 'Link unavailable.',
  },
} as const;

interface ShareRegistrationLinkModalProps {
  visible: boolean;
  onClose: () => void;
  slug?: string;
}

export function ShareRegistrationLinkModal({
  visible,
  onClose,
  slug,
}: ShareRegistrationLinkModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;
  const link = slug ? getRegistrationLink(slug) : '';

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert(t.copiedTitle, t.copiedMessage);
    } catch (error) {
      console.error('Error copying registration link:', error);
      Alert.alert(t.errorTitle, t.copyError);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t.title}
      footer={
        <Button onPress={onClose} style={{ flex: 1 }}>
          {t.close}
        </Button>
      }
    >
      <View style={styles.content}>
        {link ? (
          <>
            <View style={styles.qrWrapper}>
              <QRCode value={link} size={220} />
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {link}
            </Text>
            <Button variant="secondary" onPress={handleCopy}>
              {t.copyLink}
            </Button>
          </>
        ) : (
          <Text style={{ color: colors.textSecondary }}>{t.unavailable}</Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  qrWrapper: {
    marginBottom: 16,
  },
});
