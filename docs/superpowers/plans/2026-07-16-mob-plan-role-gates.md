# MOB: Auditoria de Gates de Plano/Papel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close 5 role-gating gaps in the native app (`salonix-mobile`) so it matches the web PWA's owner/owner+manager restrictions on Reports, billing (Créditos e Plano), the dashboard credit card, service creation, and professional creation.

**Architecture:** Every fix reuses patterns already established in this codebase — `isOwner(userInfo)` from `src/utils/permissions.js` for owner-only gates, and the inline `userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager'` expression (already repeated in `BrandingScreen.tsx`, `NotificationsScreen.tsx`, etc.) for owner+manager gates. No new abstractions, no new files besides tests.

**Tech Stack:** React Native, TypeScript, Jest + `@testing-library/react-native`.

**IMPORTANT — no automatic commits:** Every "Commit" step below is written for reference only. Do **NOT** run `git add` / `git commit`. Leave all changes in the working tree, tested and green. Pablo commits and pushes everything himself — this branch (`86-mob-parity-01`, already checked out — do not create a new branch) already has substantial prior uncommitted work; he may make an intermediate commit of his own at some point, which is his call, not something to do automatically here.

---

### Task 1: `ReportsScreen.tsx` — owner-only guard

**Files:**
- Modify: `src/screens/ReportsScreen.tsx`
- Test: `src/screens/__tests__/ReportsScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

The existing test file doesn't mock `useAuth` at all (the screen doesn't use it yet). Replace the existing `jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));` block with:

```typescript
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));
```

This REPLACES the existing `jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));` block — the new version captures `goBack` in a named `mockGoBack` so tests can assert on it, instead of a throwaway inline `jest.fn()`.

Add to the `beforeEach` inside `describe('ReportsScreen', ...)` (find the existing `beforeEach` block and add this line, plus reset `mockGoBack`):

```typescript
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockGoBack.mockClear();
    // ... keep whatever mock setup already exists here (e.g. mockFetchBasicReports.mockResolvedValue(...))
  });
```

Add two new tests inside the `describe('ReportsScreen', ...)` block, after the existing tests:

```typescript
  it('redirects back immediately when the user is not an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    render(<ReportsScreen />);

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
  });

  it('does not redirect when the user is an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };

    render(<ReportsScreen />);

    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());
    expect(mockGoBack).not.toHaveBeenCalled();
  });
```

(`mockFetchBasicReports` is already defined in this file per the existing mock setup — verify the exact name by reading the top of the file before finalizing; use whatever the existing mock variable is called.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest ReportsScreen.test.tsx -t "not an owner"`
Expected: FAIL — `mockGoBack` is never called, because the screen has no owner guard yet.

- [ ] **Step 3: Add the guard to the component**

In `src/screens/ReportsScreen.tsx`, add the import (near the other hook imports at the top):

```typescript
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
```

Inside the `ReportsScreen` function component, right after the existing `const navigation = useNavigation();` line, add:

```typescript
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!isOwner(userInfo)) {
      navigation.goBack();
    }
  }, [userInfo, navigation]);

  if (!isOwner(userInfo)) {
    return null;
  }
```

