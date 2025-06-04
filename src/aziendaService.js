// aziendaService.js
import { getToken } from './apiClient';

const API_URL = 'http://localhost:1337';

export const aziendaService = {
  async getProfile(user) {
    try {
      const token = getToken();
      const documentId = localStorage.getItem('aziendaDocumentId');

      console.log('🧾 Caricamento profilo azienda...');
      console.log('Token:', token);
      console.log('Email azienda:', user?.email);
      console.log('Document ID salvato:', documentId);

      // 1. Se c'è un documentId salvato, usa quello
      if (documentId) {
        try {
          const res = await fetch(`${API_URL}/api/aziendas/${documentId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            console.log('✅ Profilo caricato con documentId:', data);
            return data.data;
          }
        } catch (err) {
          console.warn('❌ Errore lettura con documentId:', err);
        }
      }

      // 2. Altrimenti cerca per email
      if (user?.email) {
        const res = await fetch(`${API_URL}/api/aziendas?filters[emailAzienda][$eq]=${user.email}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        console.log('📬 Risultato query per email:', data);

        if (data.data && data.data.length > 0) {
          const azienda = data.data[0];
          const docId = azienda.id;

          // Salva per usi futuri
          localStorage.setItem('aziendaDocumentId', docId);

          return azienda;
        }
      }

      console.warn('❌ Nessuna azienda trovata per email:', user?.email);
      return null;
    } catch (error) {
      console.error('❌ Errore durante il caricamento del profilo azienda:', error);
      throw error;
    }
  },

  async updateProfile(documentId, profileData, token) {
    try {
      console.log('🔄 Aggiornamento profilo azienda...');
      console.log('Document ID:', documentId);
      console.log('Dati da aggiornare:', profileData);

      const response = await fetch(`${API_URL}/api/aziendas/${documentId}`, {
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
        throw new Error(`Errore nell'aggiornamento del profilo: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Profilo azienda aggiornato:', data);
      return data.data;
    } catch (error) {
      console.error('❌ Errore durante l\'aggiornamento del profilo azienda:', error);
      throw error;
    }
  }
};