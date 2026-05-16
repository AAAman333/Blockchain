# Frontend

Next.js фронтенд для управления RWA платформой.

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:3000

## Переменные окружения

Создайте `frontend/.env.local` с адресами:

```env
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_GOVERNOR_ADDRESS=0x...
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_AMM_ADDRESS=0x...
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/<your-subgraph>
```

## Функционал

- Подключение кошелька с RainbowKit
- Чтение баланса GovernanceToken
- Кнопки `Swap` и `Deposit to Vault` на странице `Assets`
- Кнопки голосования на странице `Dashboard`
