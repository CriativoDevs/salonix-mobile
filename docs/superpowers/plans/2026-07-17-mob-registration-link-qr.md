# Link de Registo + QR Code no MOB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao MOB (`CustomersScreen.tsx`) a capacidade de partilhar o link de auto-cadastro do tenant (`/join/:tenantSlug`) e gerar um QR Code apontando para ele — paridade com o que já existe em FEW (`Customers.jsx`).

**Architecture:** Duas novas funções em `src/utils/env.js` (`getWebOrigin`, `getRegistrationLink`) resolvem o link por ambiente, seguindo o padrão já existente de `getResetUrl()`. Um novo componente `ShareRegistrationLinkModal.tsx` (mesmo padrão visual de `ImportCustomersModal.tsx`) mostra o QR Code + link + botão copiar. `CustomersScreen.tsx` ganha dois botões novos na barra de ações, ao lado do "Importar/Exportar" já existente: "Partilhar link" (usa `Share.share()` nativo) e "Gerar QR Code" (abre o modal). Nenhum dos dois é restrito a owner — o FEW não restringe estes botões por papel, então o MOB segue a mesma paridade.

**Tech Stack:** React Native, Expo, `react-native-qrcode-svg` (novo), `expo-clipboard` (novo), Jest + `@testing-library/react-native`.

---

### Task 1: `getWebOrigin` e `getRegistrationLink` em `src/utils/env.js`

**Files:**
- Modify: `src/utils/env.js`
- Test: `src/utils/__tests__/env.test.js`

- [ ] **Step 1: Adicionar os testes ao ficheiro existente**

`src/utils/__tests__/env.test.js` já existe e testa `resolveMediaUrl`. Adicionar no final do ficheiro (mantendo o `require` no topo, mas trocando para importar também as novas funções):

Substituir a linha 1 (`const { resolveMediaUrl } = require('../env');`) por:

```js
const { resolveMediaUrl, getWebOrigin, getRegistrationLink } = require('../env');
```

E adicionar, depois do `describe('resolveMediaUrl', ...)` já existente:

```js
describe('getWebOrigin', () => {
  const originalEnv = process.env.WEB_ORIGIN;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.WEB_ORIGIN;
    } else {
      process.env.WEB_ORIGIN = originalEnv;
    }
  });

  it('returns the WEB_ORIGIN env var when set, without a trailing slash', () => {
    process.env.WEB_ORIGIN = 'https://custom.example.com/';
    expect(getWebOrigin('https://irrelevant/api/')).toBe('https://custom.example.com');
  });

  it('returns localhost:5173 for a local dev API base', () => {
    delete process.env.WEB_ORIGIN;
    expect(getWebOrigin('http://0.0.0.0:8000/api/')).toBe('http://localhost:5173');
    expect(getWebOrigin('http://192.168.0.203:8000/api/')).toBe('http://localhost:5173');
  });

  it('returns the staging web origin for the staging API base', () => {
    delete process.env.WEB_ORIGIN;
    expect(getWebOrigin('https://timelyonestaging.pythonanywhere.com/api/')).toBe(
      'https://timelyone-staging.vercel.app'
    );
  });

  it('returns the production web origin for the production API base', () => {
    delete process.env.WEB_ORIGIN;
    expect(getWebOrigin('https://salonix-backend-production.up.railway.app/api/')).toBe(
      'https://timelyone.today'
    );
  });
});

describe('getRegistrationLink', () => {
  afterEach(() => {
    delete process.env.WEB_ORIGIN;
  });

  it('builds the join link from the web origin and tenant slug', () => {
    expect(
      getRegistrationLink('acme', 'https://salonix-backend-production.up.railway.app/api/')
    ).toBe('https://timelyone.today/join/acme');
  });

  it('respects the WEB_ORIGIN env var override', () => {
    process.env.WEB_ORIGIN = 'https://custom.example.com';
    expect(getRegistrationLink('acme', 'https://irrelevant/api/')).toBe(
      'https://custom.example.com/join/acme'
    );
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx jest src/utils/__tests__/env.test.js --watchAll=false`
Expected: FAIL com `getWebOrigin is not a function` / `getRegistrationLink is not a function`.

- [ ] **Step 3: Implementar `getWebOrigin` e `getRegistrationLink`**

Em `src/utils/env.js`, adicionar depois de `getResetUrl` (antes de `export const API_BASE_URL = getApiBaseUrl();`):

