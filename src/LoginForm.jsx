import { useState } from 'react';
import { login, setToken, setUserType, setProfileId } from './apiClient';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginForm({ userType }) {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('=== INIZIO LOGIN DEBUG ===');
    console.log('UserType selezionato:', userType);
    console.log('Form data:', { email: formData.email, password: '***' });
    
    try {
      const { email, password } = formData;
      console.log('🔄 Chiamando login API...');
      
      const response = await login(email, password);
      console.log('📦 Risposta login:', response);
      
      if (response.error) {
        console.log('❌ Errore dal server:', response.error);
        setError(response.error.message);
      } else {
        console.log('✅ Login API success');
        console.log('Response userType:', response.userType);
        console.log('Selected userType:', userType);
        console.log('Match:', response.userType === userType);
        
        // Verifica se l'utente è del tipo corretto (candidato o azienda)
        if ((userType === 'candidato' && response.userType === 'candidato') || 
            (userType === 'azienda' && response.userType === 'azienda')) {
          
          console.log('✅ Tipo utente corretto');
          console.log('JWT Token:', response.jwt ? 'PRESENTE' : 'MANCANTE');
          console.log('Profile:', response.profile);
          
          // Salva il token JWT e i dati dell'utente nel localStorage
          setToken(response.jwt);
          setUserType(response.userType);
          setProfileId(response.profile.id);
          
          console.log('💾 Dati salvati in localStorage');
          console.log('- Token:', !!localStorage.getItem('jwtToken'));
          console.log('- UserType:', localStorage.getItem('userType'));
          console.log('- ProfileId:', localStorage.getItem('profileId'));
          
          // Aggiorna il contesto di autenticazione
          console.log('🔄 Chiamando authLogin...');
          authLogin(response.user, response.userType, response.profile.id);
          
          setSuccess(true);
          
          console.log(`🚀 Preparando redirect a /dashboard/${userType}`);
          
          // Reindirizza l'utente alla dashboard appropriata
          setTimeout(() => {
            console.log(`🔄 Eseguendo navigate a /dashboard/${userType}`);
            navigate(`/dashboard/${userType}`);
          }, 1000);
        } else {
          console.log('❌ Tipo utente non corrispondente');
          console.log(`Richiesto: ${userType}, Ricevuto: ${response.userType}`);
          setError(`Questo account non è registrato come ${userType}`);
        }
      }
    } catch (err) {
      console.error('❌ Errore catch login:', err);
      setError('Si è verificato un errore durante il login');
    } finally {
      setLoading(false);
      console.log('=== FINE LOGIN DEBUG ===');
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Login per {userType}</h3>
      
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          color: 'green', 
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '4px'
        }}>
          Login effettuato con successo! Reindirizzamento in corso...
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          name="email"
          placeholder="Email" 
          value={formData.email}
          onChange={handleChange}
          required 
          disabled={loading}
          style={{ 
            display: 'block', 
            margin: '0.5rem auto',
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }} 
        />
        
        <input 
          type="password" 
          name="password"
          placeholder="Password" 
          value={formData.password}
          onChange={handleChange}
          required 
          disabled={loading}
          style={{ 
            display: 'block', 
            margin: '0.5rem auto',
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }} 
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            display: 'block',
            margin: '1.5rem auto 0 auto',
            padding: '0.75rem 2rem',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease'
          }}
        >
          {loading ? '⏳ Accesso in corso...' : '🚪 Accedi'}
        </button>
      </form>
      
      {/* Informazioni di debug durante il loading */}
      {loading && (
        <div style={{ 
          marginTop: '1rem', 
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          <p>Verificando credenziali...</p>
          <p>Tipo utente: {userType}</p>
        </div>
      )}
    </div>
  );
}

export default LoginForm;