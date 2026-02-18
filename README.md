# TimelyOne Mobile (Expo / React Native)

App mobile para TimelyOne - Sistema de agendamento para salões de beleza.

## Stack

- **Expo SDK 54** (managed workflow)
- **React Native 0.81**
- **React Navigation 7** (native-stack + bottom-tabs)
- **Context API** (auth + tenant + rate-limit)
- **Axios** (cliente HTTP com interceptors)
- **SecureStore** (armazenamento seguro de JWT)
- **Expo Notifications** (push notifications)

## Estrutura

```
src/
├── api/              # Cliente HTTP + endpoints
├── contexts/         # Context API (Auth, Tenant, RateLimit)
├── navigation/       # React Navigation stacks/tabs
├── screens/          # Telas do app
├── components/       # Componentes reutilizáveis
├── hooks/            # Custom hooks (useAuth, useTenant)
├── utils/            # Helpers (authStorage, apiError, tenant)
└── constants/        # Constantes (events, themes)
```

## Instalação

```bash
npm install
```

## Configuração

Edite `app.json` para configurar:
- `extra.API_BASE_URL`: URL da API backend

## Desenvolvimento

```bash
# Iniciar Expo
npm start

# iOS
npm run ios

# Android
npm run android
```

## Build (EAS)

```bash
npx eas build --platform ios
npx eas build --platform android
```

## Funcionalidades

### Implementado
- ✅ Autenticação JWT + refresh automático
- ✅ Multi-tenant (slug-based)
- ✅ SecureStore para tokens
- ✅ Rate-limit handling (429)
- ✅ Context API (Auth, Tenant, RateLimit)
- ✅ Push notifications (Expo Notifications) para staff/cliente
- ✅ Deep links para detalhes de agendamento

### Roadmap
- ⏳ Agenda admin (lista, confirmar/cancelar) completa
- ⏳ Cliente: agendar (serviço → profissional → slot)
- ⏳ White-label (branding por tenant)

## Regras

- **Sem backend changes**: usa mesmos endpoints do web
- **Sem bibliotecas nativas** fora do Expo sem aprovação
- **Tokens no SecureStore** (criptografado)
- **Sem vazamento de dados** entre tenants