Place this guard block BEFORE any other `useEffect` that fetches report data, so a non-owner never triggers the data-fetching effects (check the existing effects in the file — e.g. the one calling `fetchBasicReports` — and make sure this new guard's `useEffect` and early `return null` come first in the function body, ahead of those).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest ReportsScreen.test.tsx`
Expected: all pass, including the 2 new tests and all pre-existing ones (owner mock default means pre-existing tests aren't affected).

- [ ] **Step 5: Do NOT commit**

---

### Task 2: `CreditsPlanScreen.tsx` — owner-only guard

**Files:**
- Modify: `src/screens/CreditsPlanScreen.tsx`
- Test: `src/screens/__tests__/CreditsPlanScreen.test.tsx`

Same pattern as Task 1.

- [ ] **Step 1: Write the failing test**

The existing test file mocks `@react-navigation/native` as `useNavigation: () => ({ goBack: jest.fn() })` (throwaway) and does NOT mock `useAuth`. Replace the navigation mock and add the auth mock, near the top of `src/screens/__tests__/CreditsPlanScreen.test.tsx`:

```typescript
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));
```

In the `describe('CreditsPlanScreen', ...)` block's `beforeEach`, add:

```typescript
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockGoBack.mockClear();
```

Add two new tests:

```typescript
  it('redirects back immediately when the user is not an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    await render(<CreditsPlanScreen />);

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
  });

  it('does not redirect when the user is an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };

    await render(<CreditsPlanScreen />);

    await waitFor(() => expect(mockFetchBillingOverview).toHaveBeenCalled());
    expect(mockGoBack).not.toHaveBeenCalled();
  });
```

(`mockFetchBillingOverview` is already defined in this file — confirmed from the plan's earlier investigation of this same file.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest CreditsPlanScreen.test.tsx -t "not an owner"`
Expected: FAIL — no guard exists yet.

- [ ] **Step 3: Add the guard to the component**

In `src/screens/CreditsPlanScreen.tsx`, add the import:

```typescript
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
```

Inside the `CreditsPlanScreen` function component, right after `const navigation = useNavigation();`, add:

```typescript
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!isOwner(userInfo)) {
      navigation.goBack();
    }
  }, [userInfo, navigation]);

  if (!isOwner(userInfo)) {
    return null;
  }
```

Place this before the `useEffect` that calls `fetchBillingOverview`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest CreditsPlanScreen.test.tsx`
Expected: all pass (13 total: 11 pre-existing + 2 new).

- [ ] **Step 5: Do NOT commit**

---

### Task 3: `DashboardScreen.tsx` — hide "Créditos" card for non-owners

**Files:**
- Modify: `src/screens/DashboardScreen.tsx`
- Test: `src/screens/__tests__/DashboardScreen.test.tsx` (new — no pre-existing test file for this screen)

- [ ] **Step 1: Write the failing tests**

Create `src/screens/__tests__/DashboardScreen.test.tsx`:

```typescript
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
    },
    toggleTheme: jest.fn(),
    theme: 'light',
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: { name: 'Acme Salon' }, slug: 'acme' }),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt', setLanguage: jest.fn() }),
}));

const mockRefetch = jest.fn();
jest.mock('../../hooks/useDashboardData', () => ({
  __esModule: true,
  default: () => ({
    data: {
      stats: { bookings: 5, bookingsCompleted: 3, credits: '10,00', clients: 20 },
      upcoming: [],
    },
    loading: false,
    refetch: mockRefetch,
  }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' }, logout: jest.fn() };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('../../components/HeaderMenu', () => ({
  HeaderMenu: () => null,
}));

jest.mock('../../components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' }, logout: jest.fn() };
  });

  it('shows the Créditos card for an owner', async () => {
    const { getByText } = render(<DashboardScreen navigation={{}} />);

    await waitFor(() => expect(getByText('Créditos')).toBeTruthy());
  });

  it('hides the Créditos card for a manager', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' }, logout: jest.fn() };

    const { queryByText, getByText } = render(<DashboardScreen navigation={{}} />);

    await waitFor(() => expect(getByText('Agendamentos (hoje)')).toBeTruthy());
    expect(queryByText('Créditos')).toBeNull();
  });

  it('hides the Créditos card for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' }, logout: jest.fn() };

    const { queryByText, getByText } = render(<DashboardScreen navigation={{}} />);

    await waitFor(() => expect(getByText('Agendamentos (hoje)')).toBeTruthy());
    expect(queryByText('Créditos')).toBeNull();
  });
});
```

If `DashboardScreen.tsx` imports anything else not mocked here (check the top of the file — it may use additional components like `AppointmentCard`/`EmptyAppointmentsState` from `../components/DashboardComponents`, which don't need mocking since they only render when `data.upcoming` has items, and the mock above provides an empty array), adjust the mocks minimally to get a clean render — don't mock things that aren't actually needed.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest DashboardScreen.test.tsx`
Expected: the "hides the Créditos card" tests FAIL (card shows unconditionally today); the "shows... for an owner" test should already pass.

- [ ] **Step 3: Update the component**

In `src/screens/DashboardScreen.tsx`, add the import:

```typescript
import { isOwner } from '../utils/permissions';
```

Change:

```typescript
  const { logout } = useAuth();
```

to:

