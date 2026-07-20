# Link de Registo + QR Code no MOB — Design

**Repo afetado:** `salonix-mobile` (branch `mob-registration-link-qr`)

## Contexto

O FEW (`salonix-frontend-web`) tem, na página de Clientes (`Customers.jsx`), a
capacidade de gerar um link de auto-cadastro (`/join/:tenantSlug`) e um QR
Code apontando para esse link, para o dono do salão partilhar com clientes
(imprimir, publicar no Instagram, etc.). Essa funcionalidade ficou de fora do
MOB (`CustomersScreen.tsx`) na paridade feita em `86-mob-parity-01` — o Pablo
já lançou o build atual sem ela e vai precisar de um novo lançamento para
corrigir, daí este branch separado.

## Regra

Mesmo link do FEW (`{webOrigin}/join/{tenantSlug}`), sem deep link nativo —
a rota `/join/:tenantSlug` é web (React), não existe equivalente nativo no
MOB. O link sempre abre a página web no browser do telemóvel.

## Onde

`src/screens/CustomersScreen.tsx`, na barra de ações, ao lado do botão
"Importar/Exportar" já existente (`handleImportExport`).

## Componentes

**Botão "Partilhar link"** — usa a API `Share` nativa do React Native
(`Share.share({ message: link })`), abrindo o menu de partilha do sistema
(WhatsApp, SMS, Instagram, etc.) já com o link preenchido. Ação principal,
sem passos extra.

**Botão "Gerar QR Code"** — abre um modal (mesmo padrão visual de
`CustomerFormModal`/`ImportCustomersModal`) com:
- QR Code do link, via `react-native-qrcode-svg` (equivalente do
  `qrcode.react` usado no FEW, mesma API: `value`, `size`).
- Texto do link por baixo.
- Botão "Copiar link" (usa `expo-clipboard`, já uma dependência do projeto)
  como alternativa dentro do modal.

## Construção do link

Nova função `getWebOrigin()` em `src/utils/env.js`, seguindo exatamente o
mesmo padrão já usado por `getResetUrl()` nesse ficheiro (fallback por
ambiente: dev → localhost:5173, staging → domínio de staging, produção →
domínio de produção do FEW). O `tenantSlug` vem do hook `useTenant()`, já
usado noutros ecrãs do MOB.

```js
export function getWebOrigin() {
  const apiBase = getApiBaseUrl();
  if (apiBase.includes("localhost") || apiBase.includes("0.0.0.0") || apiBase.includes("192.168")) {
    return "http://localhost:5173";
  }
  if (apiBase.includes("timelyonestaging.pythonanywhere.com")) {
    return "https://timelyone-staging.vercel.app";
  }
  return "https://timelyone.today"; // domínio de produção do FEW, confirmado pelo Pablo
}
```

## Testes

Jest, mesmo padrão do resto do MOB:
- `getWebOrigin()` devolve o domínio certo para cada ambiente (dev/staging/produção).
- Link final é `{webOrigin}/join/{tenantSlug}` com o slug correto.
- `Share.share` é chamado com o link correto ao tocar em "Partilhar link".
- Modal do QR abre/fecha corretamente.
- "Copiar link" dentro do modal chama `expo-clipboard` com o link correto.

## Fora de escopo

- Deep link nativo (abrir o registo dentro do próprio app) — mantém-se como
  página web, igual ao FEW.
- Alterar o comportamento do FEW — este trabalho é só paridade no MOB.
