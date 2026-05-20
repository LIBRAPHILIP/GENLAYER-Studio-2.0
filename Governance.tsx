import React from 'react';
import { 
  Vote, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Governance: React.FC = () => {
  const proposals = [
    {
      id: "GLP-142",
      title: "Update AI Consensus Verification Threshold",
      status: "Active",
      votes: { for: 82, against: 18 },
      endsIn: "2 days"
    },
    {
      id: "GLP-141",
      title: "Integrate weather-api-v2 as standard package",
      status: "Passed",
      votes: { for: 95, against: 5 },
      recent: true
    },
    {
      id: "GLP-140",
      title: "Decrease minimum reputation for DAO creation",
      status: "Failed",
      votes: { for: 40, against: 60 }
    }
  ];

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-10">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-bold mb-2">Governance Dashboard</h2>
          <p className="text-neutral-500">Shape the future of GenLayer through decentralized proposals.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
          <Plus size={20} />
          New Proposal
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-3 text-neutral-500 mb-4">
            <Users size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Voters</span>
          </div>
          <h4 className="text-3xl font-bold">12,402</h4>
          <p className="text-xs text-neutral-600 mt-2">+430 this week</p>
        </div>
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-3 text-neutral-500 mb-4">
            <BarChart3 size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Proposals</span>
          </div>
          <h4 className="text-3xl font-bold">1,402</h4>
          <p className="text-xs text-neutral-600 mt-2">v0.8.4 Network Stage</p>
        </div>
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-3 text-neutral-500 mb-4">
            <TrendingUp size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Voter Participation</span>
          </div>
          <h4 className="text-3xl font-bold">68.4%</h4>
          <div className="w-full h-1 bg-neutral-800 rounded-full mt-4 overflow-hidden">
            <div className="w-[68%] h-full bg-blue-500" />
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Vote size={20} className="text-blue-500" />
          Active & Recent Proposals
        </h3>
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={p.id} className="p-6 rounded-[24px] bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border",
                  p.status === 'Active' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' :
                  p.status === 'Passed' ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' :
                  'bg-rose-600/10 border-rose-500/20 text-rose-400'
                )}>
                  {p.status === 'Active' ? <Clock size={24} /> :
                   p.status === 'Passed' ? <CheckCircle2 size={24} /> :
                   <XCircle size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-mono text-neutral-500">{p.id}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                      p.status === 'Active' ? 'bg-blue-600/10 text-blue-400' :
                      p.status === 'Passed' ? 'bg-emerald-600/10 text-emerald-400' :
                      'bg-rose-600/10 text-rose-400'
                    )}>
                      {p.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{p.title}</h4>
                </div>
              </div>

              <div className="flex gap-8 items-center">
                <div className="text-right">
                  <div className="flex items-center gap-4 text-xs font-bold mb-1">
                    <span className="text-emerald-400">FOR {p.votes.for}%</span>
                    <span className="text-rose-400">AGAINST {p.votes.against}%</span>
                  </div>
                  <div className="w-48 h-1.5 bg-neutral-800 rounded-full flex overflow-hidden">
                    <div style={{ width: `${p.votes.for}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${p.votes.against}%` }} className="bg-rose-500" />
                  </div>
                </div>
                {p.endsIn && (
                  <div className="text-right border-l border-neutral-800 pl-8">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase">Ends In</p>
                    <p className="font-bold text-blue-400">{p.endsIn}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
