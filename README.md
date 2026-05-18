# Blockchain Project

A Foundry-based smart contract monorepo with a Next.js frontend (RainbowKit + wagmi) and a The Graph subgraph for indexing on-chain events.

## Key Features

- Solidity contracts developed and tested with Foundry
- Frontend using Next.js, Wagmi and RainbowKit for wallet integration
- The Graph subgraph for indexing core events
- CI that runs formatting, tests, build, and static analysis (Slither)

## Contracts & Addresses

> Update the table below after deployment and verification.

| Contract | Address | Network | Explorer |
| --- | --- | --- | --- |
| RWAFactory | 0xDB8Cff278aDccF9e9B5DA745b44E754FC4ee3c76 | Base Sepolia / Arbitrum Sepolia | https://sepolia.basescan.org/address/0xDB8Cff278aDccF9e9B5DA745b44E754FC4ee3c76 |
| GovernanceToken | 0x5B73C5498C1e3b4DBA84DE0F1833C4A029d90519 | Base Sepolia / Arbitrum Sepolia | https://sepolia.basescan.org/address/0x5B73C5498C1e3b4DBA84DE0F1833C4A029d90519 |
| ProtocolGovernor | TBD | Base Sepolia / Arbitrum Sepolia | TBD |
| RWAVault | TBD | Base Sepolia / Arbitrum Sepolia | TBD |
| AMM | TBD | Base Sepolia / Arbitrum Sepolia | TBD |


## Quickstart (Developer)

Prerequisites:
- Git
- Foundry (forge, cast)
- Node.js (16+)
- npm or pnpm

1) Install Foundry

```bash
# Linux / macOS (recommended)
curl -L https://foundry.paradigm.xyz | bash
source $HOME/.bashrc # or restart shell
foundryup

# Windows (WSL recommended) — follow Foundry docs: https://github.com/foundry-rs/foundry
```

2) Install repo dependencies

```bash
# Install Solidity dependencies
forge install

# Frontend
cd frontend
npm install

# Subgraph
cd ../subgraph
npm install
```

3) Configure environment variables

Create `frontend/.env.local` and set contract addresses and endpoints:

```
NEXT_PUBLIC_FACTORY_ADDRESS=0xDB8Cff278aDccF9e9B5DA745b44E754FC4ee3c76
NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=0x5B73C5498C1e3b4DBA84DE0F1833C4A029d90519
NEXT_PUBLIC_GOVERNOR_ADDRESS=0x...
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_AMM_ADDRESS=0x...
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/<your-subgraph>
```

4) Build & Run

```bash
# Build contracts
forge build

# Run frontend
cd frontend
npm run dev
```

## Tests and Formatting

Run tests and formatting checks locally before pushing:

```bash
forge fmt --check
forge test -vvv
```

CI workflows are defined in `.github/workflows/ci.yml` and `.github/workflows/test.yml` and already include `submodules: recursive` for `actions/checkout`.

## Static Analysis (Slither)

Slither config is in `slither.config.json`. The repository excludes `src/security` from the default analysis to avoid noise. CI currently marks the Slither step as non-blocking to prevent CI failures while issues are triaged.

To run Slither locally (optional):

```bash
pip3 install slither-analyzer
slither . --config-file slither.config.json
```

## Subgraph

The subgraph is located in the `subgraph` directory.

```bash
cd subgraph
npm run codegen
npm run build
# For local Graph Node testing, follow The Graph docs
```

Indexed events (examples): `AssetDeployed`, `Deposit`, `ProposalCreated`, `ProposalExecuted`.

## Deployment

Deploy contracts using `forge script` with your RPC and private key:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
```

Replace `<RPC_URL>` and `<PRIVATE_KEY>` with your values. After deployment, verify contracts on the destination explorer and update the table above.

## Verification

Example verify command (adjust chain and contract names):

```bash
forge verify-contract --chain <chain> <contract_address> <contract_name> --compiler-version 0.8.24
```

## Contributing

- Run `forge fmt` and `forge test` before opening PRs
- Keep tests deterministic and fast
- Update the address table and `frontend/.env.local` after deployments