```typescript
  const { logout, userInfo } = useAuth();
```

Change:

```typescript
        <View className="mb-6">
          <StatCard
            label="Créditos"
            value={loading ? '-' : data.stats.credits}
            icon="wallet-outline"
            actionIcon="refresh"
            onActionPress={handleRefreshCredits}
            hint="Saldo disponível"
            isPrimary
          />
          <StatCard
            label="Agendamentos (hoje)"
```

to:

```typescript
        <View className="mb-6">
          {isOwner(userInfo) && (
            <StatCard
              label="Créditos"
              value={loading ? '-' : data.stats.credits}
              icon="wallet-outline"
              actionIcon="refresh"
              onActionPress={handleRefreshCredits}
              hint="Saldo disponível"
              isPrimary
            />
          )}
          <StatCard
            label="Agendamentos (hoje)"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest DashboardScreen.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Do NOT commit**

---

### Task 4: `ServicesScreen.tsx` — owner+manager guard on "Novo serviço"

**Files:**
- Modify: `src/screens/ServicesScreen.tsx`
- Test: `src/screens/__tests__/ServicesScreen.importExport.test.tsx` (extend — already has the `mockUseAuthReturn` pattern set up)

- [ ] **Step 1: Write the failing tests**

Add to `src/screens/__tests__/ServicesScreen.importExport.test.tsx`, inside the `describe('ServicesScreen - import/export', ...)` block, after the existing tests:

```typescript
  it('shows "Novo serviço" for an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };

    const { findByText } = render(<ServicesScreen />);

    expect(await findByText('Novo serviço')).toBeTruthy();
  });

  it('shows "Novo serviço" for a manager', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    const { findByText } = render(<ServicesScreen />);

    expect(await findByText('Novo serviço')).toBeTruthy();
  });

  it('hides "Novo serviço" for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' } };

    const { queryByText, findByText } = render(<ServicesScreen />);

    await findByText('Serviços');
    expect(queryByText('Novo serviço')).toBeNull();
  });
```

(`ServicesScreen` is already imported at the top of this file; `findByText('Serviços')` waits for the screen's title to confirm it finished loading before asserting absence — adjust to whatever stable text the loaded screen shows, based on the component's actual render output — check `ServicesScreen.tsx`'s title text if `'Serviços'` isn't exactly right.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest ServicesScreen.importExport.test.tsx -t "Novo serviço"`
Expected: the "hides... for a collaborator" test FAILS (button shows unconditionally today); the other two pass already.

- [ ] **Step 3: Update the component**

In `src/screens/ServicesScreen.tsx`, find where `const { userInfo } = useAuth();` is declared (already present, confirmed at line ~29) and add right after it:

```typescript
  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';
```

Change:

```typescript
            <TouchableOpacity
              onPress={handleCreate}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="add" size={18} color={colors.brandPrimary} />
              <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                Novo serviço
              </Text>
            </TouchableOpacity>
```

to:

```typescript
            {isAdmin && (
              <TouchableOpacity
                onPress={handleCreate}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="add" size={18} color={colors.brandPrimary} />
                <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                  Novo serviço
                </Text>
              </TouchableOpacity>
            )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest ServicesScreen.importExport.test.tsx ServicesScreen.test.tsx`
