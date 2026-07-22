import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { getRegistrationLink } from '../utils/env';

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
  const link = slug ? getRegistrationLink(slug) : '';

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert('Copiado', 'Link copiado para a área de transferência.');
    } catch (error) {
      console.error('Error copying registration link:', error);
      Alert.alert('Erro', 'Não foi possível copiar o link.');
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="QR Code de registo"
      footer={
        <Button onPress={onClose} style={{ flex: 1 }}>
          Fechar
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
              Copiar link
            </Button>
          </>
        ) : (
          <Text style={{ color: colors.textSecondary }}>Link indisponível.</Text>
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