```js
export function getWebOrigin(apiBase = getApiBaseUrl()) {
  const envWebOrigin = getEnvVar("WEB_ORIGIN");
  if (envWebOrigin) {
    return envWebOrigin.endsWith("/") ? envWebOrigin.slice(0, -1) : envWebOrigin;
  }

  if (
    apiBase.includes("localhost") ||
    apiBase.includes("0.0.0.0") ||
    apiBase.includes("192.168")
  ) {
    return "http://localhost:5173";
  }

  if (apiBase.includes("timelyonestaging.pythonanywhere.com")) {
    return "https://timelyone-staging.vercel.app";
  }

  return "https://timelyone.today";
}

export function getRegistrationLink(slug, apiBase = getApiBaseUrl()) {
  return `${getWebOrigin(apiBase)}/join/${slug}`;
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

Run: `npx jest src/utils/__tests__/env.test.js --watchAll=false`
Expected: PASS (9 testes: 5 já existentes de `resolveMediaUrl` + 4 novos de `getWebOrigin` + 2 de `getRegistrationLink` = 11 no total).

- [ ] **Step 5: Não commitar**

O Pablo faz commit/push manualmente. Não correr `git add`/`git commit`.

---

### Task 2: Instalar dependências de QR Code e clipboard

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Instalar as dependências via `expo install`**

Run (a partir da raiz de `salonix-mobile`):

```bash
npx expo install react-native-qrcode-svg react-native-svg expo-clipboard
```

Expected: `package.json` ganha as 3 novas entradas em `dependencies`, versões compatíveis com o SDK do Expo instalado no projeto (o `expo install`, ao contrário de `npm install`, resolve a versão correta automaticamente).

- [ ] **Step 2: Confirmar que a instalação não quebrou nada**

Run: `npx jest --watchAll=false`
Expected: PASS (mesma contagem de testes de antes da instalação — nenhum teste depende ainda destas libs).

- [ ] **Step 3: Não commitar**

---

### Task 3: Componente `ShareRegistrationLinkModal.tsx`

**Files:**
- Create: `src/components/ShareRegistrationLinkModal.tsx`
- Test: `src/components/__tests__/ShareRegistrationLinkModal.test.tsx`

- [ ] **Step 1: Escrever o teste (falhando)**

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ShareRegistrationLinkModal } from '../ShareRegistrationLinkModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      error: '#ef4444',
    },
  }),
}));

jest.mock('react-native-qrcode-svg', () => {
  const { View } = require('react-native');
  return ({ value }: { value: string }) => <View testID="qr-code" accessibilityLabel={value} />;
});

const mockSetStringAsync = jest.fn();
jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: any[]) => mockSetStringAsync(...args),
}));

jest.mock('../../utils/env', () => ({
  getRegistrationLink: (slug: string) => `https://timelyone.today/join/${slug}`,
}));

describe('ShareRegistrationLinkModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the QR code and link for the given slug', () => {
    const { getByTestId, getByText } = render(
      <ShareRegistrationLinkModal visible onClose={jest.fn()} slug="acme" />
    );

    expect(getByTestId('qr-code').props.accessibilityLabel).toBe(
      'https://timelyone.today/join/acme'
    );
    expect(getByText('https://timelyone.today/join/acme')).toBeTruthy();
  });

  it('copies the link to the clipboard when "Copiar link" is pressed', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(
      <ShareRegistrationLinkModal visible onClose={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Copiar link'));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith('https://timelyone.today/join/acme');
    });
  });

  it('calls onClose when "Fechar" is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <ShareRegistrationLinkModal visible onClose={onClose} slug="acme" />
    );

    fireEvent.press(getByText('Fechar'));

    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx jest src/components/__tests__/ShareRegistrationLinkModal.test.tsx --watchAll=false`
Expected: FAIL — `Cannot find module '../ShareRegistrationLinkModal'`.

- [ ] **Step 3: Implementar o componente**

```tsx
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
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npx jest src/components/__tests__/ShareRegistrationLinkModal.test.tsx --watchAll=false`
Expected: PASS (3 testes).

- [ ] **Step 5: Não commitar**

---

### Task 4: Botões "Partilhar link" e "Gerar QR Code" em `CustomersScreen.tsx`

**Files:**
- Modify: `src/screens/CustomersScreen.tsx`
- Test: `src/screens/__tests__/CustomersScreen.shareLink.test.tsx`

- [ ] **Step 1: Escrever o teste (falhando)**

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import CustomersScreen from '../CustomersScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const mockFetchCustomers = jest.fn();
jest.mock('../../api/customers', () => ({
  fetchCustomers: (...args: any[]) => mockFetchCustomers(...args),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  resendCustomerInvite: jest.fn(),
  exportCustomersCSV: jest.fn(),
}));

jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: jest.fn(),
}));

jest.mock('../../components/ImportCustomersModal', () => ({
  __esModule: true,
  ImportCustomersModal: () => null,
}));

jest.mock('../../components/ShareRegistrationLinkModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    ShareRegistrationLinkModal: ({ visible, onClose }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={onClose}>
          <Text>qr-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

jest.mock('../../utils/env', () => ({
  getRegistrationLink: (slug: string) => `https://timelyone.today/join/${slug}`,
}));

