import React from 'react';
import { Sidebar } from './components/Sidebar';
import { useGenLayer } from './lib/GenLayerProvider';
import { Dashboard } from './components/Dashboard';
import { IDE } from './components/IDE';
import { Governance } from './components/Governance';
import { Faucet } from './components/Faucet';
import { Templates } from './components/Templates';
import { Documentation } from './components/Documentation';
import { Profile } from './components/Profile';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { Wallet } from 'lucide-react';

function App() {
  const { activeTab } = useGenLayer();
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'ide': return <IDE />;
      case 'governance': return <Governance />;
      case 'faucet': return <Faucet />;
      case 'templates': return <Templates />;
      case 'docs': return <Documentation />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-black text-white selection:bg-blue-500/30">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-md flex items-center justify-end px-8 gap-4 z-15 shrink-0">
          {/* Sandbox Indicator Warning Badglet */}
          <div className="group relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-bold rounded-full cursor-help hover:bg-yellow-500/20 transition-all select-none">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              AppKit Sandbox Status
            </div>
            
            <div className="absolute right-0 top-9 w-80 p-5 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 ease-out z-50 text-xs leading-relaxed space-y-3">
              <div className="flex items-center gap-2 text-yellow-500 font-bold border-b border-neutral-800 pb-1.5">
                <span>Domain Verification Shield</span>
              </div>
              <p className="text-neutral-400">
                You are currently building on a dynamic sandboxed domain: <code className="bg-black/60 px-1 py-0.5 rounded text-blue-400 font-mono text-[10px] select-all break-all">{typeof window !== "undefined" ? window.location.origin : "sandbox"}</code>
              </p>
              <p className="text-neutral-400">
                If the Wallet modal fails to connect, it is due to Reown Cloud's origin restrictions.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[10.5px] space-y-2">
                <p className="font-bold text-white uppercase tracking-wider">To authorize this sandbox:</p>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                  <li>Get a free Project ID at <a href="https://cloud.reown.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 underline inline">cloud.reown.com</a></li>
                  <li>In Reown Cloud, disable "Domain Verification", or add the sandbox URL</li>
                  <li>Set key <code className="bg-neutral-900 px-1 rounded text-white font-mono text-[10px]">VITE_WALLETCONNECT_PROJECT_ID</code> in AI Studio settings</li>
                </ol>
              </div>
            </div>
          </div>

          {!isConnected ? (
            <button 
              onClick={() => open()}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              <Wallet size={14} />
              Connect Wallet
            </button>
          ) : (
            <button 
              onClick={() => open()}
              className="flex items-center gap-2 px-4 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-full text-xs font-mono transition-all"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto bg-neutral-950/20 relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
