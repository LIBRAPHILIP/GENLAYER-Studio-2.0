import './shield';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { Web3Provider } from './lib/Web3Provider';
import { GenLayerProvider } from './lib/GenLayerProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <GenLayerProvider>
        <App />
      </GenLayerProvider>
    </Web3Provider>
  </StrictMode>,
);


