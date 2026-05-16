# Blockchain Project

Проект включает:
- Foundry смарт-контракты на Solidity
- Next.js фронтенд на RainbowKit + wagmi
- The Graph сабграф для индексации событий
- CI с Forge, Slither и проверкой submodules

## Текущая реализация

- `RWAFactory` индексирует созданные активы
- `RWAVault` индексирует депозиты в vault
- `ProtocolGovernor` индексирует создание и исполнение предложений
- Фронтенд подключает кошелек и показывает баланс GovernanceToken
- На странице `Assets` есть кнопки `Swap` и `Deposit to Vault`
- На странице `Dashboard` есть кнопки `Vote For`, `Vote Against`, `Abstain`

## Контракты и сети

| Контракт | Адрес | Сеть | Explorer |
| --- | --- | --- | --- |
| RWAFactory | `0xDB8Cff278aDccF9e9B5DA745b44E754FC4ee3c76` | Base Sepolia / Arbitrum Sepolia | `https://sepolia.basescan.org/address/0xDB8Cff278aDccF9e9B5DA745b44E754FC4ee3c76` |
| GovernanceToken | `0x5B73C5498C1e3b4DBA84DE0F1833C4A029d90519` | Base Sepolia / Arbitrum Sepolia | `https://sepolia.basescan.org/address/0x5B73C5498C1e3b4DBA84DE0F1833C4A029d90519` |
| ProtocolGovernor | `TBD` | Base Sepolia / Arbitrum Sepolia | `TBD` |
| RWAVault | `TBD` | Base Sepolia / Arbitrum Sepolia | `TBD` |
| AMM | `TBD` | Base Sepolia / Arbitrum Sepolia | `TBD` |

> Замените `TBD` после деплоя и верификации контрактов в соответствующем исследователе.

## Быстрый старт

### 1. Установите зависимости

```bash
# В корне проекта
forge install

# В фронтенде
cd frontend
npm install
```

### 2. Настройки окружения

Создайте `frontend/.env.local` и заполните адреса контрактов:

```env
NEXT_PUBLIC_FACTORY_ADDRESS=0xDB8Cff278aDccF9e9B5DA745b44E754FC4ee3c76
NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=0x5B73C5498C1e3b4DBA84DE0F1833C4A029d90519
NEXT_PUBLIC_GOVERNOR_ADDRESS=0x...
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_AMM_ADDRESS=0x...
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/<your-subgraph>
```

### 3. Запуск проекта

```bash
# Собрать смарт-контракты
forge build

# Запустить фронтенд
cd frontend
npm run dev
```

### 4. Тесты и CI

```bash
forge test
forge fmt --check
```

GitHub Actions уже настроен в `.github/workflows/test.yml` с `submodules: recursive`.
Slither игнорирует папку `src/security/*` через `slither.config.json`.

## Сабграф

Сабграф находится в папке `subgraph`.

```bash
cd subgraph
npm install
npm run codegen
npm run build
```

В `subgraph/subgraph.yaml` настроены индексация:
- `AssetDeployed` — создание новых активов
- `Deposit` — депозиты в `RWAVault`
- `ProposalCreated` / `ProposalExecuted` — DAO предложения

## Деплой на Base Sepolia / Arbitrum Sepolia

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast
```

Для Base Sepolia используйте RPC вида: `https://sepolia.base.org` или свой провайдер.
Для Arbitrum Sepolia используйте RPC, предоставленный Arbitrum.

## Верификация контрактов

После успешного деплоя выполните верификацию через Etherscan / BaseScan / Arbiscan:

```bash
forge verify-contract --chain <chain> <contract_address> <contract_name> --compiler-version 0.8.24
```

Затем обновите таблицу адресов и ссылки в этом README.
