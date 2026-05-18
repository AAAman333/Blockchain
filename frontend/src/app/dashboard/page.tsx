'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import { governanceTokenAbi, governorAbi, vaultAbi, ammAbi } from '../../abi';

const GOV_TOKEN = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS as `0x${string}`;
const VAULT = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;
const AMM = process.env.NEXT_PUBLIC_AMM_ADDRESS as `0x${string}`;
const GOVERNOR = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as `0x${string}`;

const PROPOSAL_STATES = [
  'Pending', 
  'Active', 
  'Canceled', 
  'Defeated', 
  'Succeeded', 
  'Queued', 
  'Expired', 
  'Executed'
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const [swapAmount, setSwapAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [supportChoice, setSupportChoice] = useState('1');

  const { data: balance, refetch: refetchBal } = useReadContract({
    abi: governanceTokenAbi,
    address: GOV_TOKEN,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: votes, refetch: refetchVotes } = useReadContract({
    abi: governanceTokenAbi,
    address: GOV_TOKEN,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: delegatee, refetch: refetchDel } = useReadContract({
    abi: governanceTokenAbi,
    address: GOV_TOKEN,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: proposalStateRaw, error: stateError } = useReadContract({
    abi: governorAbi,
    address: GOVERNOR,
    functionName: 'state',
    args: proposalId ? [BigInt(proposalId)] : undefined,
    query: { enabled: !!proposalId && /^\d+$/.test(proposalId) }
  });

  const handleSelfDelegate = () => {
    if (!address) return;
    writeContract({
      abi: governanceTokenAbi,
      address: GOV_TOKEN,
      functionName: 'delegate',
      args: [address],
    }, {
      onSuccess: () => {
        setTimeout(() => { refetchVotes(); refetchDel(); }, 5000);
      }
    });
  };

  const handleCreateProposal = () => {
    if (!address) return;

    const extendedGovernorAbi = [
      {
        name: 'propose',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'targets', type: 'address[]' },
          { name: 'values', type: 'uint256[]' },
          { name: 'calldatas', type: 'bytes[]' },
          { name: 'description', type: 'string' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const;

    writeContract({
      abi: extendedGovernorAbi,
      address: GOVERNOR,
      functionName: 'propose',
      args: [[GOVERNOR], [0n], ['0x'], `Test Proposal ${Date.now()}`],
    });
  };

  const handleDeposit = () => {
    if (!depositAmount) return;
    writeContract({
      abi: vaultAbi,
      address: VAULT,
      functionName: 'deposit',
      args: [BigInt(depositAmount), address!],
    });
  };

  const handleVote = () => {
    if (!proposalId) return;
    writeContract({
      abi: governorAbi,
      address: GOVERNOR,
      functionName: 'castVote',
      args: [BigInt(proposalId), Number(supportChoice)],
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            RWA Investor Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage assets, interact with AMM pools, and participate in DAO governance.</p>
        </div>
        <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-xl">
          <ConnectButton />
        </div>
      </div>

      {isConnected && address ? (
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-sm font-semibold text-slate-400 uppercase">Governance Balance</h3>
              <p className="text-3xl font-bold mt-2 text-blue-400">{balance ? Number(formatUnits(balance, 18)).toLocaleString() : '0'} PROT</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-sm font-semibold text-slate-400 uppercase">Current Voting Power</h3>
              <p className="text-3xl font-bold mt-2 text-emerald-400">{votes ? Number(formatUnits(votes, 18)).toLocaleString() : '0'}</p>
              {(!votes || votes === 0n) && (
                <button onClick={handleSelfDelegate} className="mt-3 w-full bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 text-xs py-1.5 rounded-lg transition">
                  ⚡ Activate Voting Power
                </button>
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-sm font-semibold text-slate-400 uppercase">Delegated To</h3>
              <p className="text-sm font-mono mt-3 text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 truncate">
                {delegatee && delegatee !== '0x0000000000000000000000000000000000000000' ? delegatee : 'Nobody'}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold border-b border-slate-800 pb-2 mt-12 text-slate-300">Protocol Interactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 font-bold">1</div>
                <h3 className="text-lg font-bold text-slate-200">Create Test Proposal</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">Generate a brand new live testing proposal directly on the blockchain ledger infrastructure.</p>
              </div>
              <button onClick={handleCreateProposal} disabled={isPending} className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3 rounded-xl transition text-sm font-semibold">
                ➕ Create Test Proposal
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400 font-bold">2</div>
                <h3 className="text-lg font-bold text-slate-200">Yield Investment Vault</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">Deposit your tokenized real-world assets into the smart vault.</p>
                <input type="number" placeholder="Amount in wei" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200" />
              </div>
              <button onClick={handleDeposit} disabled={isPending} className="mt-6 w-full bg-emerald-600 py-3 rounded-xl transition text-sm font-semibold">
                Deposit to Vault
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400 font-bold">3</div>
                <h3 className="text-lg font-bold text-slate-200">DAO Governance voting</h3>
                <input type="text" placeholder="Proposal ID" value={proposalId} onChange={(e) => setProposalId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 mb-3" />
                <select value={supportChoice} onChange={(e) => setSupportChoice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300">
                  <option value="0">Against</option>
                  <option value="1">For</option>
                  <option value="2">Abstain</option>
                </select>
              </div>
              <button onClick={handleVote} disabled={isPending} className="mt-6 w-full bg-purple-600 py-3 rounded-xl transition text-sm font-semibold">
                Submit DAO Vote
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto text-center mt-24 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <h2 className="text-xl font-bold text-slate-200">Connect Your Web3 Wallet</h2>
          <div className="flex justify-center mt-6"><ConnectButton /></div>
        </div>
      )}
    </div>
  );
}