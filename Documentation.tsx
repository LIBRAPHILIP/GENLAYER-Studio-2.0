import React from 'react';
import { 
  FileText, 
  HelpCircle, 
  Github, 
  MessageSquare,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const Documentation: React.FC = () => {
  const sections = [
    {
      title: 'Getting Started',
      items: ['What is GenLayer?', 'Installation Guide', 'Your First Intelligent Contract', 'Common Patterns']
    },
    {
      title: 'SDK References',
      items: ['Python SDK', 'JavaScript SDK', 'Viem Extension', 'Wagmi Integration']
    },
    {
      title: 'Intelligent Logic',
      items: ['Understanding AI Consensus', 'Deterministic AI Proofs', 'External API Handling', 'Security Best Practices']
    }
  ];

  return (
    <div className="flex h-full text-white">
      <div className="w-64 border-r border-neutral-900 overflow-y-auto p-6 space-y-8 bg-black/20">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
          <input 
            type="text" 
            placeholder="Search docs..."
            className="w-full pl-8 pr-4 py-1.5 bg-neutral-900 rounded-lg text-xs focus:outline-none text-white"
          />
        </div>

        {sections.map((section, idx) => (
          <div key={idx}>
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">
              {section.title}
            </h4>
            <ul className="space-y-3">
              {section.items.map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center justify-between group">
                    {item}
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-12 max-w-4xl">
        <h1 className="text-5xl font-bold mb-6">Building The Future</h1>
        <p className="text-lg text-neutral-400 mb-12 leading-relaxed">
          GenLayer is the first blockchain designed to host Intelligent Contracts. 
          By integrating Large Language Models directly into the consensus mechanism, 
          we allow developers to build dApps that can reason, verify external data, 
          and make autonomous decisions based on human-readable logic.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">API References</h3>
            <p className="text-sm text-neutral-500 mb-6">Deep dive into the core primitives of Intelligent Contracts and AI consensus.</p>
            <button className="text-blue-400 font-bold text-sm flex items-center gap-2 hover:underline">
              Explore SDKs <ChevronRight size={16} />
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all">
            <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
              <HelpCircle size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Tutorials</h3>
            <p className="text-sm text-neutral-500 mb-6">Step-by-step guides to build anything from a simple DAO to a complex AI agent.</p>
            <button className="text-emerald-400 font-bold text-sm flex items-center gap-2 hover:underline">
              Start Learning <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <section className="p-10 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <h4 className="text-2xl font-bold mb-2">Need Help?</h4>
            <p className="text-neutral-500">Join our community of builders and researchers.</p>
            <div className="flex gap-6 mt-6">
              <a href="#" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
                <Github size={18} /> GitHub
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
                <MessageSquare size={18} /> Discord
              </a>
            </div>
          </div>
          <button className="bg-white text-black p-4 rounded-xl flex items-center justify-center">
            <ExternalLink size={24} />
          </button>
        </section>
      </div>
    </div>
  );
};