describe('CustomersScreen - share registration link', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchCustomers.mockResolvedValue({ results: [], count: 0 });
  });
  afterEach(() => jest.clearAllMocks());

  it('shares the registration link when "Partilhar link" is pressed', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction } as any);

    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());
    await fireEvent.press(getByText('Partilhar link'));

    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith({
        message: 'https://timelyone.today/join/acme',
      });
    });
  });

  it('opens the QR code modal when "Gerar QR Code" is pressed', async () => {
    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());
    await fireEvent.press(getByText('Gerar QR Code'));

    await waitFor(() => {
      expect(getByText('qr-modal-stub')).toBeTruthy();
    });
  });

  it('shows "Partilhar link" and "Gerar QR Code" to non-owners too (sem gate de papel, igual ao FEW)', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' } };

    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());

    expect(getByText('Partilhar link')).toBeTruthy();
    expect(getByText('Gerar QR Code')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx jest src/screens/__tests__/CustomersScreen.shareLink.test.tsx --watchAll=false`
Expected: FAIL — `Unable to find an element with text: Partilhar link`.

- [ ] **Step 3: Adicionar os imports necessários**

Em `src/screens/CustomersScreen.tsx`, na linha do import de `react-native` (linha 2), adicionar `Share` à lista já existente:

```tsx
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ActionSheetIOS, Platform, Keyboard, Share } from 'react-native';
```

Depois do import de `ImportCustomersModal` (linha 9), adicionar:

```tsx
import { ShareRegistrationLinkModal } from '../components/ShareRegistrationLinkModal';
import { getRegistrationLink } from '../utils/env';
```

- [ ] **Step 4: Adicionar o estado do modal**

Junto aos outros `useState` já existentes (perto da linha 39, ao lado de `importModalVisible`):

```tsx
const [qrModalVisible, setQrModalVisible] = useState(false);
```

- [ ] **Step 5: Adicionar o handler de partilha**

Perto de `handleImportExport` (depois dele):

```tsx
const handleShareLink = async () => {
    try {
      await Share.share({ message: getRegistrationLink(slug) });
    } catch (error) {
      console.error('Error sharing registration link:', error);
    }
};
```

- [ ] **Step 6: Adicionar os dois botões na barra de ações**

Na `View` da barra de ações (depois do botão "Importar/Exportar", ainda dentro do bloco `isOwner(userInfo) && (...)` que o envolve — mas os dois botões novos ficam FORA desse bloco, sem gate de papel, para bater com o FEW):

```tsx
    {isOwner(userInfo) && (
      <TouchableOpacity onPress={handleImportExport} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
              Importar/Exportar
          </Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity onPress={handleShareLink} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
            Partilhar link
        </Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setQrModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="qr-code-outline" size={18} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
            Gerar QR Code
        </Text>
    </TouchableOpacity>
```

- [ ] **Step 7: Montar o modal**

Depois de `<ImportCustomersModal .../>` (perto da linha 400):

```tsx
<ShareRegistrationLinkModal
    visible={qrModalVisible}
    onClose={() => setQrModalVisible(false)}
    slug={slug}
/>
```

- [ ] **Step 8: Rodar o teste para confirmar que passa**

Run: `npx jest src/screens/__tests__/CustomersScreen.shareLink.test.tsx --watchAll=false`
Expected: PASS (3 testes).

- [ ] **Step 9: Rodar o teste de import/export já existente para confirmar que não quebrou**

Run: `npx jest src/screens/__tests__/CustomersScreen.importExport.test.tsx --watchAll=false`
Expected: PASS (3 testes, sem alteração).

- [ ] **Step 10: Não commitar**

---

### Task 5: Varredura completa

**Files:** nenhum (apenas verificação)

- [ ] **Step 1: Rodar toda a suíte de testes**

Run: `npx jest --watchAll=false`
Expected: PASS em todos os testes (nenhuma regressão face ao estado antes deste plano).

- [ ] **Step 2: Rodar o TypeScript type-check**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo nos ficheiros deste plano (`ShareRegistrationLinkModal.tsx`, `CustomersScreen.tsx`; `env.js` é JS puro, sem tipos a verificar). **Nota:** o repo já tem erros de `tsc` pré-existentes e não relacionados, em ficheiros de teste antigos (`professionalColor.test.ts`, `zipFileSharing.test.ts` — faltam tipos globais do Jest). Não é preciso corrigir isso aqui; apenas confirmar que nenhum erro novo aparece nos ficheiros tocados por este plano.

- [ ] **Step 3: Não commitar**

Reportar ao Pablo a contagem final de testes e confirmar que está tudo verde. Ele faz o commit/push manualmente.
