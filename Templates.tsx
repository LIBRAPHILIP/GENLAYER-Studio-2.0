import React from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight,
  Database,
  Cloud,
  Users,
  Lock
} from 'lucide-react';
import { useGenLayer } from '../lib/GenLayerProvider';
import { TEMPLATES_DATA } from '../data/templatesCode';

export const Templates: React.FC = () => {
  const { setCode, setActiveTab } = useGenLayer();

  const useTemplate = (code: string) => {
    setCode(code);
    setActiveTab('ide');
  };

  const getIcon = (id: string) => {
    switch(id) {
      case 'weather': return <Cloud className="text-blue-400" />;
      case 'sentiment': return <Users className="text-emerald-400" />;
      case 'pricing': return <Database className="text-amber-400" />;
      default: return <Lock className="text-rose-400" />;
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto text-white">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-4xl font-bold mb-2">Smart Contract Templates</h2>
          <p className="text-neutral-500">Kickstart your development with community-approved templates.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative text-white">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
            <input 
              type="text" 
              placeholder="Search templates..."
              className="pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors w-64 text-white"
            />
          </div>
          <button className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES_DATA.map((template) => (
          <div 
            key={template.id}
            className="p-8 rounded-[32px] bg-neutral-900/50 border border-neutral-800 hover:border-blue-500/50 transition-all group flex flex-col"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800 group-hover:bg-blue-600/10 transition-colors">
                {getIcon(template.id)}
              </div>
              <span className="px-3 py-1 bg-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {template.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3">{template.title}</h3>
            <p className="text-neutral-500 text-sm leading-relaxed flex-1 mb-8">
              {template.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{template.category}</span>
              <button 
                onClick={() => useTemplate(template.code)}
                className="flex items-center gap-2 text-sm font-bold text-white hover:text-blue-400 transition-colors"
              >
                Use this Template
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border border-blue-500/20 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-lg mb-1">Have a great template idea?</h4>
          <p className="text-sm text-neutral-400">Contribute to the GenLayer ecosystem and earn reputation tokens.</p>
        </div>
        <button className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-colors shadow-lg">
          Submit Template
        </button>
      </div>
    </div>
  );
};
