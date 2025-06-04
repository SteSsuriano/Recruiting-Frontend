import { createContext, useState, useEffect, useContext } from 'react';
import { getToken, getUserType, getProfileId } from './apiClient';

const API_URL = 'http://localhost:1337';

// Contesto di autenticazione
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserTypeState] = useState(null);
  const [profileId, setProfileIdState] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    console.log('=== LOGOUT ===');
    
    // Rimuovi tutti i dati dal localStorage
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('profileId');
    localStorage.removeItem('user');
    localStorage.removeItem('candidateDocumentId');
    localStorage.removeItem('aziendaDocumentId');
    
    // Reset degli stati
    setUser(null);
    setUserTypeState(null);
    setProfileIdState(null);
    
    console.log('Logout completato');
  };

  useEffect(() => {
    // Verifica se esiste un token al caricamento dell'app
    const fetchUser = async () => {
      try {
        console.log('=== CARICAMENTO SESSIONE ===');
        
        const token = getToken();
        const storedUserType = getUserType();
        const storedProfileId = getProfileId();
        
        console.log('Token presente:', !!token);
        console.log('UserType salvato:', storedUserType);
        console.log('ProfileId salvato:', storedProfileId);
        
        // Controlla anche se abbiamo salvato i dati utente
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser && storedUserType) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('Dati utente salvati:', userData);
            
            // Verifica se il token è ancora valido
            const response = await fetch(`${API_URL}/api/users/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const currentUser = await response.json();
              console.log('✅ Token valido, utente verificato:', currentUser);
              
              // Ripristina la sessione
              setUser({
                ...currentUser,
                jwt: token // Assicuriamoci che il JWT sia incluso
              });
              setUserTypeState(storedUserType);
              setProfileIdState(storedProfileId);
              
              console.log('✅ Sessione ripristinata con successo');
            } else {
              console.log('❌ Token non valido, eseguo logout');
              logout();
            }
          } catch (error) {
            console.error('❌ Errore durante il recupero dei dati utente:', error);
            logout();
          }
        } else {
          console.log('❌ Dati sessione incompleti');
          console.log('Token:', !!token);
          console.log('SavedUser:', !!savedUser);
          console.log('StoredUserType:', storedUserType);
          
          // Se mancano dati essenziali, pulisci tutto
          if (token || savedUser || storedUserType) {
            console.log('Pulizia dati sessione incompleti...');
            logout();
          }
        }
      } catch (error) {
        console.error('❌ Errore durante il caricamento della sessione:', error);
        logout();
      }
      
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = (userData, type, id) => {
    console.log('=== LOGIN ===');
    console.log('Login chiamato con:', { 
      userData: userData.username, 
      type, 
      id,
      hasJWT: !!userData.jwt 
    });
    
    // Assicurati che il JWT sia presente
    if (!userData.jwt) {
      console.error('❌ JWT mancante nei dati utente');
      return;
    }
    
    try {
      // Salva TUTTI i dati nel localStorage in modo consistente
      localStorage.setItem('jwtToken', userData.jwt);
      localStorage.setItem('userType', type);
      localStorage.setItem('profileId', id);
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        jwt: userData.jwt
      }));
      
      console.log('✅ Dati salvati nel localStorage:');
      console.log('- jwtToken:', !!localStorage.getItem('jwtToken'));
      console.log('- userType:', localStorage.getItem('userType'));
      console.log('- profileId:', localStorage.getItem('profileId'));
      console.log('- user:', !!localStorage.getItem('user'));
      
      // Aggiorna gli stati
      setUser(userData);
      setUserTypeState(type);
      setProfileIdState(id);
      
      console.log('✅ Login completato con successo');
    } catch (error) {
      console.error('❌ Errore durante il salvataggio della sessione:', error);
    }
  };

  // Funzione per verificare se l'utente è autenticato
  const isAuthenticated = () => {
    return !!(user && userType && getToken());
  };

  // Funzione per ottenere il token corrente
  const getCurrentToken = () => {
    return getToken();
  };

  // Debug: mostra stato corrente
  useEffect(() => {
    if (!loading) {
      console.log('=== STATO AUTH CONTEXT ===');
      console.log('User:', user?.username);
      console.log('UserType:', userType);
      console.log('ProfileId:', profileId);
      console.log('IsAuthenticated:', isAuthenticated());
      console.log('Token presente:', !!getCurrentToken());
    }
  }, [user, userType, profileId, loading]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userType, 
      profileId, 
      login, 
      logout, 
      loading,
      isAuthenticated,
      getCurrentToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider');
  }
  return context;
};