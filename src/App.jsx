

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Home from './Home';
import CandidateDashboard from './CandidateDashboard';
import AziendaDashboard from './AziendaDashboard';
import Unauthorized from './Unauthorized';
import './App.css';

// Componente per le rotte protette - VERSIONE DEBUG
const ProtectedRoute = ({ userType, children }) => {
  const { user, userType: currentUserType, loading } = useAuth();

  console.log('=== PROTECTED ROUTE DEBUG ===');
  console.log('User:', user);
  console.log('Current UserType:', currentUserType);
  console.log('Required UserType:', userType);
  console.log('Loading:', loading);
  console.log('Is Authenticated:', !!user);

  // Mostra un loader mentre verifichiamo l'autenticazione
  if (loading) {
    console.log('🟡 Mostrando loader...');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Caricamento...</div>
        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
          Debug: User={user?.username}, Type={currentUserType}, Loading={loading ? 'SI' : 'NO'}
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato, reindirizza alla home
  if (!user) {
    console.log('❌ Utente non autenticato, redirect a home');
    return <Navigate to="/" replace />;
  }

  // Se è specificato un tipo di utente, controlla che l'utente corrente sia del tipo richiesto
  if (userType && currentUserType !== userType) {
    console.log(`❌ Tipo utente errato. Richiesto: ${userType}, Attuale: ${currentUserType}`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Accesso autorizzato');
  // Se l'utente è autenticato e del tipo corretto, mostra il contenuto
  return children;
};

function App() {
  const { user, userType, loading } = useAuth();

  console.log('=== APP COMPONENT DEBUG ===');
  console.log('User:', user);
  console.log('UserType:', userType);
  console.log('Loading:', loading);

  // Mentre carichiamo i dati utente, mostra un loader
  if (loading) {
    console.log('🟡 App in loading state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Caricamento applicazione...</div>
        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
          Verificando autenticazione...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Home page (login/registrazione) */}
      <Route 
        path="/" 
        element={
          // Se l'utente è già autenticato, reindirizza alla dashboard
          user ? (
            (() => {
              console.log(`🔄 Utente autenticato, redirect a dashboard ${userType}`);
              return (
                <Navigate 
                  to={userType === 'candidato' ? '/dashboard/candidato' : '/dashboard/azienda'} 
                  replace 
                />
              );
            })()
          ) : (
            (() => {
              console.log('🏠 Mostrando Home page');
              return <Home />;
            })()
          )
        } 
      />
      
      {/* Dashboard candidato (protetta) */}
      <Route 
        path="/dashboard/candidato" 
        element={
          <ProtectedRoute userType="candidato">
            <CandidateDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Dashboard azienda (protetta) */}
      <Route 
        path="/dashboard/azienda" 
        element={
          <ProtectedRoute userType="azienda">
            <AziendaDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Pagina di accesso non autorizzato */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Gestione delle rotte non esistenti */}
      <Route 
        path="*" 
        element={
          (() => {
            console.log('🔄 Rotta non trovata, redirect a home');
            return <Navigate to="/" replace />;
          })()
        } 
      />
    </Routes>
  );
}

export default App;