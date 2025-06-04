// apiClient.js - Versione corretta con fix per il login candidato

const API_URL = 'http://localhost:1337';

// Gestione del token JWT
export const getToken = () => localStorage.getItem('jwtToken');
export const setToken = (token) => localStorage.setItem('jwtToken', token);
export const removeToken = () => localStorage.removeItem('jwtToken');

// Gestione del tipo di utente
export const getUserType = () => localStorage.getItem('userType');
export const setUserType = (userType) => localStorage.setItem('userType', userType);

// Gestione dell'ID del profilo
export const getProfileId = () => localStorage.getItem('profileId');
export const setProfileId = (profileId) => localStorage.setItem('profileId', profileId);

// Login function - VERSIONE CORRETTA
export const login = async (email, password) => {
  try {
    console.log('=== INIZIO LOGIN API ===');
    console.log('Email:', email);
    
    // Step 1: Autenticazione dell'utente
    const response = await fetch(`${API_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: email,
        password: password,
      }),
    });

    const result = await response.json();
    console.log('Risposta autenticazione:', result);

    if (!response.ok || result.error) {
      console.log('❌ Errore autenticazione:', result.error);
      return { error: result.error || { message: 'Errore durante il login' } };
    }

    // Step 2: Determina il tipo di utente cercando nei profili
    console.log('🔍 Determinando tipo utente per:', email);
    
    const userType = await determineUserType(email, result.jwt);
    console.log('Tipo utente determinato:', userType);
    
    if (!userType.found) {
      console.log('❌ Nessun profilo trovato per questo utente');
      return { error: { message: 'Nessun profilo associato a questo account' } };
    }

    // Step 3: Prepara la risposta completa
    const loginResponse = {
      jwt: result.jwt,
      user: {
        ...result.user,
        jwt: result.jwt // Assicurati che il JWT sia incluso nell'oggetto user
      },
      userType: userType.type, // ⭐ QUESTO ERA IL CAMPO MANCANTE
      profile: userType.profile
    };

    console.log('✅ Login completato con successo:', {
      email: email,
      userType: loginResponse.userType,
      profileId: loginResponse.profile?.id
    });

    return loginResponse;

  } catch (error) {
    console.error('❌ Errore durante il login:', error);
    return { error: { message: 'Si è verificato un errore durante il login' } };
  }
};

// Funzione per determinare il tipo di utente - VERSIONE MIGLIORATA
async function determineUserType(email, jwt) {
  console.log('🔍 Ricerca profilo per email:', email);
  
  try {
    // Cerca prima nei candidati
    console.log('🔎 Cerco nei candidati...');
    const candidateResponse = await fetch(`${API_URL}/api/candidates?filters[emailCandidato][$eq]=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });

    if (candidateResponse.ok) {
      const candidateData = await candidateResponse.json();
      console.log('Risposta candidati:', candidateData);
      
      if (candidateData.data && candidateData.data.length > 0) {
        console.log('✅ Trovato profilo candidato');
        return {
          found: true,
          type: 'candidato',
          profile: candidateData.data[0]
        };
      }
    }

    // Se non trovato nei candidati, cerca nelle aziende
    console.log('🔎 Cerco nelle aziende...');
    const aziendaResponse = await fetch(`${API_URL}/api/aziendas?filters[emailAzienda][$eq]=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });

    if (aziendaResponse.ok) {
      const aziendaData = await aziendaResponse.json();
      console.log('Risposta aziende:', aziendaData);
      
      if (aziendaData.data && aziendaData.data.length > 0) {
        console.log('✅ Trovato profilo azienda');
        return {
          found: true,
          type: 'azienda',
          profile: aziendaData.data[0]
        };
      }
    }

    console.log('❌ Nessun profilo trovato per questa email');
    return { found: false };

  } catch (error) {
    console.error('❌ Errore nella ricerca del profilo:', error);
    return { found: false };
  }
}

// Register function
export const register = async (userData, userType) => {
  try {
    console.log('Registrando utente:', userData, 'come:', userType);
    
    // Registra l'utente in Strapi
    const userResponse = await fetch(`${API_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.email,
        email: userData.email,
        password: userData.password,
      }),
    });

    const userResult = await userResponse.json();
    
    if (userResult.error) {
      return { error: userResult.error };
    }

    // Crea il profilo specifico (candidato o azienda)
    let profileEndpoint, profileData;
    
    if (userType === 'candidato') {
      profileEndpoint = `${API_URL}/api/candidates`;
      profileData = {
        data: {
          nomeCandidato: userData.nome,
          cognomeCandidato: userData.cognome,
          emailCandidato: userData.email,
          user: userResult.user.id
        }
      };
    } else {
      profileEndpoint = `${API_URL}/api/aziendas`;
      profileData = {
        data: {
          nomeAzienda: userData.nome,
          partitaIva: userData.partitaIVA,
          emailAzienda: userData.email,
          user: userResult.user.id
        }
      };
    }
    
    const profileResponse = await fetch(profileEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userResult.jwt}`
      },
      body: JSON.stringify(profileData)
    });
    
    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();
      return { error: { message: `Errore nella creazione del profilo: ${profileError}` } };
    }
    
    const profileResult = await profileResponse.json();
    
    return {
      jwt: userResult.jwt,
      user: {
        ...userResult.user,
        jwt: userResult.jwt
      },
      userType: userType,
      profile: profileResult.data
    };
    
  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    return { error: { message: 'Si è verificato un errore durante la registrazione' } };
  }
};