import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ReservationProvider } from './contexts/ReservationContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ReservationProvider>
        <App />
      </ReservationProvider>
    </AuthProvider>
  </StrictMode>,
);
