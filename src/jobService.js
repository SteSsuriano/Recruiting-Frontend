// jobService.js - Versione corretta per l'invio candidature
import { getToken } from './apiClient';

const API_URL = 'http://localhost:1337';

export const jobService = {
  // Ottieni tutte le offerte di lavoro
  async getAllJobOffers() {
    try {
      const response = await fetch(`${API_URL}/api/offerta-lavorativas?populate=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore nel recupero delle offerte: ${response.status}`);
      }

      const data = await response.json();
      console.log('Offerte caricate:', data);
      return data.data || [];
    } catch (error) {
      console.error('Errore durante il recupero delle offerte lavorative:', error);
      throw error;
    }
  },

  // Ottieni dettagli singola offerta
  async getJobOfferById(offerId) {
    try {
      const response = await fetch(`${API_URL}/api/offerta-lavorativas/${offerId}?populate=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore nel recupero dell'offerta: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Errore durante il recupero dell\'offerta:', error);
      throw error;
    }
  },

  // Valida il file CV
  validateCVFile(file) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_FORMATS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    console.log('Validando file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!ALLOWED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: 'FileNonValido',
        message: 'Il formato del file non è valido. Sono accettati solo file PDF, DOC e DOCX.'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'DimensioneMaxFileSuperata',
        message: 'Il file supera la dimensione massima consentita di 5MB.'
      };
    }

    return {
      valid: true,
      message: 'File valido'
    };
  },

  // Debug: Verifica struttura content types
  async debugContentTypes() {
    try {
      const token = getToken();
      console.log('🔍 Debug content types disponibili...');
      
      // Verifica candidature
      const candidatureResponse = await fetch(`${API_URL}/api/candidaturas?pagination[limit]=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (candidatureResponse.ok) {
        const candidatureData = await candidatureResponse.json();
        console.log('📋 Schema candidature:', candidatureData);
      }
      
      // Verifica curricula
      const curriculaResponse = await fetch(`${API_URL}/api/curricula?pagination[limit]=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (curriculaResponse.ok) {
        const curriculaData = await curriculaResponse.json();
        console.log('📋 Schema curricula:', curriculaData);
      }
      
    } catch (error) {
      console.log('⚠️ Errore debug content types:', error);
    }
  },

  // Versione semplificata per creare candidatura - SOLO DATI ESSENZIALI
  async submitApplicationSimple(candidateId, jobOfferId) {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      console.log('=== CANDIDATURA SEMPLIFICATA ===');
      console.log('📤 Candidato ID:', candidateId);
      console.log('📤 Offerta ID:', jobOfferId);
      console.log('🔑 Token presente:', !!token);

      // Debug content types
      await this.debugContentTypes();

      // Dati minimi per candidatura
      const candidaturaData = {
        candidato: candidateId,
        offerta_lavorativa: jobOfferId,
        statoCandidatura: 'inviata'
      };

      console.log('📤 Dati candidatura:', candidaturaData);

      const response = await fetch(`${API_URL}/api/candidaturas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: candidaturaData })
      });

      const responseText = await response.text();
      console.log('📥 Risposta server:', response.status, responseText);

      if (!response.ok) {
        console.error('❌ Errore candidatura:', response.status, responseText);
        throw new Error(`Errore candidatura: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Candidatura creata:', data);
      return data.data;
      
    } catch (error) {
      console.error('❌ Errore candidatura semplificata:', error);
      throw error;
    }
  },

  // Upload CV semplificato
  async uploadCVSimple(cvFile) {
    try {
      const token = getToken();
      
      console.log('📤 Upload CV semplificato...');
      console.log('📁 File:', cvFile.name, cvFile.size, cvFile.type);

      const formData = new FormData();
      formData.append('files', cvFile);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const responseText = await response.text();
      console.log('📥 Risposta upload:', response.status, responseText);

      if (!response.ok) {
        throw new Error(`Errore upload: ${response.status} - ${responseText}`);
      }

      const uploadData = JSON.parse(responseText);
      const uploadedFile = uploadData[0];
      
      console.log('✅ File caricato:', uploadedFile.id, uploadedFile.name);
      return uploadedFile;
      
    } catch (error) {
      console.error('❌ Errore upload CV:', error);
      throw error;
    }
  },

  // Metodo principale per l'invio candidature - VERSIONE SEMPLIFICATA
  async debugSubmitApplication(applicationData) {
    try {
      const token = getToken();
      console.log('=== DEBUG CANDIDATURA SEMPLIFICATA ===');
      console.log('📤 Dati ricevuti:', applicationData);

      // Step 1: Verifica candidato e offerta esistano
      console.log('🔍 Verifica candidato...');
      const candidateResponse = await fetch(`${API_URL}/api/candidates/${applicationData.candidateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!candidateResponse.ok) {
        throw new Error(`Candidato non trovato: ${candidateResponse.status}`);
      }
      
      const candidateData = await candidateResponse.json();
      console.log('✅ Candidato trovato:', candidateData.data.id);

      console.log('🔍 Verifica offerta...');
      const offerResponse = await fetch(`${API_URL}/api/offerta-lavorativas/${applicationData.jobOfferId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!offerResponse.ok) {
        throw new Error(`Offerta non trovata: ${offerResponse.status}`);
      }
      
      const offerData = await offerResponse.json();
      console.log('✅ Offerta trovata:', offerData.data.id);

      // Step 2: Upload CV se presente
      let uploadedFile = null;
      if (applicationData.cvFile) {
        console.log('📎 Upload CV...');
        uploadedFile = await this.uploadCVSimple(applicationData.cvFile);
      }

      // Step 3: Crea candidatura con diversi approcci
      const approaches = [
        // Approccio 1: Solo dati base
        {
          name: 'Base',
          data: {
            candidato: applicationData.candidateId,
            offerta_lavorativa: applicationData.jobOfferId,
            statoCandidatura: 'inviata'
          }
        },
        // Approccio 2: Con file se presente
        {
          name: 'Con file',
          data: {
            candidato: applicationData.candidateId,
            offerta_lavorativa: applicationData.jobOfferId,
            statoCandidatura: 'inviata',
            ...(uploadedFile && { curriculum: uploadedFile.id })
          }
        },
        // Approccio 3: Con relazioni arrays
        {
          name: 'Array relations',
          data: {
            candidato: [applicationData.candidateId],
            offerta_lavorativa: [applicationData.jobOfferId],
            statoCandidatura: 'inviata'
          }
        },
        // Approccio 4: Con connect syntax
        {
          name: 'Connect syntax',
          data: {
            candidato: { connect: [applicationData.candidateId] },
            offerta_lavorativa: { connect: [applicationData.jobOfferId] },
            statoCandidatura: 'inviata'
          }
        }
      ];

      let result = null;
      
      for (const approach of approaches) {
        console.log(`🔄 Tentativo: ${approach.name}`);
        console.log('📤 Dati:', approach.data);

        try {
          const response = await fetch(`${API_URL}/api/candidaturas`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: approach.data })
          });

          const responseText = await response.text();
          console.log(`📥 Risposta ${approach.name}:`, response.status, responseText);

          if (response.ok) {
            result = JSON.parse(responseText);
            console.log(`✅ Candidatura creata con approccio ${approach.name}:`, result);
            break;
          } else {
            console.log(`❌ Fallito ${approach.name}:`, response.status, responseText);
          }
        } catch (error) {
          console.log(`❌ Errore ${approach.name}:`, error.message);
        }
      }

      if (!result) {
        throw new Error('Impossibile creare candidatura con nessun approccio. Verifica la configurazione di Strapi.');
      }

      return result.data;

    } catch (error) {
      console.error('❌ Errore debug candidatura:', error);
      throw error;
    }
  },

  // Invia candidatura - METODO PRINCIPALE AGGIORNATO
  async submitApplication(applicationData) {
    console.log('🚀 Avvio invio candidatura...');
    
    try {
      // Usa il metodo debug che prova diversi approcci
      return await this.debugSubmitApplication(applicationData);
    } catch (error) {
      console.error('❌ Errore metodo principale:', error);
      
      // Fallback: prova metodo semplificato senza CV
      console.log('🔄 Tentativo fallback senza CV...');
      try {
        return await this.submitApplicationSimple(applicationData.candidateId, applicationData.jobOfferId);
      } catch (fallbackError) {
        console.error('❌ Anche il fallback è fallito:', fallbackError);
        throw new Error(`Impossibile inviare candidatura: ${error.message}`);
      }
    }
  },

  // Ottieni candidature di un candidato
  async getCandidateApplications(candidateId) {
    try {
      const token = getToken();
      
      console.log('Caricando candidature per candidato ID:', candidateId);
      
      const response = await fetch(`${API_URL}/api/candidaturas?filters[candidato][id][$eq]=${candidateId}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore nel recupero candidature:', errorText);
        throw new Error(`Errore nel recupero delle candidature: ${response.status}`);
      }

      const data = await response.json();
      console.log('Candidature caricate:', data);
      return data.data || [];
    } catch (error) {
      console.error('Errore durante il recupero delle candidature:', error);
      throw error;
    }
  },

  // Debug: Lista tutte le candidature
  async debugListAllApplications() {
    try {
      const token = getToken();
      console.log('🔍 Listing tutte le candidature...');

      const response = await fetch(`${API_URL}/api/candidaturas?populate=*`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Tutte le candidature esistenti:', data);
        console.log('📊 Numero totale candidature:', data.data?.length || 0);
        
        data.data?.forEach((app, index) => {
          console.log(`📄 Candidatura ${index + 1}:`, {
            id: app.id,
            stato: app.statoCandidatura,
            candidato: app.candidato?.id,
            offerta: app.offerta_lavorativa?.id,
            createdAt: app.createdAt
          });
        });
        
        return data.data;
      } else {
        console.error('❌ Errore nel recupero candidature:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Errore debug lista candidature:', error);
      return [];
    }
  },

  // Formatta lo stato della candidatura per la visualizzazione
  formatApplicationStatus(statoCandidatura) {
    const statusMap = {
      'inviata': 'Inviata',
      'in_revisione': 'In Revisione',
      'scartata': 'Scartata',
      'approvata': 'Approvata',
      'colloquio': 'Colloquio'
    };
    return statusMap[statoCandidatura] || statoCandidatura || 'Non specificato';
  },

  // Ottieni classe CSS per lo stato della candidatura
  getStatusClass(statoCandidatura) {
    const statusClasses = {
      'inviata': 'status-inviata',
      'in_revisione': 'status-in-revisione', 
      'scartata': 'status-scartata',
      'approvata': 'status-approvata',
      'colloquio': 'status-colloquio'
    };
    return statusClasses[statoCandidatura] || 'status-default';
  },

  // Formatta il tipo di contratto per la visualizzazione
  formatContractType(tipoContratto) {
    const contractTypes = {
      'tempo_indeterminato': 'Tempo Indeterminato',
      'tempo_determinato': 'Tempo Determinato', 
      'part_time': 'Part Time',
      'full_time': 'Full Time'
    };
    return contractTypes[tipoContratto] || tipoContratto || 'Non specificato';
  },

  // Formatta il livello di esperienza per la visualizzazione
  formatExperienceLevel(livelloEsperienza) {
    const experienceLevels = {
      'entry_level': 'Entry Level',
      'junior': 'Junior',
      'middle': 'Middle',
      'senior': 'Senior'
    };
    return experienceLevels[livelloEsperienza] || livelloEsperienza || 'Non specificato';
  },

  // Verifica se un'offerta è scaduta
  isJobExpired(dataScadenza) {
    if (!dataScadenza) return false;
    const expiryDate = new Date(dataScadenza);
    const now = new Date();
    return expiryDate < now;
  },

  // Formatta la data per la visualizzazione
  formatDate(dateString) {
    if (!dateString) return 'Non specificata';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Errore nel formataggio della data:', error);
      return 'Data non valida';
    }
  }
};