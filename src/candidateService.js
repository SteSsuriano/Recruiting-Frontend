// candidateService.js - Versione corretta
import { getToken, getProfileId } from './apiClient';

const API_URL = 'http://localhost:1337';

export const candidateService = {
  // Ottieni profilo candidato per user ID - Versione migliorata
  async getProfile(userId, user) {
    try {
      const token = getToken();
      const profileId = getProfileId();
      const candidateDocumentId = localStorage.getItem('candidateDocumentId');
      
      console.log('=== CARICAMENTO PROFILO CANDIDATO ===');
      console.log('User ID:', userId);
      console.log('User completo:', user);
      console.log('Token presente:', !!token);
      console.log('Profile ID salvato:', profileId);
      console.log('Candidate Document ID salvato:', candidateDocumentId);
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      // Strategia 1: Usa candidateDocumentId salvato se disponibile
      if (candidateDocumentId) {
        try {
          console.log('Tentativo con candidateDocumentId:', candidateDocumentId);
          const directResponse = await fetch(`${API_URL}/api/candidates/${candidateDocumentId}?populate=*`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ Profilo trovato con documentId diretto:', directData);
            return directData.data;
          } else {
            console.log('❌ Fallito con candidateDocumentId, status:', directResponse.status);
          }
        } catch (error) {
          console.log('❌ Errore nel recupero diretto:', error.message);
        }
      }
      
      // Strategia 2: Usa profileId dal login se disponibile
      if (profileId) {
        try {
          console.log('Tentativo con profileId:', profileId);
          const profileResponse = await fetch(`${API_URL}/api/candidates/${profileId}?populate=*`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Profilo trovato con profileId:', profileData);
            
            // Salva il documentId per usi futuri
            if (profileData.data?.documentId || profileData.data?.id) {
              localStorage.setItem('candidateDocumentId', profileData.data.documentId || profileData.data.id);
            }
            
            return profileData.data;
          } else {
            console.log('❌ Fallito con profileId, status:', profileResponse.status);
          }
        } catch (error) {
          console.log('❌ Errore con profileId:', error.message);
        }
      }
      
      // Strategia 3: Cerca per user ID
      if (userId) {
        try {
          console.log('Tentativo con filtro user ID:', userId);
          const response = await fetch(`${API_URL}/api/candidates?filters[user][id][$eq]=${userId}&populate=*`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!response.ok) {
            console.log('❌ Errore nella ricerca per user ID, status:', response.status);
          } else {
            const data = await response.json();
            console.log('Risposta ricerca per user ID:', data);
            
            if (data.data && data.data.length > 0) {
              const candidate = data.data[0];
              console.log('✅ Candidato trovato per user ID:', candidate);
              
              // Salva il documentId per usi futuri
              const docId = candidate.documentId || candidate.id;
              if (docId) {
                localStorage.setItem('candidateDocumentId', docId);
              }
              
              return candidate;
            }
          }
        } catch (error) {
          console.log('❌ Errore nella ricerca per user ID:', error.message);
        }
      }
      
      // Strategia 4: Cerca per email se disponibile
      if (user?.email) {
        try {
          console.log('Tentativo con email:', user.email);
          const emailResponse = await fetch(`${API_URL}/api/candidates?filters[emailCandidato][$eq]=${encodeURIComponent(user.email)}&populate=*`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!emailResponse.ok) {
            console.log('❌ Errore nella ricerca per email, status:', emailResponse.status);
          } else {
            const emailData = await emailResponse.json();
            console.log('Risposta ricerca per email:', emailData);
            
            if (emailData.data && emailData.data.length > 0) {
              const candidate = emailData.data[0];
              console.log('✅ Candidato trovato per email:', candidate);
              
              // Salva il documentId per usi futuri
              const docId = candidate.documentId || candidate.id;
              if (docId) {
                localStorage.setItem('candidateDocumentId', docId);
              }
              
              return candidate;
            }
          }
        } catch (error) {
          console.log('❌ Errore nella ricerca per email:', error.message);
        }
      }
      
      // Strategia 5: Lista tutti i candidati e cerca manualmente (fallback)
      try {
        console.log('Tentativo di listing completo dei candidati');
        const allCandidatesResponse = await fetch(`${API_URL}/api/candidates?populate=*`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (allCandidatesResponse.ok) {
          const allData = await allCandidatesResponse.json();
          console.log('Tutti i candidati:', allData);
          
          // Cerca per user ID o email nei risultati
          const found = allData.data?.find(candidate => {
            const candidateUserId = candidate.user?.id || candidate.attributes?.user?.data?.id;
            const candidateEmail = candidate.emailCandidato || candidate.attributes?.emailCandidato;
            
            return candidateUserId === userId || candidateEmail === user?.email;
          });
          
          if (found) {
            console.log('✅ Candidato trovato nel listing completo:', found);
            
            // Salva il documentId per usi futuri
            const docId = found.documentId || found.id;
            if (docId) {
              localStorage.setItem('candidateDocumentId', docId);
            }
            
            return found;
          }
        }
      } catch (error) {
        console.log('❌ Errore nel listing completo:', error.message);
      }
      
      console.error('❌ Nessun candidato trovato con nessuna strategia');
      console.error('Parametri di ricerca:', { userId, userEmail: user?.email, profileId, candidateDocumentId });
      return null;
    } catch (error) {
      console.error('❌ Errore generale nel caricamento profilo:', error);
      throw error;
    }
  },

  // Aggiorna profilo candidato - Versione migliorata
  async updateProfile(documentId, profileData) {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }
      
      console.log('=== AGGIORNAMENTO PROFILO CANDIDATO ===');
      console.log('Document ID:', documentId);
      console.log('Dati da aggiornare:', profileData);
      
      const response = await fetch(`${API_URL}/api/candidates/${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: profileData }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Errore risposta aggiornamento:', errorText);
        
        // Tenta di parsare l'errore per maggiori dettagli
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            throw new Error(errorData.error.message);
          }
        } catch (parseError) {
          // Usa il testo raw se non riesce a parsare
        }
        
        throw new Error(`Errore nell'aggiornamento del profilo: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Profilo candidato aggiornato con successo:', data);
      return data.data;
    } catch (error) {
      console.error('❌ Errore durante l\'aggiornamento del profilo candidato:', error);
      throw error;
    }
  },
};