Expected: all pass — including `ServicesScreen.test.tsx` (the base file, which defaults its `useAuth` mock to `role: 'owner'` per the earlier investigation, so it's unaffected).

- [ ] **Step 5: Do NOT commit**

---

### Task 5: `TeamScreen.tsx` — owner+manager guard on "Novo profissional"

**Files:**
- Modify: `src/screens/TeamScreen.tsx`
- Test: `src/screens/__tests__/TeamScreen.importExport.test.tsx` (extend — already has the `mockUseAuthReturn` pattern set up)

Same pattern as Task 4.

- [ ] **Step 1: Write the failing tests**

Add to `src/screens/__tests__/TeamScreen.importExport.test.tsx`, inside its main `describe` block, after the existing tests:

```typescript
  it('shows "Novo profissional" for an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };

    const { findByText } = render(<TeamScreen />);

    expect(await findByText('Novo profissional')).toBeTruthy();
  });

  it('shows "Novo profissional" for a manager', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    const { findByText } = render(<TeamScreen />);

    expect(await findByText('Novo profissional')).toBeTruthy();
  });

  it('hides "Novo profissional" for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' } };

    const { queryByText, findByText } = render(<TeamScreen />);

    await findByText('Equipe');
    expect(queryByText('Novo profissional')).toBeNull();
  });
```

(Confirmed: `TeamScreen.tsx:393` renders the title `"Equipe"`, not `"Equipa"`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest TeamScreen.importExport.test.tsx -t "Novo profissional"`
Expected: the "hides... for a collaborator" test FAILS; the other two pass already.

- [ ] **Step 3: Update the component**

In `src/screens/TeamScreen.tsx`, find where `const { userInfo } = useAuth();` is declared (already present, confirmed at line ~22) and add right after it:

```typescript
    const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';
```

(Match the file's existing indentation style — this file uses 4-space-ish indentation in the JSX section per the earlier read, verify and match exactly.)

Change:

```typescript
                        <TouchableOpacity
                            onPress={handleCreate}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Ionicons name="add" size={18} color={colors.brandPrimary} />
                            <Text style={{
                                color: colors.brandPrimary,
                                fontSize: 13,
                                fontWeight: '600',
                                marginLeft: 6
                            }}>
                                Novo profissional
                            </Text>
                        </TouchableOpacity>
```

to:

```typescript
                        {isAdmin && (
                            <TouchableOpacity
                                onPress={handleCreate}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <Ionicons name="add" size={18} color={colors.brandPrimary} />
                                <Text style={{
                                    color: colors.brandPrimary,
                                    fontSize: 13,
                                    fontWeight: '600',
                                    marginLeft: 6
                                }}>
                                    Novo profissional
                                </Text>
                            </TouchableOpacity>
                        )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest TeamScreen.importExport.test.tsx TeamScreen.test.tsx`
Expected: all pass. (If `TeamScreen.test.tsx` doesn't exist as a separate base file, just run `TeamScreen.importExport.test.tsx`.)

- [ ] **Step 5: Do NOT commit**

---

### Task 6: Full regression sweep

**Files:** None (verification only)

- [ ] **Step 1: Run all 5 affected test files together**

Run: `npx jest ReportsScreen CreditsPlanScreen DashboardScreen ServicesScreen TeamScreen`
Expected: all pass, 0 failures.

- [ ] **Step 2: Run the full mobile test suite**

Run: `npx jest 2>&1 | tail -30`
Expected: no new failures beyond whatever pre-existing baseline already exists on this branch (this branch has substantial prior uncommitted MOB-PARITY-01 work — compare against a baseline run if one is available; if not, just confirm nothing in this plan's 5 touched files fails and no unrelated suite newly breaks).

- [ ] **Step 3: Run TypeScript check if the project has one**

Run: `npx tsc --noEmit 2>&1 | tail -30`
Expected: no new type errors introduced by this plan's changes (pre-existing errors elsewhere in the codebase, if any, are not this plan's concern).

- [ ] **Step 4: Do NOT commit**

Leave everything staged/modified in the working tree. Report the final test counts to Pablo and stop — he commits and pushes everything himself.

---

## Self-Review Notes (for the plan author, not a task)

- **Spec coverage:** All 5 gaps from the spec (Reports, CreditsPlan, Dashboard credits card, Services "Novo serviço", Team "Novo profissional") → Tasks 1-5, each with the exact "goBack on mount" or "hide button" behavior confirmed with Pablo. Item 6 (manager editing owner) and the `professionals/{id}/` endpoint are explicitly out of scope per the spec, already logged in `to_see.md` — no task needed.
- **Placeholder scan:** No TBDs. Two steps (Task 4 Step 1, Task 5 Step 1) ask the implementer to verify an exact loading-confirmation text string against the real component before finalizing — this is a verification instruction with a concrete fallback (check the file), not an unresolved placeholder.
- **Type/name consistency:** `isOwner(userInfo)` used identically (same import path `../utils/permissions`) in Tasks 1, 2, 3. The `isAdmin` inline expression is used identically (same three-clause boolean) in Tasks 4 and 5, matching the exact wording already present in `BrandingScreen.tsx`/`NotificationsScreen.tsx`/etc.
