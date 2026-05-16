'use client';

<<<<<<< HEAD
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { governanceTokenAbi, governorAbi, PROPOSAL_STATE_LABELS } from '@/lib/abis';
import { fetchProposals, type SubgraphProposal } from '@/lib/subgraph';
=======
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useBlockNumber, useContractRead } from 'wagmi';
import type { Address } from 'viem';
>>>>>>> d6aae22 (adresses)

const GOVERNANCE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS as Address | undefined;
const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as Address | undefined;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

<<<<<<< HEAD
type ProposalView = SubgraphProposal & {
  onChainState?: number;
};

function formatTokenAmount(value: bigint | undefined, decimals = 18, symbol = 'PROT') {
  if (value === undefined) {
    return '—';
  }
  return `${formatUnits(value, decimals)} ${symbol}`;
}

function ProposalList({
  title,
  emptyText,
  proposals,
}: {
  title: string;
  emptyText: string;
  proposals: ProposalView[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {proposals.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {proposals.map((proposal) => (
            <li key={proposal.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">#{proposal.proposalId}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {proposal.onChainState !== undefined
                    ? PROPOSAL_STATE_LABELS[proposal.onChainState] ?? `State ${proposal.onChainState}`
                    : proposal.executed
                      ? 'Executed'
                      : 'Unknown'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{proposal.description || 'Без описания'}</p>
              <p className="mt-2 break-all text-xs text-slate-500">Proposer: {proposal.proposer}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
=======
const governanceAbi = [
  {
    name: 'getVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    name: 'delegates',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'address', name: '' }],
  },
] as const;

interface Proposal {
  id: string;
  proposalId: string;
  proposer: string;
  description: string | null;
  startBlock: string;
  endBlock: string;
  executed: boolean;
}

const queryProposals = `
  query Proposals {
    proposals(first: 50, orderBy: startBlock, orderDirection: desc) {
      id
      proposalId
      proposer
      description
      startBlock
      endBlock
      executed
    }
  }
`;

function formatAddress(value: string): string {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatBigNumber(value: string | undefined): string {
  return value ?? '0';
>>>>>>> d6aae22 (adresses)
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
<<<<<<< HEAD
  const [proposals, setProposals] = useState<SubgraphProposal[]>([]);
  const [subgraphError, setSubgraphError] = useState<string | null>(null);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const tokenReads = useReadContracts({
    contracts: [
      {
        address: GOVERNANCE_TOKEN_ADDRESS,
        abi: governanceTokenAbi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        address: GOVERNANCE_TOKEN_ADDRESS,
        abi: governanceTokenAbi,
        functionName: 'getVotes',
        args: address ? [address] : undefined,
      },
      {
        address: GOVERNANCE_TOKEN_ADDRESS,
        abi: governanceTokenAbi,
        functionName: 'delegates',
        args: address ? [address] : undefined,
      },
      {
        address: GOVERNANCE_TOKEN_ADDRESS,
        abi: governanceTokenAbi,
        functionName: 'decimals',
      },
      {
        address: GOVERNANCE_TOKEN_ADDRESS,
        abi: governanceTokenAbi,
        functionName: 'symbol',
      },
    ],
    query: {
      enabled: Boolean(isConnected && address && GOVERNANCE_TOKEN_ADDRESS),
    },
  });

  const balance = tokenReads.data?.[0]?.result as bigint | undefined;
  const votingPower = tokenReads.data?.[1]?.result as bigint | undefined;
  const delegate = tokenReads.data?.[2]?.result as Address | undefined;
  const decimals = (tokenReads.data?.[3]?.result as number | undefined) ?? 18;
  const symbol = (tokenReads.data?.[4]?.result as string | undefined) ?? 'PROT';

  useEffect(() => {
    if (!SUBGRAPH_URL) {
      setSubgraphError('Укажите NEXT_PUBLIC_SUBGRAPH_URL после деплоя сабграфа.');
      return;
    }

    setLoadingProposals(true);
    fetchProposals(SUBGRAPH_URL)
      .then((items) => {
        setProposals(items);
        setSubgraphError(null);
      })
      .catch((error: Error) => {
        setSubgraphError(error.message);
        setProposals([]);
      })
      .finally(() => setLoadingProposals(false));
  }, []);

  const stateReads = useReadContracts({
    contracts: proposals.map((proposal) => ({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: 'state' as const,
      args: [BigInt(proposal.proposalId)],
    })),
    query: {
      enabled: Boolean(GOVERNOR_ADDRESS && proposals.length > 0),
    },
  });

  const proposalsWithState: ProposalView[] = useMemo(
    () =>
      proposals.map((proposal, index) => ({
        ...proposal,
        onChainState: stateReads.data?.[index]?.result as number | undefined,
      })),
    [proposals, stateReads.data],
  );

  const activeProposals = proposalsWithState.filter(
    (proposal) => proposal.onChainState === 1 || proposal.onChainState === 0 || proposal.onChainState === 5,
  );
  const executedProposals = proposalsWithState.filter(
    (proposal) => proposal.onChainState === 7 || proposal.executed,
  );

  const selfDelegated = !delegate || delegate === address;
  const delegatedToOther = Boolean(delegate && address && delegate !== address);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
=======
  const blockNumber = useBlockNumber({ watch: true });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  const [proposalError, setProposalError] = useState<string | null>(null);

  const balance = useBalance({
    address: address as Address,
    token: GOVERNANCE_TOKEN_ADDRESS,
    watch: true,
    enabled: isConnected && Boolean(address && GOVERNANCE_TOKEN_ADDRESS),
  });

  const votes = useContractRead({
    address: GOVERNANCE_TOKEN_ADDRESS,
    abi: governanceAbi,
    functionName: 'getVotes',
    args: [address as Address],
    watch: true,
    enabled: isConnected && Boolean(address && GOVERNANCE_TOKEN_ADDRESS),
  });

  const delegate = useContractRead({
    address: GOVERNANCE_TOKEN_ADDRESS,
    abi: governanceAbi,
    functionName: 'delegates',
    args: [address as Address],
    watch: true,
    enabled: isConnected && Boolean(address && GOVERNANCE_TOKEN_ADDRESS),
  });

  useEffect(() => {
    if (!SUBGRAPH_URL) {
      setProposalError('Установите NEXT_PUBLIC_SUBGRAPH_URL в frontend/.env.local');
      setLoadingProposals(false);
      return;
    }

    async function loadProposals() {
      setLoadingProposals(true);
      setProposalError(null);

      try {
        const response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryProposals }),
        });

        const result = await response.json();
        if (!response.ok || result.errors) {
          throw new Error(result.errors?.[0]?.message ?? 'Ошибка загрузки предложений');
        }

        const data = result.data as { proposals: Proposal[] };
        setProposals(data.proposals ?? []);
      } catch (error) {
        setProposalError(error instanceof Error ? error.message : 'Ошибка загрузки предложений');
      } finally {
        setLoadingProposals(false);
      }
    }

    loadProposals();
  }, []);

  const proposalSections = useMemo(() => {
    const currentBlock = blockNumber.data ?? 0;
    return proposals.map((proposal) => {
      const start = Number(proposal.startBlock);
      const end = Number(proposal.endBlock);
      let status = 'Closed';
      if (proposal.executed) {
        status = 'Executed';
      } else if (currentBlock >= start && currentBlock <= end) {
        status = 'Active';
      }
      return { ...proposal, status };
    });
  }, [blockNumber.data, proposals]);

  const activeProposals = proposalSections.filter((proposal) => proposal.status === 'Active');
  const executedProposals = proposalSections.filter((proposal) => proposal.status === 'Executed');
  const closedProposals = proposalSections.filter((proposal) => proposal.status === 'Closed');

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
>>>>>>> d6aae22 (adresses)
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Governance Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
<<<<<<< HEAD
              Voting Power (баланс + делегирование) и список пропозалов из сабграфа.
=======
              Баланс GovernanceToken, делегирование и список предложений.
>>>>>>> d6aae22 (adresses)
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <ConnectButton />
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              На главную
            </Link>
          </div>
        </div>

<<<<<<< HEAD
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Voting Power</h2>
            {!isConnected ? (
              <p className="mt-4 text-sm text-slate-600">Подключите кошелёк, чтобы увидеть voting power.</p>
            ) : !GOVERNANCE_TOKEN_ADDRESS ? (
              <p className="mt-4 text-sm text-slate-600">
                Укажите <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS</code>.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-slate-500">Token balance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {tokenReads.isPending ? 'Загрузка…' : formatTokenAmount(balance, decimals, symbol)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-slate-500">Voting power (getVotes)</p>
                  <p className="mt-1 text-2xl font-semibold text-blue-700">
                    {tokenReads.isPending ? 'Загрузка…' : formatTokenAmount(votingPower, decimals, symbol)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Учитывает делегирование: это вес голоса на текущем снимке.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-slate-500">Delegation</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {selfDelegated ? 'Самоделегирование' : delegate}
                  </p>
                  {delegatedToOther && (
                    <p className="mt-2 text-xs text-amber-700">
                      Голоса делегированы другому адресу; ваш voting power на кошельке может быть 0.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <div className="space-y-4">
            {subgraphError && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {subgraphError}
              </p>
            )}
            {loadingProposals && <p className="text-sm text-slate-600">Загрузка пропозалов из сабграфа…</p>}
            <ProposalList
              title="Активные пропозалы"
              emptyText="Нет активных пропозалов (Pending / Active / Queued)."
              proposals={activeProposals}
            />
            <ProposalList
              title="Исполненные пропозалы"
              emptyText="Нет исполненных пропозалов."
              proposals={executedProposals}
            />
          </div>
=======
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Voting Power</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Address</div>
                <div className="mt-1 text-sm font-medium text-slate-900 break-all">{address ?? 'Не подключено'}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Token balance</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {isConnected ? (balance.isLoading ? 'Загрузка…' : `${balance.data?.formatted ?? '0'} ${balance.data?.symbol ?? ''}`) : 'Подключите кошелек'}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Voting power</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {isConnected ? (votes.isLoading ? 'Загрузка…' : formatBigNumber(votes.data?.toString())) : 'Подключите кошелек'}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Delegated to</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{delegate.isLoading ? 'Загрузка…' : delegate.data ? formatAddress(delegate.data.toString()) : 'Не делегировано'}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Governor contract</div>
                <div className="mt-1 text-sm font-medium text-slate-900 break-all">{GOVERNOR_ADDRESS ?? 'Установите NEXT_PUBLIC_GOVERNOR_ADDRESS'}</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Subgraph status</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Subgraph URL</div>
                <div className="mt-1 text-sm font-medium text-slate-900 break-all">{SUBGRAPH_URL ?? 'Не задана'}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Current block</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{blockNumber.data ?? 'Не найден'}</div>
              </div>
              {proposalError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{proposalError}</div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="mt-8 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Active proposals</h2>
                <p className="mt-1 text-sm text-slate-600">Текущие голосования из сабграфа.</p>
              </div>
              <div className="text-sm font-medium text-slate-700">{activeProposals.length} активных</div>
            </div>

            {loadingProposals ? (
              <p className="mt-4 text-sm text-slate-600">Загрузка предложений…</p>
            ) : activeProposals.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">Нет активных предложений.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {activeProposals.map((proposal) => (
                  <li key={proposal.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Proposal #{proposal.proposalId}</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">{proposal.description ?? 'Без описания'}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">Active</div>
                    </div>
                    <div className="mt-3 text-sm text-slate-500">Proposer: {formatAddress(proposal.proposer)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Executed proposals</h2>
                <p className="mt-1 text-sm text-slate-600">Предложения, выполненные через Governor.</p>
              </div>
              <div className="text-sm font-medium text-slate-700">{executedProposals.length} выполнено</div>
            </div>

            {loadingProposals ? (
              <p className="mt-4 text-sm text-slate-600">Загрузка предложений…</p>
            ) : executedProposals.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">Нет исполненных предложений.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {executedProposals.map((proposal) => (
                  <li key={proposal.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Proposal #{proposal.proposalId}</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">{proposal.description ?? 'Без описания'}</div>
                      </div>
                      <div className="rounded-2xl bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Executed</div>
                    </div>
                    <div className="mt-3 text-sm text-slate-500">Proposer: {formatAddress(proposal.proposer)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {closedProposals.length > 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Closed proposals</h2>
              <p className="mt-1 text-sm text-slate-600">Предложения, завершённые без выполнения.</p>
              <ul className="mt-4 space-y-4">
                {closedProposals.map((proposal) => (
                  <li key={proposal.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Proposal #{proposal.proposalId}</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">{proposal.description ?? 'Без описания'}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">Closed</div>
                    </div>
                    <div className="mt-3 text-sm text-slate-500">Proposer: {formatAddress(proposal.proposer)}</div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
>>>>>>> d6aae22 (adresses)
        </div>
      </div>
    </div>
  );
}
