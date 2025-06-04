// ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const ProtectedRoute = ({ userType }) => {
  const { user, loading } = useAuth();

  // Mostra un loader mentre verifichiamo l'autenticazione
  if (loading) {
    return <div>Caricamento...</div>;
  }

  // Se l'utente non è autenticato, reindirizza alla pagina di login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Se è specificato un tipo di utente, controlla che l'utente corrente sia del tipo richiesto
  if (userType && user.userType !== userType) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Se l'utente è autenticato e del tipo corretto, mostra i contenuti della rotta
  return <Outlet />;
};

export default ProtectedRoute;