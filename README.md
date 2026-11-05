# Controle de Estoque — Expo (React Native) + Node/Express + Prisma

```
estoque/
  mobile/   → app Android/iOS (Expo Go agora, APK depois)
  server/   → API + banco de dados
  client/   → versão web (React + Vite), opcional
```

## Rodando no Expo Go

> PC e celular **no mesmo Wi-Fi**. Instale o **Expo Go** atualizado da Play Store (o app usa o SDK 58).

**0. Só na primeira vez** — prepara o banco e instala as dependências:
```bash
cd server
cp .env.example .env        # Windows: copy .env.example .env
# edite o .env e troque o JWT_SECRET
npm install
npx prisma migrate dev --name init   # cria o banco e as tabelas
npm run db:seed                      # cria usuários e produtos de teste
cd ../mobile && npm install
```

**1. Pra rodar (sempre) — um comando só, um terminal só:**
```bash
cd estoque        # a pasta que tem este README
npm run dev
```
Isso sobe o backend, espera ele responder em `/api/health` e só então abre o Expo — sem precisar
abrir dois terminais nem lembrar qual comando vai em qual pasta (é fácil, sem querer, rodar
`npx expo start` dentro da pasta `server/` e ficar sem API no ar sem perceber). Pra parar os dois
de uma vez, **Ctrl+C** nesse mesmo terminal.

Escaneie o QR code com o Expo Go. O app descobre sozinho o IP do PC e procura a API na porta 3001
(o endereço aparece no rodapé da tela de login, e também no log do backend: algo como
`na rede: http://192.168.0.15:3001/api`).

> Prefere os dois terminais separados (ex.: pra ver o log de cada um na sua própria janela)? Dá pra
> rodar manualmente: `cd server && npm run dev` num terminal, `cd mobile && npx expo start` no outro.
> Só **nunca** rode `npx expo start` dentro da pasta `server/` — é o erro mais comum e deixa a API
> fora do ar sem nenhum aviso claro.

### Se não conectar
- **Firewall do Windows**: libere a porta 3001 (e 8081 do Metro). Rápido, num PowerShell como admin:
  `New-NetFirewallRule -DisplayName "Estoque API" -Direction Inbound -Protocol TCP -LocalPort 3001,8081 -Action Allow`
- Teste no navegador do celular: `http://IP-DO-PC:3001/api/health` tem que responder `{"ok":true}`
- Wi-Fi corporativo/visitante às vezes isola os aparelhos. Use o hotspot do celular ou `npx expo start --tunnel`
  (com tunnel, a API ainda precisa ser acessível; nesse caso defina `EXPO_PUBLIC_API_URL` no `mobile/.env`)
- Erro "Failed to download remote update": Expo Go desatualizado ou não alcança o PC. Atualize o app e confira o Wi-Fi.

## Logins de teste
| Perfil | E-mail | Senha |
|---|---|---|
| Admin | admin@estoque.com | admin123 |
| Padrão | user@estoque.com | user123 |

## Permissões (validadas no backend)
| Ação | Admin | Padrão |
|---|---|---|
| Ver produtos | ✅ | ✅ (sem preço — a API nem envia) |
| Entrada/saída de estoque | ✅ | ✅ |
| Criar/editar/excluir produto | ✅ | ❌ 403 |
| Ver movimentações | todas | só as próprias |
| Aba/gestão de usuários | ✅ | ❌ (aba nem aparece; API dá 403) |

## Gerando o APK (depois)
1. A API precisa estar num servidor acessível (VPS, Render, Railway, servidor da empresa...), de preferência com **HTTPS**
2. Crie `mobile/.env` com `EXPO_PUBLIC_API_URL=https://seu-servidor/api`
3. Ajuste `android.package` no `mobile/app.json` (hoje `com.estoque.app`)
4. Build na nuvem da Expo (conta gratuita):
   ```bash
   cd mobile
   npx eas-cli@latest login
   npx eas-cli@latest build -p android --profile preview
   ```
   No fim ele dá um link pra baixar o `.apk`.

> Se a API ficar em `http://` (sem S), o Android bloqueia por padrão no APK (no Expo Go funciona).
> Use HTTPS, ou instale `expo-build-properties` e ative `android.usesCleartextTraffic`.

## Trocar de banco
Padrão é **SQLite** (arquivo `dev.db`). Para PostgreSQL/MySQL/SQL Server:
1. `server/prisma/schema.prisma` → troque `provider = "sqlite"`
2. `server/.env` → troque `DATABASE_URL` (exemplos no `.env.example`)
3. Apague `server/prisma/migrations` (se existir) e rode `npx prisma migrate dev --name init`

## Estrutura do app
```
mobile/src/
  app/_layout.js            # Stack.Protected: deslogado → login, logado → (app)
  app/login.js
  app/(app)/_layout.js      # abas; aba Usuários com Tabs.Protected guard={isAdmin}
  app/(app)/index.js        # Produtos
  app/(app)/movimentacoes.js
  app/(app)/usuarios.js
  context/AuthContext.js    # login/logout, user, isAdmin, modo "visão de usuário padrão"
  context/ThemeContext.js   # paleta clara/escura, segue o tema do sistema
  services/api.js           # chamadas HTTP + token no SecureStore
  components/ui.js          # botões, campos, modal
```

## Pra produção ainda falta
- HTTPS e `JWT_SECRET` forte
- Rate limit no login (`express-rate-limit`)
- Backup do banco e logs
# react
