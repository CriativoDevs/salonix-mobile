import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export async function saveAndShareZip(base64Content: string, filename: string): Promise<void> {
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64Content, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert(
      'Partilha indisponível',
      `Não foi possível abrir a partilha neste dispositivo. O ficheiro ${filename} foi guardado localmente.`
    );
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/zip',
    UTI: 'com.pkware.zip-archive',
  });
}
