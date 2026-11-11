import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import TabNavigator from '../TabNavigator';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      surface: '#fff',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../services/notifications', () => ({
  addNotificationListeners: jest.fn(),
  handleInitialNotificationNavigation: jest.fn(() => Promise.resolve()),
  setNotificationNavigationHandler: jest.fn(),
}));

jest.mock('../../screens/DashboardScreen', () => () => null);
jest.mock('../BookingsNavigator', () => () => null);
jest.mock('../../screens/CustomersScreen', () => () => null);
jest.mock('../../screens/TeamScreen', () => () => null);
jest.mock('../../screens/ReportsScreen', () => () => null);

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

let mockUserInfo = { role: 'owner', staff_role: 'owner' };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: mockUserInfo }),
}));

describe('TabNavigator', () => {
  beforeEach(() => {
    mockLanguage = 'pt';
    mockUserInfo = { role: 'owner', staff_role: 'owner' };
  });

  it('renders tab labels in Portuguese by default', async () => {
    const { getByText } = await render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );
    expect(getByText('Início')).toBeTruthy();
    expect(getByText('Agenda')).toBeTruthy();
    expect(getByText('Clientes')).toBeTruthy();
    expect(getByText('Equipe')).toBeTruthy();
    expect(getByText('Relatórios')).toBeTruthy();
  });

  it('renders tab labels in English when language is en', async () => {
    mockLanguage = 'en';
    const { getByText } = await render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Schedule')).toBeTruthy();
    expect(getByText('Customers')).toBeTruthy();
    expect(getByText('Team')).toBeTruthy();
    expect(getByText('Reports')).toBeTruthy();
  });

  it('hides Team tab for collaborators and Reports tab for non-owners', async () => {
    mockUserInfo = { role: 'professional', staff_role: 'collaborator' };
    const { queryByText } = await render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );
    expect(queryByText('Equipe')).toBeNull();
    expect(queryByText('Relatórios')).toBeNull();
  });
});
