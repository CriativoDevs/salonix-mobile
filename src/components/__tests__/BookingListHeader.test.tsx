import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BookingListHeader } from '../BookingListHeader';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: { textPrimary: '#000', textSecondary: '#666', brandPrimary: '#3b82f6' },
  }),
}));

describe('BookingListHeader', () => {
  it('calls onImportExport when the action is pressed and showImportExport is true', async () => {
    const onImportExport = jest.fn();
    const { getByText } = await render(
      <BookingListHeader totalCount={0} onImportExport={onImportExport} showImportExport />
    );
    await fireEvent.press(getByText('Importar/Exportar'));
    expect(onImportExport).toHaveBeenCalled();
  });

  it('does not render the Importar/Exportar button when showImportExport is false', async () => {
    const { queryByText } = await render(
      <BookingListHeader totalCount={0} onImportExport={jest.fn()} showImportExport={false} />
    );
    expect(queryByText('Importar/Exportar')).toBeNull();
  });
});
