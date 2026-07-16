jest.mock('expo-file-system/legacy', () => ({
  writeAsStringAsync: jest.fn(),
  cacheDirectory: 'file:///cache/',
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
const { saveAndShareCSV } = require('../csvFileSharing');

describe('saveAndShareCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('writes the CSV content to a cache file and shares it', async () => {
    FileSystem.writeAsStringAsync.mockResolvedValue(undefined);
    Sharing.isAvailableAsync.mockResolvedValue(true);
    Sharing.shareAsync.mockResolvedValue(undefined);

    await saveAndShareCSV('id,name\n1,Corte', 'agendamentos.csv');

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///cache/agendamentos.csv',
      'id,name\n1,Corte'
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/agendamentos.csv', {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  });

  it('shows an alert instead of sharing when sharing is unavailable', async () => {
    FileSystem.writeAsStringAsync.mockResolvedValue(undefined);
    Sharing.isAvailableAsync.mockResolvedValue(false);

    await saveAndShareCSV('id,name\n1,Corte', 'agendamentos.csv');

    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Partilha indisponível',
      expect.stringContaining('agendamentos.csv')
    );
  });
});
