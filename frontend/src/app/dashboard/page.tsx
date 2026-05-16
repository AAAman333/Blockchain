'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useContractRead,
  useContractReads,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import type { Address } from 'viem';
import { governanceTokenAbi, governorAbi } from '@/lib/abis';

const GOVERNANCE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS as Address | undefined;
const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as Address | undefined;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

interface SubgraphProposal {
  id: string;
  proposalId: string;
  proposer: string;
  description?: string | null;
  startBlock: string;
  endBlock: string;
  executed: boolean;
}

type ProposalView = SubgraphProposal & {
  onChainState?: number;
};

const proposalStateLabels = [
  'Pending',
  'Active',
  'Canceled',
  'Defeated',
  'Succeeded',
  'Queued',
  'Expired',
  'Executed',
] as const;

const queryProposals = 
  query Proposals {
    proposals(first: 50, orderBy: createdAt, orderDirection: desc) {
      id
      proposalId
      proposer
      description
      startBlock
      endBlock
      executed
    }
  }
;

function formatAddress(value: string): string {
  return ${value.slice(0, 6)}...;
}

function formatAmount(value: bigint | undefined): string {
  return value?.toString() ?? '0';
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [proposals, setProposals] = useState<SubgraphProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [voteRequest, setVoteRequest] = useState<{ proposalId: string; support: number } | null>(null);

  const balance = useBalance({
    address: address as Address,
    token: GOVERNANCE_TOKEN_ADDRESS,
    watch: true,
    enabled: isConnected && Boolean(address && GOVERNANCE_TOKEN_ADDRESS),
  });

  const votes = useContractRead({
    address: GOVERNANCE_TOKEN_ADDRESS,
    abi: governanceTokenAbi,
    functionName: 'getVotes',
    args: [address as Address],
    watch: true,
    enabled: isConnected && Boolean(address && GOVERNANCE_TOKEN_ADDRESS),
  });

  const delegate = useContractRead({
    address: GOVERNANCE_TOKEN_ADDRESS,
    abi: governanceTokenAbi,
    functionName: 'delegates',
    args: [address as Address],
    watch: true,
    enabled: isConnected && Boolean(address && GOVERNANCE_TOKEN_ADDRESS),
  });

  const blockNumber = useBlockNumber({ watch: true });

  const stateReads = useContractReads({
    contracts: proposals.map((proposal) => ({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: 'state' as const,
      args: [BigInt(proposal.proposalId)],
    })),
    enabled: Boolean(GOVERNOR_ADDRESS && proposals.length > 0),
  });

  const prepareVote = usePrepareContractWrite({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: 'castVote',
    args: voteRequest ? [BigInt(voteRequest.proposalId), voteRequest.support] : undefined,
    enabled: Boolean(GOVERNOR_ADDRESS && voteRequest),
  });

  const voteWrite = useContractWrite(prepareVote.config);

  useEffect(() => {
    if (voteRequest && prepareVote.isSuccess && voteWrite.write) {
      voteWrite.write();
      setVoteRequest(null);
    }
  }, [voteRequest, prepareVote.isSuccess, voteWrite.write]);

  useEffect(() => {
    if (!SUBGRAPH_URL) {
      setProposalError('Укажите NEXT_PUBLIC_SUBGRAPH_URL после деплоя сабграфа.');
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

        setProposals(result.data?.proposals ?? []);
      } catch (error) {
        setProposalError(error instanceof Error ? error.message : 'Ошибка загрузки предложений');
      } finally {
        setLoadingProposals(false);
      }
    }

    loadProposals();
  }, []);

  const proposalsWithState: ProposalView[] = useMemo(
    () =>
      proposals.map((proposal, index) => {
        const rawState = stateReads.data?.[index]?.result as number | bigint | undefined;
        const onChainState = rawState === undefined ? undefined : typeof rawState === 'bigint' ? Number(rawState) : rawState;
        return {
          ...proposal,
          onChainState,
        };
      }),
    [proposals, stateReads.data],
  );

  const activeProposals = proposalsWithState.filter(
    (proposal) => proposal.onChainState === 0 || proposal.onChainState === 1 || proposal.onChainState === 5,
  );
  const executedProposals = proposalsWithState.filter(
    (proposal) => proposal.onChainState === 7 || proposal.executed,
  );
  const closedProposals = proposalsWithState.filter(
    (proposal) =>
      proposal.onChainState !== 0 &&
      proposal.onChainState !== 1 &&
      proposal.onChainState !== 5 &&
      proposal.onChainState !== 7 &&
      !proposal.executed,
  );

  const voteInProgress = voteWrite.isLoading || prepareVote.isLoading;

  function handleVote(proposalId: string, support: number) {
    setProposalError(null);
    setVoteRequest({ proposalId, support });
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Governance Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Управляй голосами GovernanceToken и следи за предложениями из сабграфа.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <ConnectButton />
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              На главную
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Voting Power</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Wallet</div>
                <div className="mt-1 break-all text-sm font-medium text-slate-900">{address ?? 'Не подключено'}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">GovernanceToken balance</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {isConnected
                    ? balance.isLoading
                      ? 'Загрузка…'
                      : ${balance.data?.formatted ?? '0'} 
                    : 'Подключите кошелек'}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Voting power</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {isConnected ? (votes.isLoading ? 'Загрузка…' : formatAmount(votes.data as bigint | undefined)) : 'Подключите кошелек'}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Delegated to</div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {isConnected
                    ? delegate.isLoading
                      ? 'Загрузка…'
                      : delegate.data
                      ? formatAddress(delegate.data.toString())
                      : 'Не делегировано'
                    : 'Подключите кошелек'}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Subgraph status</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Subgraph URL</div>
                <div className="mt-1 break-all text-sm font-medium text-slate-900">{SUBGRAPH_URL ?? 'Не задана'}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Current block</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{blockNumber.data ?? 'Не найден'}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm text-slate-500">Governor contract</div>
                <div className="mt-1 break-all text-sm font-medium text-slate-900">{GOVERNOR_ADDRESS ?? 'Установите NEXT_PUBLIC_GOVERNOR_ADDRESS'}</div>
              </div>
              {proposalError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{proposalError}</div>
              )}
              {voteWrite.isError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  Ошибка голосования. Повторите попытку.
                </div>
              )}
              {voteInProgress && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">Транзакция голосования ожидает подтверждения...</div>
              )}
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Proposal #{proposal.proposalId}</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">{proposal.description ?? 'Без описания'}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                        {proposal.onChainState !== undefined ? proposalStateLabels[proposal.onChainState] ?? State  : proposal.executed ? 'Executed' : 'Unknown'}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        onClick={() => handleVote(proposal.proposalId, 1)}
                        disabled={!isConnected || !voteWrite.write}
                      >
                        Vote For
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                        onClick={() => handleVote(proposal.proposalId, 0)}
                        disabled={!isConnected || !voteWrite.write}
                      >
                        Vote Against
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        onClick={() => handleVote(proposal.proposalId, 2)}
                        disabled={!isConnected || !voteWrite.write}
                      >
                        Abstain
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">Proposer: {formatAddress(proposal.proposer)}</p>
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
        </div>
      </div>
    </div>
  );
}
