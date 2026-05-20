import React from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, type AppKitNetwork } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

// 1. Get projectId at https://cloud.reown.com
// @ts-ignore
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '62c7f09e148bcfecee090e0f7d38244e';

if (!projectId) {
  console.warn('WalletConnect Project ID is missing. Please add it to your .env file.');
}

// 2. Create Testnet Configuration (GenLayer Testnet)
const genLayerTestnet: AppKitNetwork = {
  id: 4221,
  name: 'GenLayer Testnet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.genlayer.io'] },
  },
  blockExplorers: {
    default: { name: 'GenScan', url: 'https://explorer.testnet.genlayer.io' },
  },
  testnet: true
};

// 3. Create modal
const metadata = {
  name: 'GenLayer Studio',
  description: 'Intelligent Contract IDE',
  url: typeof window !== 'undefined' && window.location ? window.location.origin : 'https://genlayer.io',
  icons: ['https://avatars.githubusercontent.com/u/17922993']
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [genLayerTestnet, mainnet, arbitrum];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  // @ts-ignore
  enableVerify: false, // Bypass origin domain authorization check for sandboxed previews
  features: {
    analytics: true
  }
});

const queryClient = new QueryClient();

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
