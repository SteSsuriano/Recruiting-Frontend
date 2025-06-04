import { useState } from 'react';
import { setToken, setUserType, setProfileId } from './apiClient';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

function RegisterForm({ userType }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const API_URL = 'http://localhost:1337';
  
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    partitaIVA: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Implementazione diretta della registrazione (senza passare per apiClient)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugInfo('');
    
    try {
      setDebugInfo('Iniziando il processo di registrazione...');
      
      // Step 1: Registrare l'utente
      const userResponse = await fetch(`${API_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email,
          email: formData.email,
          password: formData.password,
        }),
      });

      const userResult = await userResponse.json();
      setDebugInfo(prevDebug => prevDebug + '\nRisposta registrazione utente: ' + JSON.stringify(userResult));
      
      if (userResult.error) {
        setError(userResult.error.message || JSON.stringify(userResult.error));
        setDebugInfo(prevDebug => prevDebug + '\nErrore dalla risposta: ' + JSON.stringify(userResult.error));
        setLoading(false);
        return;
      }
      
      // Step 2: Creare il profilo (candidato o azienda)
      let profileEndpoint, profileData, profileType;
      
      if (userType === 'candidato') {
        profileEndpoint = `${API_URL}/api/candidates`;
        profileData = {
          data: {
            nomeCandidato: formData.nome,
            cognomeCandidato: formData.cognome,
            emailCandidato: formData.email
          }
        };
        profileType = 'candidato';
      } else {
        profileEndpoint = `${API_URL}/api/aziendas`;
        profileData = {
          data: {
            nomeAzienda: formData.nome,
            partitaIva: formData.partitaIVA,
            emailAzienda: formData.email
          }
        };
        profileType = 'azienda';
      }
      
      setDebugInfo(prevDebug => prevDebug + '\n\nDati per la creazione del profilo: ' + JSON.stringify(profileData));
      
      const profileResponse = await fetch(profileEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userResult.jwt}`
        },
        body: JSON.stringify(profileData)
      });
      
      // Ottieni il testo della risposta prima di elaborarlo
      const profileResponseText = await profileResponse.text();
      setDebugInfo(prevDebug => prevDebug + '\n\nRisposta dal server: ' + profileResponseText);
      
      if (!profileResponse.ok) {
        setError(`Errore nella creazione del profilo: ${profileResponse.status} ${profileResponseText}`);
        setDebugInfo(prevDebug => prevDebug + '\n\nErrore nella creazione del profilo: ' + profileResponseText);
        setLoading(false);
        return;
      }
      
      // Converti la risposta in JSON
      let profileResult;
      try {
        profileResult = JSON.parse(profileResponseText);
      } catch (e) {
        setError('Errore nel parsing della risposta JSON');
        setDebugInfo(prevDebug => prevDebug + '\n\nErrore nel parsing della risposta JSON: ' + e.message);
        setLoading(false);
        return;
      }
      
      // Step 3: Completare la registrazione
      setToken(userResult.jwt);
      setUserType(profileType);
      setProfileId(profileResult.data.id);
      
      login(userResult.user, profileType, profileResult.data.id);
      
      setSuccess(true);
      setDebugInfo(prevDebug => prevDebug + '\n\nRegistrazione completata con successo. Reindirizzamento...');
      
      // Reindirizza l'utente alla dashboard appropriata
      setTimeout(() => {
        navigate(`/dashboard/${profileType}`);
      }, 2000);
      
    } catch (err) {
      setError('Si è verificato un errore durante la registrazione');
      setDebugInfo(prevDebug => prevDebug + '\n\nErrore catturato: ' + (err.message || JSON.stringify(err)));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Registrazione per {userType}</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '1rem' }}>Registrazione completata con successo!</div>}
      
      <form onSubmit={handleSubmit}>
        {/* Campo nome (per entrambi) */}
        <input 
          type="text" 
          name="nome"
          placeholder={userType === 'candidato' ? "Nome" : "Nome Azienda"} 
          value={formData.nome}
          onChange={handleChange}
          required 
          style={{ display: 'block', margin: '0.5rem auto' }} 
        />
        
        {/* Campo cognome (solo per candidati) o partita IVA (solo per aziende) */}
        {userType === 'candidato' ? (
          <input 
            type="text" 
            name="cognome"
            placeholder="Cognome" 
            value={formData.cognome}
            onChange={handleChange}
            required 
            style={{ display: 'block', margin: '0.5rem auto' }} 
          />
        ) : (
          <input 
            type="text" 
            name="partitaIVA"
            placeholder="Partita IVA" 
            value={formData.partitaIVA}
            onChange={handleChange}
            required 
            style={{ display: 'block', margin: '0.5rem auto' }} 
          />
        )}
        
        {/* Campo email (per entrambi) */}
        <input 
          type="email" 
          name="email"
          placeholder="Email" 
          value={formData.email}
          onChange={handleChange}
          required 
          style={{ display: 'block', margin: '0.5rem auto' }} 
        />
        
        {/* Campo password (per entrambi) */}
        <input 
          type="password" 
          name="password"
          placeholder="Password" 
          value={formData.password}
          onChange={handleChange}
          required 
          style={{ display: 'block', margin: '0.5rem auto' }} 
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Caricamento...' : 'Registrati'}
        </button>
      </form>
      
      {/* Informazioni di debug */}
      {debugInfo && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}>
          <strong>Informazioni di debug:</strong>
          <pre>{debugInfo}</pre>
        </div>
      )}
    </div>
  );
}

export default RegisterForm;