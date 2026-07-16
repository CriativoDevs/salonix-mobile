jest.mock('expo-file-system/legacy', () => ({
  writeAsStringAsync: jest.fn(),
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

const FileSystem = require('expo-file-system/legacy');
const Sharing = require('expo-sharing');
const { Alert } = require('react-native');
const { saveAndShareZip } = require('../zipFileSharing');

describe('saveAndShareZip', () => {
  afterEach(() => jest.clearAllMocks());

  it('writes the base64 zip content to a cache file (base64 encoding) and shares it', async () => {
    FileSystem.writeAsStringAsync.mockResolvedValue(undefined);
    Sharing.isAvailableAsync.mockResolvedValue(true);
    Sharing.shareAsync.mockResolvedValue(undefined);

    await saveAndShareZip('base64content==', 'dados.zip');

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///cache/dados.zip',
      'base64content==',
      { encoding: 'base64' }
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/dados.zip', {
      mimeType: 'application/zip',
      UTI: 'com.pkware.zip-archive',
    });
  });

  it('shows an alert instead of sharing when sharing is unavailable', async () => {
    FileSystem.writeAsStringAsync.mockResolvedValue(undefined);
    Sharing.isAvailableAsync.mockResolvedValue(false);

    await saveAndShareZip('base64content==', 'dados.zip');

    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Partilha indisponível',
      expect.stringContaining('dados.zip')
    );
  });
});
