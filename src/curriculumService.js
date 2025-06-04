// curriculumService.js - Versione con debug esteso
import { getToken } from './apiClient';

const API_URL = 'http://localhost:1337';

export const curriculumService = {
  
  // Debug: Verifica la struttura del content type
  async getCurriculumSchema(token) {
    try {
      const response = await fetch(`${API_URL}/api/content-type-builder/content-types/api::curriculum.curriculum`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const schema = await response.json();
        console.log('📋 Schema Curriculum:', schema);
        return schema;
      }
    } catch (error) {
      console.log('⚠️ Impossibile recuperare lo schema:', error);
    }
  },

  // Test: Crea curriculum con dati minimi
  async createCurriculumMinimal(token) {
    try {
      console.log('🧪 Test creazione curriculum con dati minimi...');
      
      const minimalData = {
        dataCaricamento: new Date().toISOString().split('T')[0]
      };
      
      console.log('📤 Dati minimi da inviare:', minimalData);
      
      const response = await fetch(`${API_URL}/api/curricula`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: minimalData })
      });
      
      const responseText = await response.text();
      console.log('📥 Risposta raw:', responseText);
      
      if (!response.ok) {
        console.error('❌ Errore test curriculum:', response.status, responseText);
        return { error: responseText, status: response.status };
      }
      
      const result = JSON.parse(responseText);
      console.log('✅ Test curriculum riuscito:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Errore test curriculum:', error);
      return { error: error.message };
    }
  },

  // Crea curriculum con debug esteso
  async createCurriculum(cvFile, candidateId, token) {
    try {
      console.log('=== DEBUG CREAZIONE CURRICULUM ===');
      console.log('📁 File CV:', {
        name: cvFile.name,
        size: cvFile.size,
        type: cvFile.type
      });
      console.log('👤 Candidate ID:', candidateId);
      console.log('🔑 Token presente:', !!token);
      
      // Prima verifica lo schema se possibile
      await this.getCurriculumSchema(token);
      
      // Test con dati minimi
      const testResult = await this.createCurriculumMinimal(token);
      if (testResult.error) {
        console.log('❌ Test fallito, curriculum potrebbe avere campi obbligatori');
        // Continua comunque con l'upload
      } else {
        console.log('✅ Test riuscito, procedendo con upload file');
        // Elimina il test record se possibile
        try {
          await this.deleteCurriculum(testResult.data.id, token);
        } catch (e) {
          console.log('⚠️ Impossibile eliminare record test');
        }
      }
      
      // Step 1: Upload del file
      console.log('📤 Avvio upload file...');
      const formData = new FormData();
      formData.append('files', cvFile);

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const uploadResponseText = await uploadResponse.text();
      console.log('📥 Risposta upload raw:', uploadResponseText);

      if (!uploadResponse.ok) {
        console.error('❌ Errore upload file:', uploadResponse.status, uploadResponseText);
        throw new Error(`Errore upload: ${uploadResponse.status} - ${uploadResponseText}`);
      }

      const uploadData = JSON.parse(uploadResponseText);
      const uploadedFile = uploadData[0];
      
      console.log('✅ File caricato con successo:', {
        id: uploadedFile.id,
        name: uploadedFile.name,
        url: uploadedFile.url
      });

      // Step 2: Prova diverse versioni dei dati curriculum
      const curriculumVersions = [
        // Versione 1: Solo dati essenziali
        {
          name: 'Solo essenziali',
          data: {
            dataCaricamento: new Date().toISOString().split('T')[0],
            percorsoFile: uploadedFile.id
          }
        },
        // Versione 2: Con array per percorsoFile (multiple: true)
        {
          name: 'Array percorsoFile',
          data: {
            dataCaricamento: new Date().toISOString().split('T')[0],
            percorsoFile: [uploadedFile.id]
          }
        },
        // Versione 3: Data completa ISO
        {
          name: 'Data ISO completa',
          data: {
            dataCaricamento: new Date().toISOString(),
            percorsoFile: uploadedFile.id
          }
        },
        // Versione 4: Senza data
        {
          name: 'Senza data',
          data: {
            percorsoFile: uploadedFile.id
          }
        }
      ];

      let curriculumResult = null;
      
      for (const version of curriculumVersions) {
        console.log(`🔄 Tentativo: ${version.name}`);
        console.log('📤 Dati:', version.data);
        
        try {
          const curriculumResponse = await fetch(`${API_URL}/api/curricula`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: version.data })
          });

          const curriculumResponseText = await curriculumResponse.text();
          console.log(`📥 Risposta ${version.name}:`, curriculumResponseText);

          if (curriculumResponse.ok) {
            curriculumResult = JSON.parse(curriculumResponseText);
            console.log(`✅ Curriculum creato con ${version.name}:`, curriculumResult);
            break;
          } else {
            console.log(`❌ Fallito ${version.name}:`, curriculumResponse.status, curriculumResponseText);
          }
        } catch (error) {
          console.log(`❌ Errore ${version.name}:`, error.message);
        }
      }
      
      if (!curriculumResult) {
        throw new Error('Impossibile creare curriculum con nessuna versione dei dati');
      }
      
      return curriculumResult.data;
      
    } catch (error) {
      console.error('❌ Errore generale creazione curriculum:', error);
      throw error;
    }
  },

  // Ottieni curriculum
  async getCandidateCurriculums(candidateId, token) {
    try {
      const response = await fetch(`${API_URL}/api/curricula?populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore recupero curriculum: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Tutti i curriculum:', data);
      
      return data.data || [];
    } catch (error) {
      console.error('Errore nel recupero dei curriculum:', error);
      throw error;
    }
  },

  // Elimina curriculum
  async deleteCurriculum(curriculumId, token) {
    try {
      const response = await fetch(`${API_URL}/api/curricula/${curriculumId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore eliminazione curriculum:', errorText);
        throw new Error(`Errore eliminazione curriculum: ${response.status}`);
      }

      console.log('✅ Curriculum eliminato:', curriculumId);
      return true;
    } catch (error) {
      console.error('Errore nell\'eliminazione del curriculum:', error);
      throw error;
    }
  }
};