'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useBalance,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import { parseEther } from 'viem';
import type { Address } from 'viem';
import { factoryAbi, vaultAbi, ammAbi } from '@/lib/abis';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address | undefined;
const GOVERNANCE_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS as Address | undefined;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as Address | undefined;
const AMM_ADDRESS = process.env.NEXT_PUBLIC_AMM_ADDRESS as Address | undefined;

function parseAmount(value: string) {
  try {
    return parseEther(value);
  } catch {
    return undefined;
  }
}

export default function AssetsPage() {
  const { address, isConnected } = useAccount();
  const [swapAmount, setSwapAmount] = useState('0.01');
  const [depositAmount, setDepositAmount] = useState('0.01');
  const [swapDirection, setSwapDirection] = useState<'0to1' | '1to0'>('0to1');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
    enabled: isConnected && Boolean(address && governanceTokenAddress),
  });

  const parsedSwapAmount = parseAmount(swapAmount);
  const parsedDepositAmount = parseAmount(depositAmount);

  const prepareSwap = usePrepareContractWrite({
    address: AMM_ADDRESS,
    abi: ammAbi,
    functionName: 'swap',
    args:
      AMM_ADDRESS && parsedSwapAmount !== undefined && isConnected && address
        ? [parsedSwapAmount, swapDirection === '0to1', 0n]
        : undefined,
    enabled: Boolean(AMM_ADDRESS && parsedSwapAmount !== undefined && isConnected && address),
  });

  const swapWrite = useContractWrite(prepareSwap.config);

  const prepareDeposit = usePrepareContractWrite({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: 'deposit',
    args: VAULT_ADDRESS && parsedDepositAmount !== undefined && isConnected && address ? [parsedDepositAmount, address as Address] : undefined,
    enabled: Boolean(VAULT_ADDRESS && parsedDepositAmount !== undefined && isConnected && address),
  });

  const depositWrite = useContractWrite(prepareDeposit.config);

  const isSwapDisabled = !isConnected || !AMM_ADDRESS || !parsedSwapAmount || !swapWrite.write;
  const isDepositDisabled = !isConnected || !VAULT_ADDRESS || !parsedDepositAmount || !depositWrite.write;

  useEffect(() => {
    if (!FACTORY_ADDRESS) {
      console.warn('Set NEXT_PUBLIC_FACTORY_ADDRESS in frontend/.env.local to enable token listing.')
    }
  }, []);

  async function handleSwap() {
    setActionMessage('Подтвердите swap в кошельке...');

    try {
      if (swapWrite.writeAsync) {
        await swapWrite.writeAsync();
      } else {
        swapWrite.write?.();
      }
      setActionMessage('Swap отправлен. Подождите подтверждение транзакции.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Ошибка swap.');
    }
  }

  async function handleDeposit() {
    setActionMessage('Подтвердите депозит в кошельке...');

    try {
      if (depositWrite.writeAsync) {
        await depositWrite.writeAsync();
      } else {
        depositWrite.write?.();
      }
      setActionMessage('Депозит отправлен. Подождите подтверждение.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Ошибка депозита.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Assets & Actions</h1>
            <p className="mt-2 text-sm text-slate-600">Подключите кошелек, смотри баланс GovernanceToken, делай swap и депозиции в vault.</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <ConnectButton />
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">На главную</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Deployed Tokens</h2>
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
                <p className="mt-4 text-sm text-slate-600">Токенов ещё нет. Сначала задеплой через Factory.</p>
              )
            ) : (
              <p className="mt-4 text-sm text-slate-600">Укажите адрес фабрики в <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_FACTORY_ADDRESS</code>.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">GovernanceToken balance</h2>
            {isConnected ? (
              governanceTokenAddress ? (
                <div className="mt-4 space-y-4">
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
                      {balanceRead.isLoading ? 'Загрузка…' : `${balanceRead.data?.formatted ?? '0'} ${balanceRead.data?.symbol ?? ''}`}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Укажите адрес GovernanceToken в <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS</code> или создайте токен через Factory.</p>
              )
            ) : (
              <p className="mt-4 text-sm text-slate-600">Подключите кошелек, чтобы увидеть баланс.</p>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Swap</h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-700">Amount</label>
                <input
                  type="text"
                  value={swapAmount}
                  onChange={(event) => setSwapAmount(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${swapDirection === '0to1' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                  onClick={() => setSwapDirection('0to1')}
                >
                  Token0 → Token1
                </button>
                <button
                  type="button"
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${swapDirection === '1to0' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                  onClick={() => setSwapDirection('1to0')}
                >
                  Token1 → Token0
                </button>
              </div>
              <button
                type="button"
                disabled={isSwapDisabled}
                onClick={handleSwap}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {swapWrite.isLoading ? 'Отправка...' : 'Swap'}
              </button>
              {prepareSwap.error && <p className="text-sm text-rose-600">{prepareSwap.error.message}</p>}
              {swapWrite.error && <p className="text-sm text-rose-600">{swapWrite.error.message}</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Deposit to Vault</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">Vault address</div>
                <div className="mt-1 break-all text-sm font-medium text-slate-900">{VAULT_ADDRESS ?? 'Не задан'}</div>
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-700">Deposit amount</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                disabled={isDepositDisabled}
                onClick={handleDeposit}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {depositWrite.isLoading ? 'Отправка...' : 'Deposit to Vault'}
              </button>
              {prepareDeposit.error && <p className="text-sm text-rose-600">{prepareDeposit.error.message}</p>}
              {depositWrite.error && <p className="text-sm text-rose-600">{depositWrite.error.message}</p>}
            </div>
          </section>
        </div>

        {actionMessage ? <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{actionMessage}</div> : null}
      </div>
    </div>
  );
}
