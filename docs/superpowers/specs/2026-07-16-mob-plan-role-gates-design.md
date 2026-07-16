# MOB: Auditoria de Gates de Plano/Papel — Design

**Repo:** `salonix-mobile`
**Branch:** `86-mob-parity-01` (reaproveitado, sem branch nova)

## Contexto

Auditoria comparando o PWA (`salonix-frontend-web`) com o app nativo, focada em gates de acesso por papel de staff (owner/manager/collaborator). O gate por **plan_tier** está confirmado como desativado por design no próprio PWA desde a FEW-PLANS-01 (todos os tiers no mesmo nível de prioridade) — não há nada para replicar nesse eixo. Os gates reais que valem hoje são por **papel de staff**, e é aí que a investigação encontrou 5 lacunas no MOB.

Investigação (via subagente Explore) confirmou:
- `Reports`/`CreditsPlan` são registados como `Stack.Screen` normais em `AppNavigator.js` — alcançáveis via `navigation.navigate(...)` de qualquer sítio, sem guarda de rota (React Navigation não tem equivalente declarativo ao `RoleProtectedRoute` do React Router usado no PWA).
- O padrão de gate já estabelecido no MOB é sempre uma checagem dentro do próprio componente: `isOwner(userInfo)` (de `src/utils/permissions.js`) para owner-only, ou a expressão inline `userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager'` (sem helper nomeado — repetida em `BrandingScreen.tsx:38`, `NotificationsScreen.tsx:26`, `BusinessHoursScreen.tsx:65`, `SlotsScreen.tsx:20`, `GeneralScreen.tsx:18`) para owner+manager.
- Um 6º item investigado (manager conseguindo editar/remover um `owner` via `TeamScreen`) **não é um gap real** — o backend já bloqueia incondicionalmente (`ValidationError` em `TenantStaffView`, PATCH e DELETE) independentemente do papel de quem pede. Registado em `to_see.md` como melhoria de UX opcional, fora desta tarefa.

## Gaps a corrigir

### 1. `ReportsScreen.tsx` — owner-only

No PWA, `/reports` é restrito a `owner` (rota + checagem redundante dentro da página). No MOB, o ecrã é alcançável por qualquer staff autenticado sem nenhuma checagem interna — só está escondido do menu em `SettingsScreen.tsx:70` (que já filtra por `isOwner`), o que não impede navegação direta/deep link.

**Fix:** adicionar uma guarda no topo do componente: `useEffect` que verifica `isOwner(userInfo)` e, se falso, chama `navigation.goBack()` imediatamente. Enquanto a guarda resolve, o componente não renderiza o conteúdo sensível (retorna `null` ou um loading mínimo) — evita flash de dados de relatórios antes do redirect.

### 2. `CreditsPlanScreen.tsx` — owner-only

Mesma lacuna e mesmo fix que o item 1 — no PWA, a página de billing/plano (dentro de `/settings`) é `allowedRoles=['owner']`; no MOB, qualquer staff alcança o ecrã, incluindo as ações de billing (`createBillingPortalSession`, `createCheckoutSession`).

### 3. `DashboardScreen.tsx` — card "Créditos"

No PWA, o card de saldo de créditos só aparece para `isOwner` (`Dashboard.jsx:665`). No MOB, o `<StatCard label="Créditos" .../>` (linhas 89-97) aparece incondicionalmente para todos os papéis.

**Fix:** `DashboardScreen.tsx` hoje só desestrutura `logout` de `useAuth()` — adicionar `userInfo` à desestruturação, e envolver o `StatCard` de créditos com `{isOwner(userInfo) && (...)}`.

### 4. `ServicesScreen.tsx` — botão "Novo serviço"

No PWA, `/services` é `allowedRoles=['owner','manager']`. No MOB, o botão "Novo serviço" (linhas 194-202) não tem checagem nenhuma — qualquer staff/colaborador cria serviços. O ficheiro já importa `isOwner` (usado no botão de Import/Export, linha 204) mas não tem a variável `isAdmin` (owner+manager) necessária aqui.

**Fix:** adicionar `const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';`, envolver o `TouchableOpacity` do "Novo serviço" com `{isAdmin && (...)}`.

### 5. `TeamScreen.tsx` — botão "Novo profissional"

Mesma lacuna e mesmo fix que o item 4 — no PWA, `canManageAll` (owner+manager) controla quem convida/cria profissionais; no MOB, o botão "Novo profissional" (linhas 419-432) não tem checagem, só o Import/Export (linha 434) já está corretamente protegido por `isOwner`.

## Comportamento de "acesso negado" (itens 1 e 2)

Confirmado com o Pablo: ao montar o ecrã, se `!isOwner(userInfo)`, o componente chama `navigation.goBack()` automaticamente (sem tela de "acesso restrito" intermediária) — consistente com o padrão de guarda no início do componente já usado no resto do código.

## Testes

Cada um dos 5 ficheiros ganha/atualiza testes cobrindo o papel positivo (owner ou owner+manager consegue ver/agir) e negativo (papel sem permissão não vê o botão / é redirecionado):

- `ReportsScreen.test.tsx` (ou novo, se não existir): owner monta o ecrã normalmente; manager/collaborator montam e `navigation.goBack()` é chamado, conteúdo não renderiza.
- `CreditsPlanScreen.test.tsx` (já existe, extend): mesmo padrão de teste positivo/negativo.
- `DashboardScreen.test.tsx` (extend, se existir): card "Créditos" visível para owner, ausente para manager/collaborator.
- `ServicesScreen.test.tsx` (extend, se existir): botão "Novo serviço" visível para owner/manager, ausente para collaborator.
- `TeamScreen.test.tsx` (extend, se existir): botão "Novo profissional" visível para owner/manager, ausente para collaborator.

## Fora de escopo

- Item 6 (manager vs. controlos de edição de owner) — já protegido pelo backend, registado em `to_see.md` como melhoria de UX opcional.
- Endpoint `professionals/{id}/` não auditado (achado incidental, registado em `to_see.md`).
- Qualquer gate por `plan_tier`/`feature_flags` — confirmado como não aplicável (dormant no próprio PWA).
- Réplica da UI de link/QR de auto-registo de cliente (`enableCustomerPwa`) — não construída em nenhum dos dois lados ainda, fora desta auditoria.
