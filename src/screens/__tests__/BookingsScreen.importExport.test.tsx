import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BookingsScreen from '../BookingsScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      error: '#ef4444',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

const mockRefetch = jest.fn();
jest.mock('../../hooks/useBookings', () => ({
  __esModule: true,
  default: () => ({
    appointments: [],
    totalCount: 0,
    loading: false,
    loadingMore: false,
    error: null,
    customers: [],
    refetch: mockRefetch,
    loadMore: jest.fn(),
  }),
}));

jest.mock('../../components/calendar/WeekView', () => {
  const { Text } = require('react-native');
  return { __esModule: true, WeekView: () => <Text testID="week-view-stub">week</Text> };
});
jest.mock('../../components/calendar/DayView', () => {
  const { Text } = require('react-native');
  return { __esModule: true, DayView: () => <Text testID="day-view-stub">day</Text> };
});
jest.mock('../../components/calendar/MonthView', () => {
  const { Text } = require('react-native');
  return { __esModule: true, MonthView: () => <Text testID="month-view-stub">month</Text> };
});

const mockExportAppointmentsCSV = jest.fn();
jest.mock('../../api/bookings', () => ({
  exportAppointmentsCSV: (...args: any[]) => mockExportAppointmentsCSV(...args),
}));

const mockSaveAndShareCSV = jest.fn();
jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: (...args: any[]) => mockSaveAndShareCSV(...args),
}));

jest.mock('../../components/ImportAppointmentsModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    ImportAppointmentsModal: ({ visible, onSuccess }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={onSuccess}>
          <Text>import-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('BookingsScreen - import/export', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
  });
  afterEach(() => jest.clearAllMocks());

  it('exports the CSV and shares it when "Exportar CSV" is chosen', async () => {
    mockExportAppointmentsCSV.mockResolvedValue('id,customer\n1,Ana\n');
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const exportButton = buttons?.find((b: any) => b.text === 'Exportar CSV');
      exportButton?.onPress?.();
    });

    const { getByText } = await render(<BookingsScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(mockExportAppointmentsCSV).toHaveBeenCalledWith({ slug: 'acme' });
    });
    expect(mockSaveAndShareCSV).toHaveBeenCalledWith('id,customer\n1,Ana\n', 'agendamentos.csv');
  });

  it('opens the import modal when "Importar CSV" is chosen, and refetches on success', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const importButton = buttons?.find((b: any) => b.text === 'Importar CSV');
      importButton?.onPress?.();
    });

    const { getByText } = await render(<BookingsScreen navigation={{ navigate: jest.fn() }} />);
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(getByText('import-modal-stub')).toBeTruthy();
    });
    await fireEvent.press(getByText('import-modal-stub'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('hides the Importar/Exportar button for a non-owner (manager)', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    const { queryByText } = await render(<BookingsScreen navigation={{ navigate: jest.fn() }} />);

    expect(queryByText('Importar/Exportar')).toBeNull();
  });
});
