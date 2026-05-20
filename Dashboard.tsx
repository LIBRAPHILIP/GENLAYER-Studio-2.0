import React from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  Activity, 
  ShieldCheck, 
  Globe,
  Coins,
  Cpu
} from 'lucide-react';
import { useGenLayer } from '../lib/GenLayerProvider';
import { useAccount } from 'wagmi';

export const Dashboard: React.FC = () => {
  const { userProfile, setActiveTab } = useGenLayer();
  const { address } = useAccount();

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-10 text-white">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-light tracking-tight text-white mb-2">
            Welcome back, <span className="font-bold">{userProfile.username}</span>
          </h2>
          <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">
            Identity: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet Not Linked'}
          </p>
        </div>
        <button 
          onClick={() => setActiveTab('ide')}
          className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg"
        >
          <Plus size={20} />
          Create New Contract
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[32px] bg-neutral-900 border border-neutral-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-neutral-800 group-hover:text-blue-500 transition-colors">
            <Activity size={64} />
          </div>
          <div className="relative">
            <p className="text-neutral-500 uppercase text-[10px] font-bold tracking-widest mb-4">Reputation Score</p>
            <h3 className="text-5xl font-bold mb-2">{userProfile.reputation} <span className="text-lg font-light text-neutral-600">GEN</span></h3>
            <p className="text-emerald-500 text-xs flex items-center gap-1">
              <ArrowUpRight size={14} /> +12% this month
            </p>
          </div>
        </div>

        <div className="p-8 rounded-[32px] bg-neutral-900 border border-neutral-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-neutral-800 group-hover:text-emerald-500 transition-colors">
            <ShieldCheck size={64} />
          </div>
          <div className="relative">
            <p className="text-neutral-500 uppercase text-[10px] font-bold tracking-widest mb-4">Live Contracts</p>
            <h3 className="text-5xl font-bold mb-2">{userProfile.contractsDeployed}</h3>
            <p className="text-neutral-600 text-xs italic">All systems operational</p>
          </div>
        </div>

        <div className="p-8 rounded-[32px] bg-blue-600 shadow-2xl shadow-blue-900/40 relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 p-8 text-blue-500 group-hover:text-white/20 transition-colors">
            <Coins size={64} />
          </div>
          <div className="relative">
            <p className="text-white/60 uppercase text-[10px] font-bold tracking-widest mb-4">Wallet Balance</p>
            <h3 className="text-5xl font-bold mb-2">1,240 <span className="text-lg font-light text-white/60">GEN</span></h3>
            <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">
              Manage Assets
            </button>
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Globe size={20} className="text-blue-500" />
          Network Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between hover:bg-neutral-900 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                  <Cpu size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Proposal #{1024 + i}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">0x71C...492a</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-500">Executing</p>
                <p className="text-[10px] text-neutral-600">2 mins ago</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
