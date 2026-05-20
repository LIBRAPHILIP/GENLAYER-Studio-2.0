import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  Vote, 
  Droplets, 
  Library, 
  BookOpen, 
  User,
  Zap,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { useGenLayer } from '../lib/GenLayerProvider';
import { cn } from '../lib/utils';
import { useAccount } from 'wagmi';

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
        : "text-neutral-500 hover:text-white hover:bg-neutral-900"
    )}
  >
    <span className={cn(
      "transition-colors duration-200",
      active ? "text-blue-400" : "text-neutral-500 group-hover:text-white"
    )}>
      {icon}
    </span>
    <span className="font-medium text-sm">{label}</span>
    {active && <ChevronRight className="ml-auto w-4 h-4" />}
  </button>
);

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useGenLayer();
  const { isConnected } = useAccount();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'ide', label: 'Intelligent IDE', icon: <Code2 size={20} /> },
    { id: 'governance', label: 'Governance', icon: <Vote size={20} /> },
    { id: 'faucet', label: 'GEN Faucet', icon: <Droplets size={20} /> },
    { id: 'templates', label: 'Templates', icon: <Library size={20} /> },
    { id: 'docs', label: 'Documentation', icon: <BookOpen size={20} /> },
  ];

  return (
    <aside className="w-64 border-r border-neutral-900 flex flex-col bg-black/50 backdrop-blur-xl h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="text-white fill-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">GenLayer</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Studio v1.0.0</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id as any)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-900">
        <NavItem
          id="profile"
          label="Developer Profile"
          icon={<User size={20} />}
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
        
        <div className="mt-4 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-700"
            )} />
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-tighter">
              {isConnected ? 'Network Connected' : 'Disconnected'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-600 font-mono">GenLayer Testnet (4221)</p>
        </div>
      </div>
    </aside>
  );
};
