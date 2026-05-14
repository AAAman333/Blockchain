'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-5xl font-semibold text-slate-900">RWA Tokenization Platform</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Управляй активами, получай GovernanceToken и смотри список задеплоенных токенов через Factory.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/assets"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Перейти в Assets
              </Link>
              <span className="text-sm text-slate-500">или подключи кошелек прямо сейчас.</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-inner">
            <h2 className="text-xl font-semibold text-slate-900">Connect Wallet</h2>
            <p className="mt-3 text-sm text-slate-600">Подключи кошелек, чтобы просматривать баланс GovernanceToken и токены Factory.</p>
            <div className="mt-6">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}