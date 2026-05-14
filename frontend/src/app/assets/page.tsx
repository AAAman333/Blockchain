'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useContractRead } from 'wagmi';
import type { Address } from 'viem';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address | undefined;
const GOVERNANCE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS as Address | undefined;

const factoryAbi = [
  {
    name: 'getDeployedTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]', name: '' }],
  },
] as const;

export default function AssetsPage() {
  const { address, isConnected } = useAccount();

  const tokensRead = useContractRead({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: 'getDeployedTokens',
    watch: true,
    enabled: Boolean(FACTORY_ADDRESS),
  });

  const deployedTokens = (tokensRead.data as Address[] | undefined) ?? [];
  const governanceTokenAddress = GOVERNANCE_TOKEN_ADDRESS ?? deployedTokens[0];

  const balanceRead = useBalance({
    address: address as Address,
    token: governanceTokenAddress,
    watch: true,
    enabled: Boolean(address && governanceTokenAddress),
  });

  useEffect(() => {
    if (!FACTORY_ADDRESS) {
      console.warn('Set NEXT_PUBLIC_FACTORY_ADDRESS in frontend/.env.local to enable token listing.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Assets</h1>
            <p className="mt-2 text-sm text-slate-600">
              Просмотр токенов, созданных через Factory, и баланс GovernanceToken.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <ConnectButton />
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              На главную
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Factory deployed tokens</h2>
            {FACTORY_ADDRESS ? (
              deployedTokens.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {deployedTokens.map((tokenAddress) => (
                    <li key={tokenAddress} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm text-slate-500">Token address</div>
                      <div className="mt-1 break-all text-sm font-medium text-slate-900">{tokenAddress}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Токенов ещё нет. Сначала задеплой через Factory на блокчейне.</p>
              )
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Укажите адрес фабрики в переменной <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_FACTORY_ADDRESS</code>.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">GovernanceToken balance</h2>
            {isConnected ? (
              governanceTokenAddress ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-sm text-slate-500">Wallet</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 break-all">{address}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-sm text-slate-500">Token</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 break-all">{governanceTokenAddress}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-sm text-slate-500">Balance</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {balanceRead.isLoading ? 'Загрузка…' : balanceRead.data?.formatted ?? '0'} {balanceRead.data?.symbol ?? ''}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Укажите адрес GovernanceToken в <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS</code> или создайте токен через Factory.
                </p>
              )
            ) : (
              <p className="mt-4 text-sm text-slate-600">Подключите кошелек, чтобы увидеть баланс.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
