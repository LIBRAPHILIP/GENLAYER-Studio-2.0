import React from 'react';
import { 
  User, 
  Settings, 
  Database, 
  ShieldCheck, 
  Award,
  Code2,
  Lock
} from 'lucide-react';
import { useGenLayer } from '../lib/GenLayerProvider';
import { useAccount } from 'wagmi';
import { ApiKeyManager } from './ApiKeyManager';

export const Profile: React.FC = () => {
  const { userProfile } = useGenLayer();
  const { address } = useAccount();

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-10 text-white">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-emerald-600" />
        <div className="px-10 pb-10 relative">
          <div className="absolute -top-12 left-10">
            <div className="w-24 h-24 bg-neutral-950 border-4 border-neutral-900 rounded-3xl flex items-center justify-center text-white">
              <User size={48} />
            </div>
          </div>
          
          <div className="pt-16 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-1">{userProfile.username}</h2>
              <p className="text-neutral-500 font-mono text-sm">{address || "Not connected"}</p>
            </div>
            <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-colors">
              <Settings size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="p-4 rounded-2xl bg-black/40 border border-neutral-800">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Reputation</p>
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <span className="text-xl font-bold">{userProfile.reputation}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-neutral-800">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Contracts</p>
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-blue-400" />
                <span className="text-xl font-bold">{userProfile.contractsDeployed}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-neutral-800">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Storage Used</p>
              <div className="flex items-center gap-2">
                <Database size={18} className="text-emerald-400" />
                <span className="text-xl font-bold">1.2 MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Lock size={20} className="text-blue-500" />
          Cloud-Native Cryptographic Key Vault
        </h3>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
          Genlayer Hub integrates with secure hardware security modules and distributed vaults (e.g., HashiCorp Vault) to encrypt your oracle, consensus, and off-chain data provider parameters. These values never touch public block explorers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ApiKeyManager 
            service="openweather_api_key" 
            label="OpenWeather API Key" 
            placeholder="e.g., 4a8ca0b1c2..."
            description="Weather data providers require authenticated requests. Sealed keys are parsed server-side."
          />
          <ApiKeyManager 
            service="chainlink_oracle_key" 
            label="Chainlink Node Key" 
            placeholder="e.g., node_sec_8ca2b0..."
            description="Required for cross-chain communications and custom off-chain secure messaging."
          />
        </div>
      </section>
    </div>
  );
};
