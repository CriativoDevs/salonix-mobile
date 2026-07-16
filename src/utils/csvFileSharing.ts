import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export async function saveAndShareCSV(content: string, filename: string): Promise<void> {
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, content);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert(
      'Partilha indisponível',
      `Não foi possível abrir a partilha neste dispositivo. O ficheiro ${filename} foi guardado localmente.`
    );
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}
