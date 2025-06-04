import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Unauthorized() {
  const { logout } = useAuth();
  
  return (
    <div className="container">
      <h1 className="title">GoJob!</h1>
      <div className="box">
        <h2>Accesso non autorizzato</h2>
        <p>Non hai i permessi per accedere a questa pagina.</p>
        
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/">
            <button style={{ width: '100%' }}>
              Torna alla Home
            </button>
          </Link>
          
          <button 
            onClick={logout} 
            style={{ 
              backgroundColor: '#ef4444',
              width: '100%'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;