'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { factoryAbi } from '../../abi'; 

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

export default function AssetsPage() {
  const { isConnected } = useAccount();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const { writeContract, isPending } = useWriteContract();

  const { data: deployedTokens, refetch } = useReadContract({
    abi: factoryAbi,
    address: FACTORY_ADDRESS,
    functionName: 'getDeployedTokens',
  });

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol) return;

    writeContract({
      abi: factoryAbi,
      address: FACTORY_ADDRESS,
      functionName: 'deployWithCreate',
      args: [name, symbol],
    }, {
      onSuccess: () => {
        setName('');
        setSymbol('');
        setTimeout(() => refetch(), 4000);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto border-b border-slate-800 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          RWA Asset Tokenization Factory
        </h1>
        <p className="text-slate-400 text-sm mt-1">Deploy fractionalized real estate properties or commodity-backed ERC-20 smart tokens.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {isConnected ? (
          <form onSubmit={handleDeploy} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="Asset Name (e.g. Almaty Premium Estate)" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="w-full md:w-48">
              <input 
                type="text" 
                placeholder="Symbol (e.g. APREM)" 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <button 
              type="submit" 
              disabled={isPending} 
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition text-sm shadow-md shadow-blue-600/10 disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? 'Deploying...' : 'Deploy RWA Token'}
            </button>
          </form>
        ) : (
          <p className="text-amber-400/80 text-sm bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
            ⚠️ Please connect your Web3 wallet on the dashboard page to authorization token deployment.
          </p>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-200 mb-4">Tracked Network RWA Tokens</h2>
          {deployedTokens && deployedTokens.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4 w-12">#</th>
                    <th className="p-4">Deployed Smart Contract Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm font-mono text-slate-300">
                  {deployedTokens.map((token, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="p-4 text-slate-500 font-sans">{idx + 1}</td>
                      <td className="p-4 text-blue-400 hover:underline cursor-pointer select-all">{token}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              No custom RWA asset contracts have been initialized by this factory yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}