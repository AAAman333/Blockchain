'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { governanceTokenAbi, governorAbi, PROPOSAL_STATE_LABELS } from '@/lib/abis';
import { fetchProposals, type SubgraphProposal } from '@/lib/subgraph';

const GOVERNANCE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS as Address | undefined;
const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as Address | undefined;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

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
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
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
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Governance Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Voting Power (баланс + делегирование) и список пропозалов из сабграфа.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <ConnectButton />
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              На главную
            </Link>
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
}
