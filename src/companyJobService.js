// companyJobService.js
import { getToken } from './apiClient';

const API_URL = 'http://localhost:1337';

export const companyJobService = {
  // Ottieni offerte di una specifica azienda
  async getCompanyJobOffers(aziendaId) {
    try {
      const token = getToken();
      
      const response = await fetch(`${API_URL}/api/offerta-lavorativas?filters[aziendas][id][$eq]=${aziendaId}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore nel recupero delle offerte: ${response.status}`);
      }

      const data = await response.json();
      console.log('Offerte azienda caricate:', data);
      return data.data || [];
    } catch (error) {
      console.error('Errore durante il recupero delle offerte azienda:', error);
      throw error;
    }
  },

  // Valida completezza offerta (IF-A02.1)
  validateJobOffer(offerData) {
    const requiredFields = [
      'titoloOffertaLavorativa',
      'descrizioneOffertaLavorativa',
      'tipoContratto',
      'livelloEsperienza',
      'competenzeRichieste'
    ];

    const missingFields = [];
    
    console.log('Validando offerta:', offerData);

    // Verifica campi obbligatori
    requiredFields.forEach(field => {
      if (!offerData[field] || offerData[field].toString().trim() === '') {
        missingFields.push(field);
      }
    });

    // Verifica date
    if (offerData.dataScadenza) {
      const scadenza = new Date(offerData.dataScadenza);
      const oggi = new Date();
      if (scadenza <= oggi) {
        missingFields.push('dataScadenza_invalid');
      }
    }

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: 'OffertaIncompleta',
        message: 'Rilevati errori nei dati inseriti durante la creazione dell\'offerta.',
        missingFields: missingFields,
        detailedMessage: this.getMissingFieldsMessage(missingFields)
      };
    }

    return {
      valid: true,
      message: 'Offerta completa e valida'
    };
  },

  // Genera messaggio dettagliato per i campi mancanti
  getMissingFieldsMessage(missingFields) {
    const fieldLabels = {
      'titoloOffertaLavorativa': 'Titolo offerta',
      'descrizioneOffertaLavorativa': 'Descrizione offerta',
      'tipoContratto': 'Tipo di contratto',
      'livelloEsperienza': 'Livello di esperienza',
      'competenzeRichieste': 'Competenze richieste',
      'dataScadenza_invalid': 'Data di scadenza (deve essere futura)'
    };

    const missingLabels = missingFields.map(field => fieldLabels[field] || field);
    
    if (missingLabels.length === 1) {
      return `Campo mancante: ${missingLabels[0]}`;
    } else {
      return `Campi mancanti: ${missingLabels.join(', ')}`;
    }
  },

  // Crea nuova offerta lavorativa (IF-A02)
  async createJobOffer(offerData, aziendaId) {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      console.log('Creando offerta:', offerData);

      // Valida completezza dati prima di inviare
      const validation = this.validateJobOffer(offerData);
      if (!validation.valid) {
        throw new Error(validation.detailedMessage);
      }

      // Prepara i dati per l'invio
      const jobOfferPayload = {
        ...offerData,
        dataPubblicazione: new Date().toISOString(),
        aziendas: [aziendaId] // Associa l'offerta all'azienda
      };

      const response = await fetch(`${API_URL}/api/offerta-lavorativas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: jobOfferPayload })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore risposta server:', errorText);
        throw new Error(`Errore nella creazione dell'offerta: ${response.status}`);
      }

      const data = await response.json();
      console.log('Offerta creata con successo:', data);
      return data.data;
    } catch (error) {
      console.error('Errore durante la creazione dell\'offerta:', error);
      throw error;
    }
  },

  // Modifica offerta esistente (IF-A02)
  async updateJobOffer(offerId, offerData) {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      console.log('Modificando offerta:', offerId, offerData);

      // Valida completezza dati prima di inviare
      const validation = this.validateJobOffer(offerData);
      if (!validation.valid) {
        throw new Error(validation.detailedMessage);
      }

      const response = await fetch(`${API_URL}/api/offerta-lavorativas/${offerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: offerData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore risposta server:', errorText);
        throw new Error(`Errore nella modifica dell'offerta: ${response.status}`);
      }

      const data = await response.json();
      console.log('Offerta modificata con successo:', data);
      return data.data;
    } catch (error) {
      console.error('Errore durante la modifica dell\'offerta:', error);
      throw error;
    }
  },

  // Elimina offerta (IF-A02)
  async deleteJobOffer(offerId) {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      console.log('Eliminando offerta:', offerId);

      const response = await fetch(`${API_URL}/api/offerta-lavorativas/${offerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore risposta server:', errorText);
        throw new Error(`Errore nell'eliminazione dell'offerta: ${response.status}`);
      }

      console.log('Offerta eliminata con successo');
      return true;
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'offerta:', error);
      throw error;
    }
  },

  // Pubblica/Sospendi offerta
  async toggleJobOfferStatus(offerId, publish = true) {
    try {
      const token = getToken();
      
      const response = await fetch(`${API_URL}/api/offerta-lavorativas/${offerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: { 
            publishedAt: publish ? new Date().toISOString() : null 
          } 
        })
      });

      if (!response.ok) {
        throw new Error(`Errore nel cambio stato offerta: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Errore durante il cambio stato offerta:', error);
      throw error;
    }
  },

  // Formatta i tipi di contratto per select
  getContractTypes() {
    return [
      { value: 'tempo_indeterminato', label: 'Tempo Indeterminato' },
      { value: 'tempo_determinato', label: 'Tempo Determinato' },
      { value: 'part_time', label: 'Part Time' },
      { value: 'full_time', label: 'Full Time' }
    ];
  },

  // Formatta i livelli di esperienza per select
  getExperienceLevels() {
    return [
      { value: 'entry_level', label: 'Entry Level' },
      { value: 'junior', label: 'Junior' },
      { value: 'middle', label: 'Middle' },
      { value: 'senior', label: 'Senior' }
    ];
  },

  // Formatta data per input datetime-local
  formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  },

  // Ottieni statistiche offerte azienda
  getJobOfferStats(offers) {
    return {
      total: offers.length,
      published: offers.filter(offer => offer.publishedAt).length,
      draft: offers.filter(offer => !offer.publishedAt).length,
      expired: offers.filter(offer => {
        if (!offer.dataScadenza) return false;
        return new Date(offer.dataScadenza) < new Date();
      }).length
    };
  }
};