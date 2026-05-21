import React, { createContext, useContext, useState } from 'react';

type Tab = 'dashboard' | 'ide' | 'governance' | 'faucet' | 'templates' | 'docs' | 'profile';

interface SimulationResult {
  id: string;
  contractName: string;
  status: 'success' | 'failure';
  timestamp: string;
  logs: string[];
  type?: 'simulation' | 'deployment';
  txHash?: string;
  gasUsed?: string;
  contractAddress?: string;
}

interface GenLayerContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  code: string;
  setCode: (code: string) => void;
  simulationHistory: SimulationResult[];
  addSimulation: (result: SimulationResult) => void;
  userProfile: {
    username: string;
    reputation: number;
    contractsDeployed: number;
  };
}

const GenLayerContext = createContext<GenLayerContextType | undefined>(undefined);

export const GenLayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [code, setCode] = useState<string>(`# Welcome to GenLayer Intelligent Contracts
# Define your contract logic here...

from genlayer import IntelligentContract

class MyContract(IntelligentContract):
    def __init__(self):
        super().__init__()
        self.message = "Hello GenLayer"

    def update_message(self, new_message: str):
        self.message = new_message
`);
  const [simulationHistory, setSimulationHistory] = useState<SimulationResult[]>([]);
  const [userProfile] = useState({
    username: 'Developer#001',
    reputation: 100,
    contractsDeployed: 5,
  });

  const addSimulation = (result: SimulationResult) => {
    setSimulationHistory(prev => [result, ...prev]);
  };

  return (
    <GenLayerContext.Provider value={{ 
      activeTab, 
      setActiveTab, 
      code, 
      setCode, 
      simulationHistory, 
      addSimulation,
      userProfile
    }}>
      {children}
    </GenLayerContext.Provider>
  );
};

export const useGenLayer = () => {
  const context = useContext(GenLayerContext);
  if (!context) throw new Error('useGenLayer must be used within GenLayerProvider');
  return context;
};
