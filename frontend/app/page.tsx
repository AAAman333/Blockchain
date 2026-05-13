'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">RWA Tokenization Platform</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <p className="mb-4 text-gray-600">Connect your wallet to start</p>
        <ConnectButton />
      </div>
    </div>
  );
}