# Arquitetura do app: variantes admin + cliente

Este documento descreve o modelo de "1 repositório, 2 variantes" introduzido em
MOB-CLIENT-00 (issue #90). Ver também `MOB_BUSINESS_BRIEF.md` para o contexto
de produto.

## O que é uma variante

Há dois apps distintos gerados a partir deste mesmo repositório:

| Variante | `APP_VARIANT` | Nome | Bundle ID / Package | Público |
| --- | --- | --- | --- | --- |
| admin | `admin` (default) | TimelyOne | `com.timelyone.app` | staff/owner do tenant, já em produção |
| cliente | `client` | TimelyOne Client | `com.timelyone.client` | cliente final do tenant (B2C) |

A variante é resolvida a partir da env var `APP_VARIANT`, lida em `app.config.js`
(build-time, roda em Node) e exposta em runtime via
`Constants.expoConfig.extra.APP_VARIANT` (mesmo padrão já usado por
`src/utils/env.js`).

**Nunca omitir `APP_VARIANT` em builds/submits de produção da variante
cliente** — sem `EAS_PROJECT_ID_CLIENT` configurado, `app.config.js` lança
erro em contexto de build (`EAS_BUILD`/`CI`) para evitar publicar sob o
projeto EAS do admin por engano.

## Estrutura de pastas

```
src/
├── admin/
│   └── navigation/AdminNavigator.js   # re-export de src/navigation/AppNavigator.js
├── client/
│   ├── navigation/ClientNavigator.js  # navigator da variante cliente
│   └── screens/                       # telas exclusivas do cliente entram aqui
├── screens/            # telas admin existentes — NÃO foram movidas
├── navigation/
│   ├── AppNavigator.js           # navigator admin real (inalterado)
│   └── RootVariantNavigator.js   # escolhe Admin vs Client por APP_VARIANT
├── api/, components/, constants/, contexts/, hooks/, services/, theme/, utils/
    # partilhado entre as duas variantes, sem duplicação
```

`src/screens/` (as ~28 telas admin) continua exatamente onde estava — não
compensava o risco de mover 28 ficheiros e seus imports só para "formalizar"
a pasta `admin/`. `AdminNavigator.js` é um re-export transparente de
`AppNavigator.js`.

Telas novas da variante cliente (MOB-CLIENT-01 e seguintes) entram em
`src/client/screens/`, com navigator próprio em `src/client/navigation/`.

## Como adicionar um ecrã

- **Lado admin**: continua igual a antes — nova tela em `src/screens/`,
  registada em `src/navigation/AppNavigator.js` (ou nos sub-navigators
  existentes).
- **Lado cliente**: nova tela em `src/client/screens/`, registada em
  `src/client/navigation/ClientNavigator.js`.
- **Código partilhado** (API client, componentes de UI puros, tema, i18n):
  continua nas pastas de topo de `src/` (`api/`, `components/`, `theme/`,
  etc.), usado pelos dois lados.

## Autenticação

`AuthContext` (`src/contexts/AuthContext.js`) é exclusivo do lado staff — não
foi tocado nesta tarefa. A autenticação do cliente (`ClientAuthContext`) é
escopo da issue MOB-CTX-02 (#24), ainda não implementada; já existe base no
service layer (`src/services/auth.js`: `loginClient()`, `getClientProfile()`;
`src/utils/clientAuthStorage.js`) pronta para ser consumida por esse Context
quando for criado, em paralelo ao `AuthContext` sem colisão.

## Rodar cada variante localmente

```bash
# Limpar cache do Metro/Expo é essencial ao trocar de variante — ver "Armadilhas".
APP_VARIANT=admin npx expo start -c
APP_VARIANT=client npx expo start -c
```

## Build e submit (EAS)

Perfis em `eas.json`, por variante:

```bash
# Admin (produção atual — sem mudança de efeito)
eas build  --platform ios     --profile production-admin
eas build  --platform android --profile production-admin
eas submit --platform ios     --profile production-admin
eas submit --platform android --profile production-admin

# Cliente (novo — requer EAS_PROJECT_ID_CLIENT configurado antes)
eas build  --platform ios     --profile production-client
eas build  --platform android --profile production-client
eas submit --platform ios     --profile production-client
eas submit --platform android --profile production-client
```

Perfis `development`/`development-client` e `preview-admin`/`preview-client`
seguem o mesmo padrão para os outros ambientes.

## Débitos técnicos conhecidos (não bloqueiam MOB-CLIENT-00)

- **Projeto EAS da variante cliente**: ainda não criado. `easProjectId` em
  `app.config.js` fica com placeholder `TODO-criar-projeto-eas-client` até
  alguém rodar `eas project:init` (ou criar o projeto no dashboard Expo) para
  a variante cliente e configurar `EAS_PROJECT_ID_CLIENT`.
- **Assets (ícone/splash) da variante cliente**: reaproveitam os mesmos
  ficheiros do admin por agora. Trocar apenas os paths em `app.config.js`
  (`VARIANT.client.icon`/`splashImage`/etc.) quando houver design próprio —
  nenhuma outra mudança estrutural necessária.
- **`google-services.json` único**: hoje aponta para o pacote do admin. Push
  notifications da variante cliente não estarão corretamente isoladas do
  Firebase do admin até um projeto Firebase próprio existir para
  `com.timelyone.client`. Sem impacto agora porque a variante cliente ainda
  não usa notificações reais.

## Armadilhas do Expo com config dinâmica

- **Cache do Metro/Expo**: ao trocar `APP_VARIANT` entre execuções locais,
  sempre usar `expo start -c` — cache antigo pode servir a config da variante
  anterior.
- **`expo prebuild` é destrutivo**: `android/`/`ios/` são gerados localmente
  (não versionados, ver `.gitignore`) a partir da variante ativa no momento
  do prebuild. Trocar de variante localmente sempre com
  `expo prebuild --clean`, nunca prebuild incremental.
- **EAS Build resolve isto automaticamente**: cada job de build na nuvem faz
  prebuild fresh a partir do profile usado, então não há risco de resíduo de
  variante entre builds cloud — o cuidado com `--clean` é só para prebuild
  local.
