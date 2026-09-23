// Necessario para React 19 + react-test-renderer nao acusar falsos "act()" warnings.
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock oficial do AsyncStorage (usado por LanguageContext e outros contexts
// que persistem estado localmente). Sem isso, qualquer tela/componente que
// importe LanguageContext.js (direta ou transitivamente) falha ao carregar
// em testes com "[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.".
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
