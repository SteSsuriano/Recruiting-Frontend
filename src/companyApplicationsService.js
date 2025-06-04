// companyApplicationsService.js - Versione semplificata e funzionante
import { getToken } from './apiClient';

const API_URL = 'http://localhost:1337';

export const companyApplicationsService = {
  
  // Ottieni tutte le candidature per le offerte di un'azienda
  async getCompanyApplications(aziendaId) {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      console.log('🔍 Caricamento candidature per azienda ID:', aziendaId);

      // Cerchiamo le candidature che sono associate alle offerte di questa azienda
      const response = await fetch(`${API_URL}/api/candidaturas?populate=*&filters[offerta_lavorativa][aziendas][id][$eq]=${aziendaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Errore nel recupero candidature azienda:', errorText);
        throw new Error(`Errore nel recupero delle candidature: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Candidature azienda caricate:', data);
      
      // Arricchisci i dati con informazioni aggiuntive
      const enrichedApplications = data.data?.map(app => ({
        ...app,
        // Aggiungi dati computati per facilitare la visualizzazione
        candidateName: this.getCandidateName(app),
        jobTitle: this.getJobTitle(app),
        applicationDate: app.createdAt,
        canChangeStatus: this.canChangeStatus(app.statoCandidatura)
      })) || [];

      console.log('✅ Candidature elaborate:', enrichedApplications.length);
      return enrichedApplications;
      
    } catch (error) {
      console.error('❌ Errore durante il recupero delle candidature azienda:', error);
      throw error;
    }
  },

  // Aggiorna lo stato di una candidatura - VERSIONE SEMPLIFICATA E FUNZIONANTE
  async updateApplicationStatus(applicationId, newStatus, notes = '') {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      console.log('=== AGGIORNAMENTO STATO CANDIDATURA ===');
      console.log('🔄 Parametri:', {
        applicationId,
        newStatus,
        notes: notes ? 'presente' : 'vuoto',
        token: !!token
      });

      // Valida il nuovo stato
      if (!this.isValidStatus(newStatus)) {
        throw new Error(`Stato non valido: ${newStatus}`);
      }

      // Prepara i dati di aggiornamento - SOLO I CAMPI ESSENZIALI
      const updateData = {
        statoCandidatura: newStatus
      };

      // Aggiungi le note se presenti (ma solo se il campo esiste nel content type)
      if (notes && notes.trim()) {
        updateData.note = notes.trim();
      }

      console.log('📤 Dati aggiornamento:', updateData);

      // Effettua la richiesta di aggiornamento
      const response = await fetch(`${API_URL}/api/candidaturas/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: updateData })
      });

      const responseText = await response.text();
      console.log('📥 Risposta server:', response.status, responseText);

      if (!response.ok) {
        // Se c'è un errore 400, potrebbe essere dovuto al campo 'note' che non esiste
        if (response.status === 400 && notes) {
          console.log('🔄 Errore 400, ritentando senza note...');
          
          // Riprova senza le note
          const fallbackData = {
            statoCandidatura: newStatus
          };

          const fallbackResponse = await fetch(`${API_URL}/api/candidaturas/${applicationId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: fallbackData })
          });

          const fallbackText = await fallbackResponse.text();
          console.log('📥 Risposta fallback:', fallbackResponse.status, fallbackText);

          if (fallbackResponse.ok) {
            const result = JSON.parse(fallbackText);
            console.log('✅ Aggiornamento riuscito (senza note)');
            return result.data;
          }
          
          throw new Error(`Errore aggiornamento: ${fallbackResponse.status} - ${fallbackText}`);
        }
        
        throw new Error(`Errore aggiornamento: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('✅ Aggiornamento completato con successo');
      return result.data;
      
    } catch (error) {
      console.error('❌ Errore durante l\'aggiornamento dello stato:', error);
      throw error;
    }
  },

  // Versione ancora più semplice per test
  async updateApplicationStatusSimple(applicationId, newStatus) {
    try {
      const token = getToken();
      
      console.log('🔄 Aggiornamento super semplice:', { applicationId, newStatus });

      const response = await fetch(`${API_URL}/api/candidaturas/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: { 
            statoCandidatura: newStatus 
          } 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Errore risposta:', response.status, errorText);
        throw new Error(`Errore ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Aggiornamento super semplice riuscito');
      return result.data;
      
    } catch (error) {
      console.error('❌ Errore aggiornamento super semplice:', error);
      throw error;
    }
  },

  // Debug: Controlla l'esistenza della candidatura
  async checkApplicationExists(applicationId) {
    try {
      const token = getToken();
      
      const response = await fetch(`${API_URL}/api/candidaturas/${applicationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Candidatura trovata:', applicationId, data);
        return data.data;
      } else {
        console.log('❌ Candidatura non trovata:', applicationId, response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Errore verifica candidatura:', error);
      return null;
    }
  },

  // Ottieni statistiche delle candidature per un'azienda
  getApplicationsStats(applications) {
    const stats = {
      total: applications.length,
      received: 0,
      inReview: 0,
      rejected: 0,
      approved: 0,
      interviews: 0
    };

    applications.forEach(app => {
      switch (app.statoCandidatura) {
        case 'inviata':
          stats.received++;
          break;
        case 'in_revisione':
          stats.inReview++;
          break;
        case 'scartata':
          stats.rejected++;
          break;
        case 'approvata':
          stats.approved++;
          break;
        case 'colloquio':
          stats.interviews++;
          break;
        default:
          stats.received++;
      }
    });

    return stats;
  },

  // Ottieni i possibili stati delle candidature
  getApplicationStatuses() {
    return [
      { value: 'inviata', label: 'Ricevuta', color: '#3b82f6', icon: '📥' },
      { value: 'in_revisione', label: 'In Revisione', color: '#f59e0b', icon: '👀' },
      { value: 'colloquio', label: 'Colloquio', color: '#8b5cf6', icon: '🎯' },
      { value: 'approvata', label: 'Approvata', color: '#10b981', icon: '✅' },
      { value: 'scartata', label: 'Scartata', color: '#ef4444', icon: '❌' }
    ];
  },

  // Verifica se uno stato è valido
  isValidStatus(status) {
    const validStatuses = ['inviata', 'in_revisione', 'colloquio', 'approvata', 'scartata'];
    return validStatuses.includes(status);
  },

  // Verifica se è possibile cambiare lo stato
  canChangeStatus(currentStatus) {
    // Gli stati finali non dovrebbero essere modificabili (opzionale)
    const finalStates = ['approvata', 'scartata'];
    return !finalStates.includes(currentStatus);
  },

  // Estrai il nome del candidato
  getCandidateName(application) {
    if (application.candidato) {
      const candidate = application.candidato;
      const firstName = candidate.nomeCandidato || candidate.attributes?.nomeCandidato || '';
      const lastName = candidate.cognomeCandidato || candidate.attributes?.cognomeCandidato || '';
      return `${firstName} ${lastName}`.trim() || 'Nome non disponibile';
    }
    return 'Candidato non disponibile';
  },

  // Estrai il titolo dell'offerta
  getJobTitle(application) {
    if (application.offerta_lavorativa) {
      return application.offerta_lavorativa.titoloOffertaLavorativa || 
             application.offerta_lavorativa.attributes?.titoloOffertaLavorativa || 
             'Posizione non specificata';
    }
    return 'Offerta non disponibile';
  },

  // Formatta lo stato per la visualizzazione
  formatStatus(status) {
    const statusInfo = this.getApplicationStatuses().find(s => s.value === status);
    return statusInfo ? statusInfo.label : status;
  },

  // Ottieni l'icona per lo stato
  getStatusIcon(status) {
    const statusInfo = this.getApplicationStatuses().find(s => s.value === status);
    return statusInfo ? statusInfo.icon : '📄';
  },

  // Ottieni il colore per lo stato
  getStatusColor(status) {
    const statusInfo = this.getApplicationStatuses().find(s => s.value === status);
    return statusInfo ? statusInfo.color : '#64748b';
  },

  // Filtra candidature per stato
  filterApplicationsByStatus(applications, status) {
    if (!status || status === 'all') {
      return applications;
    }
    return applications.filter(app => app.statoCandidatura === status);
  },

  // Ordina candidature per data
  sortApplicationsByDate(applications, ascending = false) {
    return [...applications].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  },

  // Cerca candidature per nome candidato o titolo offerta
  searchApplications(applications, searchTerm) {
    if (!searchTerm.trim()) {
      return applications;
    }

    const term = searchTerm.toLowerCase().trim();
    return applications.filter(app => {
      const candidateName = this.getCandidateName(app).toLowerCase();
      const jobTitle = this.getJobTitle(app).toLowerCase();
      return candidateName.includes(term) || jobTitle.includes(term);
    });
  },

  // Ottieni URL di download del CV
  getCVDownloadUrl(application) {
    if (application.curriculum?.percorsoFile) {
      // Se percorsoFile è un array
      if (Array.isArray(application.curriculum.percorsoFile) && application.curriculum.percorsoFile.length > 0) {
        return `${API_URL}${application.curriculum.percorsoFile[0].url}`;
      }
      // Se percorsoFile è un singolo oggetto
      if (application.curriculum.percorsoFile.url) {
        return `${API_URL}${application.curriculum.percorsoFile.url}`;
      }
    }
    return null;
  },

  // Formatta la data di creazione
  formatApplicationDate(dateString) {
    if (!dateString) return 'Data non disponibile';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Oggi';
      } else if (diffDays === 2) {
        return 'Ieri';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} giorni fa`;
      } else {
        return date.toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error('Errore nel formataggio della data:', error);
      return 'Data non valida';
    }
  }
};