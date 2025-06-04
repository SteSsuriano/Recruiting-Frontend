import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { candidateService } from './candidateService';
import { jobService } from './jobService';
import { curriculumService } from './curriculumService';
import { getToken } from './apiClient';
import './CandidateDashboard.css';

function CandidateDashboard() {
  const { user, logout, profileId } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notifications] = useState([
    { id: 1, text: "Nuova offerta di lavoro disponibile per il tuo profilo", time: "2h fa", unread: true },
    { id: 2, text: "La tua candidatura per Developer Frontend è stata visualizzata", time: "5h fa", unread: true },
    { id: 3, text: "Ricorda di completare il tuo profilo professionale", time: "1 giorno fa", unread: false }
  ]);

  // Stati per il profilo Strapi
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Stati form
  const [attitudes, setAttitudes] = useState('');
  const [workPreferences, setWorkPreferences] = useState('');
  const [interests, setInterests] = useState('');

  // Stati per offerte di lavoro e candidature
  const [jobOffers, setJobOffers] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  
  // Stati per candidature reali
  const [userApplications, setUserApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  
  // ⭐ NUOVO: Stato per tracciare le offerte già candidate
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  
  // Stati per il form di candidatura
  const [cvFile, setCvFile] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);

  // Carica profilo e candidature all'avvio
  useEffect(() => {
    const initializeData = async () => {
      if (user?.id) {
        console.log('=== INIZIALIZZAZIONE DASHBOARD CANDIDATO ===');
        console.log('User caricato:', user.username);
        console.log('User ID:', user.id);
        console.log('Profile ID:', profileId);
        
        try {
          // Carica il profilo
          await loadProfile();
          
          // Carica le offerte per aggiornare il contatore nella dashboard
          await loadJobOffers();
          
          console.log('✅ Inizializzazione completata');
        } catch (error) {
          console.error('❌ Errore durante inizializzazione:', error);
        }
      }
    };

    initializeData();
  }, [user?.id, profileId]);

  // Carica candidature quando il profilo è disponibile
  useEffect(() => {
    const loadApplicationsIfReady = async () => {
      if (candidateProfile?.id) {
        console.log('=== CARICAMENTO CANDIDATURE ===');
        console.log('Profilo candidato disponibile, ID:', candidateProfile.id);
        
        try {
          await loadUserApplications();
          console.log('✅ Candidature caricate');
        } catch (error) {
          console.error('❌ Errore caricamento candidature:', error);
        }
      }
    };

    loadApplicationsIfReady();
  }, [candidateProfile?.id]);

  // Ricarica candidature quando si entra nella sezione applications
  useEffect(() => {
    const refreshApplicationsSection = async () => {
      if (activeSection === 'applications' && candidateProfile?.id) {
        console.log('=== REFRESH SEZIONE CANDIDATURE ===');
        
        try {
          await loadUserApplications();
          console.log('✅ Candidature aggiornate');
        } catch (error) {
          console.error('❌ Errore refresh candidature:', error);
        }
      }
    };

    refreshApplicationsSection();
  }, [activeSection, candidateProfile?.id]);

  // Carica offerte quando si va nella sezione jobs
  useEffect(() => {
    const refreshJobsSection = async () => {
      if (activeSection === 'jobs') {
        console.log('=== REFRESH SEZIONE OFFERTE ===');
        
        try {
          await loadJobOffers();
          console.log('✅ Offerte aggiornate');
        } catch (error) {
          console.error('❌ Errore refresh offerte:', error);
        }
      }
    };

    refreshJobsSection();
  }, [activeSection]);

  // ⭐ NUOVA: Funzione per aggiornare gli ID delle offerte già candidate
  const updateAppliedJobIds = (applications) => {
    const jobIds = new Set();
    applications.forEach(app => {
      if (app.offerta_lavorativa?.id) {
        jobIds.add(app.offerta_lavorativa.id);
      }
    });
    setAppliedJobIds(jobIds);
    console.log('🎯 Offerte già candidate (IDs):', Array.from(jobIds));
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      
      // Passa anche l'oggetto user completo per avere accesso all'email
      const profile = await candidateService.getProfile(user.id, user);
      
      if (profile) {
        setCandidateProfile(profile);
        // Salva il document ID per usi futuri
        if (profile?.documentId) {
          localStorage.setItem('candidateDocumentId', profile.documentId);
        }
        // Popola i campi del form con i dati esistenti
        setAttitudes(profile.attributes?.attitudiniCandidato || profile.attitudiniCandidato || '');
        setWorkPreferences(profile.attributes?.preferenzeLavorativeCandidato || profile.preferenzeLavorativeCandidato || '');
        setInterests(profile.attributes?.interessiCandidato || profile.interessiCandidato || '');
      } else {
        console.error('Nessun profilo trovato per utente:', user);
        console.error('User ID:', user?.id);
        console.error('User email:', user?.email);
        console.error('Profile ID dal localStorage:', profileId);
      }
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      if (!candidateProfile) {
        console.error('ERRORE: Profilo candidato non trovato!');
        alert('Errore: Il profilo candidato non è stato trovato. Verifica che la relazione user sia configurata correttamente in Strapi.');
        return;
      }
      
      // Prepara i dati da aggiornare
      const profileData = {
        attitudiniCandidato: attitudes,
        preferenzeLavorativeCandidato: workPreferences,
        interessiCandidato: interests,
      };
      
      // Usa il documentId se disponibile, altrimenti l'id
      const documentId = candidateProfile.documentId || candidateProfile.id;
      console.log('Aggiornando profilo con documentId:', documentId);
      
      await candidateService.updateProfile(documentId, profileData);
      alert('Profilo aggiornato con successo!');
      
      // Ricarica il profilo per ottenere i dati aggiornati
      await loadProfile();
      
    } catch (error) {
      console.error('Errore nel salvataggio del profilo:', error);
      alert('Errore nel salvataggio del profilo');
    } finally {
      setSaving(false);
    }
  };

  // Carica offerte di lavoro
  const loadJobOffers = async () => {
    try {
      setJobsLoading(true);
      const offers = await jobService.getAllJobOffers();
      setJobOffers(offers);
      console.log('Offerte caricate:', offers);
    } catch (error) {
      console.error('Errore nel caricamento delle offerte:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  // Gestisce il click su "Candidati" per un'offerta specifica
  const handleApplyToJob = (job) => {
    console.log('Candidatura per offerta:', job);
    setSelectedJob(job);
    setCvFile(null);
    setShowApplicationModal(true);
  };

  // Gestisce l'upload del file CV con validazione migliorata
  const handleCVFileChange = (e) => {
    console.log('=== SELEZIONE FILE CV ===');
    const file = e.target.files[0];
    
    if (!file) {
      console.log('Nessun file selezionato');
      setCvFile(null);
      return;
    }

    console.log('File selezionato:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Valida il file secondo le specifiche
    const validation = jobService.validateCVFile(file);
    console.log('Risultato validazione:', validation);
    
    if (!validation.valid) {
      console.error('File non valido:', validation);
      
      // Mostra errore specifico basato sul tipo di validazione fallita
      if (validation.error === 'FileNonValido') {
        alert(`❌ Formato file non valido\n\n${validation.message}\n\nInserire un file nel formato corretto.`);
      } else if (validation.error === 'DimensioneMaxFileSuperata') {
        alert(`❌ File troppo grande\n\n${validation.message}\n\nInserire un file di dimensione inferiore al limite massimo.`);
      }
      
      // Reset del campo file
      e.target.value = '';
      setCvFile(null);
      return;
    }

    // File valido
    setCvFile(file);
    console.log('File CV validato e salvato:', file.name);
  };

  // ⭐ AGGIORNATA: Invia la candidatura con aggiornamento immediato della lista
  // Invia la candidatura con gestione errori migliorata
const handleSubmitApplication = async () => {
  console.log('=== INIZIO PROCESSO CANDIDATURA ===');
  console.log('Offerta selezionata:', selectedJob);
  console.log('Profilo candidato:', candidateProfile);
  console.log('File CV:', cvFile);

  // Validazioni iniziali
  if (!selectedJob) {
    alert('Errore: Nessuna offerta selezionata');
    return;
  }

  if (!candidateProfile) {
    alert('Errore: Profilo candidato non trovato');
    return;
  }

  if (!cvFile) {
    alert('Per favore, seleziona il tuo CV prima di inviare la candidatura.');
    return;
  }

  try {
    setSubmittingApplication(true);

    // Prepara i dati per l'invio
    const applicationData = {
      candidateId: candidateProfile.id || candidateProfile.documentId,
      jobOfferId: selectedJob.id || selectedJob.documentId,
      cvFile: cvFile
    };

    console.log('Dati candidatura preparati:', {
      candidateId: applicationData.candidateId,
      jobOfferId: applicationData.jobOfferId,
      cvFileName: applicationData.cvFile.name,
      cvFileSize: applicationData.cvFile.size,
      cvFileType: applicationData.cvFile.type
    });

    // Prima verifica che candidato e offerta esistano
    console.log('🔍 Verifica preliminare...');
    
    // Verifica candidato
    const token = getToken();
    const candidateCheck = await fetch(`${API_URL}/api/candidates/${applicationData.candidateId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!candidateCheck.ok) {
      throw new Error('Profilo candidato non valido o non trovato');
    }
    
    // Verifica offerta
    const offerCheck = await fetch(`${API_URL}/api/offerta-lavorativas/${applicationData.jobOfferId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!offerCheck.ok) {
      throw new Error('Offerta di lavoro non trovata o non più disponibile');
    }
    
    console.log('✅ Verifiche preliminari completate');

    // Invia la candidatura usando il metodo migliorato
    console.log('🚀 Invio candidatura...');
    const result = await jobService.debugSubmitApplication(applicationData);
    console.log('✅ Candidatura inviata con successo:', result);
    
    // Debug: Lista tutte le candidature per verificare
    await jobService.debugListAllApplications();
    
    // Aggiungi immediatamente l'ID dell'offerta alla lista delle candidate
    setAppliedJobIds(prev => new Set([...prev, selectedJob.id]));
    console.log('🎯 Offerta nascosta immediatamente:', selectedJob.id);
    
    // Successo - chiudi modal e mostra conferma
    setShowApplicationModal(false);
    alert('✅ Candidatura inviata con successo!\n\nLa tua candidatura è stata registrata e sarà esaminata dall\'azienda.');
    
    // Reset stati
    setSelectedJob(null);
    setCvFile(null);
    
    // Ricarica candidature dopo un momento per sincronizzare
    setTimeout(async () => {
      try {
        await loadUserApplications();
        console.log('✅ Candidature ricaricate dopo invio');
      } catch (error) {
        console.error('❌ Errore nel ricaricamento candidature:', error);
      }
    }, 1000);
    
    // Se siamo nella sezione candidature, forza il refresh
    if (activeSection === 'applications') {
      console.log('📄 Refresh forzato sezione candidature');
      setTimeout(() => {
        setActiveSection('dashboard');
        setTimeout(() => setActiveSection('applications'), 100);
      }, 1500);
    }
    
  } catch (error) {
    console.error('=== ERRORE CANDIDATURA ===');
    console.error('Errore completo:', error);
    console.error('Messaggio:', error.message);
    console.error('Stack:', error.stack);
    
    // Gestione errori specifici
    let errorMessage = 'Si è verificato un errore durante l\'invio della candidatura.';
    let technicalDetails = error.message;
    
    if (error.message.includes('FileNonValido')) {
      errorMessage = 'Il formato del file CV non è valido. Usa PDF, DOC o DOCX.';
    } else if (error.message.includes('DimensioneMaxFileSuperata')) {
      errorMessage = 'Il file CV è troppo grande. Dimensione massima: 5MB.';
    } else if (error.message.includes('Token')) {
      errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
    } else if (error.message.includes('Profilo candidato non valido')) {
      errorMessage = 'Il tuo profilo candidato non è valido. Verifica i tuoi dati nel profilo.';
    } else if (error.message.includes('Offerta di lavoro non trovata')) {
      errorMessage = 'L\'offerta di lavoro non è più disponibile. Potrebbe essere stata rimossa.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Risorsa non trovata. Candidato o offerta potrebbero essere stati eliminati.';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Non hai i permessi per inviare questa candidatura.';
    } else if (error.message.includes('400')) {
      errorMessage = 'Dati della candidatura non validi. Verifica i tuoi dati.';
    } else if (error.message.includes('Impossibile creare candidatura con nessun approccio')) {
      errorMessage = 'Problema di configurazione del sistema. Contatta l\'amministratore.';
      technicalDetails = 'Errore nella creazione candidatura: tutti gli approcci falliti. Verifica content-type "candidatura" in Strapi.';
    }
    
    alert(`❌ Errore nell'invio della candidatura\n\n${errorMessage}\n\nDettagli tecnici:\n${technicalDetails}`);
  } finally {
    setSubmittingApplication(false);
    console.log('=== FINE PROCESSO CANDIDATURA ===');
  }
};

  // ⭐ AGGIORNATA: Carica candidature e aggiorna gli ID delle offerte candidate
  const loadUserApplications = async () => {
    try {
      setApplicationsLoading(true);
      
      if (!candidateProfile?.id) {
        console.warn('⚠️ Profilo candidato non disponibile per caricare candidature');
        setUserApplications([]);
        setAppliedJobIds(new Set()); // Reset anche gli ID
        return;
      }
      
      console.log('Caricando candidature per candidato ID:', candidateProfile.id);
      
      const applications = await jobService.getCandidateApplications(candidateProfile.id);
      setUserApplications(applications);
      
      // ⭐ NUOVO: Aggiorna gli ID delle offerte già candidate
      updateAppliedJobIds(applications);
      
      console.log('✅ Candidature caricate:', applications.length, 'elementi');
      console.log('Candidature dettagli:', applications);
      
      // Salva nel localStorage per persistenza
      try {
        localStorage.setItem(`userApplications_${candidateProfile.id}`, JSON.stringify(applications));
      } catch (storageError) {
        console.warn('⚠️ Impossibile salvare candidature in localStorage:', storageError);
      }
      
    } catch (error) {
      console.error('❌ Errore nel caricamento delle candidature:', error);
      
      // Prova a caricare da localStorage come fallback
      try {
        const cachedApplications = localStorage.getItem(`userApplications_${candidateProfile?.id}`);
        if (cachedApplications) {
          const parsed = JSON.parse(cachedApplications);
          setUserApplications(parsed);
          updateAppliedJobIds(parsed); // ⭐ Aggiorna anche dalla cache
          console.log('📦 Candidature caricate dalla cache:', parsed.length);
        }
      } catch (cacheError) {
        console.warn('⚠️ Impossibile caricare candidature dalla cache:', cacheError);
      }
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleHomeRedirect = () => {
    logout();
    navigate('/');
  };

  // ⭐ AGGIORNATA: Dashboard con statistiche corrette
  const renderDashboardHome = () => {
    // Filtra le offerte disponibili per la dashboard
    const availableJobsCount = jobOffers.filter(job => {
      const jobId = job.id || job.documentId;
      return !appliedJobIds.has(jobId);
    }).length;

    return (
      <div className="dashboard-home">
        <div className="welcome-section">
          <h2>👋 Bentornato, {candidateProfile?.nomeCandidato || candidateProfile?.attributes?.nomeCandidato || user?.username}!</h2>
          <p>Ecco cosa puoi fare oggi:</p>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-number">{userApplications.length}</div>
            <div className="stat-label">Candidature Inviate</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{userApplications.filter(app => app.statoCandidatura === 'in_revisione').length}</div>
            <div className="stat-label">In Revisione</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{availableJobsCount}</div>
            <div className="stat-label">Offerte Disponibili</div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>🔔 Attività Recente</h3>
          <div className="activity-list">
            {notifications.slice(0, 3).map(notif => (
              <div key={notif.id} className={`activity-item ${notif.unread ? 'unread' : ''}`}>
                <div className="activity-text">{notif.text}</div>
                <div className="activity-time">{notif.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions">
          <h3>⚡ Azioni Rapide</h3>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={() => setActiveSection('jobs')}>
              <span className="btn-icon">🔍</span>
              Cerca Lavoro
            </button>
            <button className="action-btn secondary" onClick={() => setActiveSection('profile')}>
              <span className="btn-icon">👤</span>
              Aggiorna Profilo
            </button>
            <button className="action-btn secondary" onClick={() => setActiveSection('applications')}>
              <span className="btn-icon">📄</span>
              Le Mie Candidature
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="profile-section">
      <h2>👤 Il Mio Profilo</h2>
      {profileLoading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>
          Caricamento profilo...
        </div>
      ) : (
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h3>{user?.username}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          
          <div className="profile-form">
            <div className="form-group">
              <label>Nome</label>
              <input 
                type="text" 
                value={candidateProfile?.nomeCandidato || candidateProfile?.attributes?.nomeCandidato || ''} 
                disabled 
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label>Cognome</label>
              <input 
                type="text" 
                value={candidateProfile?.cognomeCandidato || candidateProfile?.attributes?.cognomeCandidato || ''} 
                disabled 
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label>Attitudini candidato</label>
              <textarea 
                value={attitudes}
                onChange={(e) => setAttitudes(e.target.value)}
                placeholder="Descrivi le tue attitudini personali e professionali (es. problem solving, lavoro in team, creatività...)"
              />
            </div>
            <div className="form-group">
              <label>Preferenze lavorative candidato</label>
              <textarea 
                value={workPreferences}
                onChange={(e) => setWorkPreferences(e.target.value)}
                placeholder="Descrivi le tue preferenze lavorative (es. tipo di contratto, orario, modalità di lavoro, settore preferito...)"
              />
            </div>
            <div className="form-group">
              <label>Interessi candidato</label>
              <textarea 
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Quali sono i tuoi interessi professionali e personali? Cosa ti appassiona?"
              />
            </div>
            <button 
              className="save-btn"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? '⏳ Salvataggio...' : '💾 Salva Profilo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ⭐ COMPLETAMENTE AGGIORNATA: Sezione offerte con filtraggio
  const renderJobs = () => {
    // Filtra le offerte escludendo quelle già candidate
    const availableJobs = jobOffers.filter(job => {
      const jobId = job.id || job.documentId;
      const isAlreadyApplied = appliedJobIds.has(jobId);
      
      if (isAlreadyApplied) {
        console.log('🚫 Nascondendo offerta già candidata:', job.titoloOffertaLavorativa, 'ID:', jobId);
      }
      
      return !isAlreadyApplied;
    });

    console.log('📋 Offerte disponibili dopo filtro:', availableJobs.length, 'di', jobOffers.length);

    return (
      <div className="jobs-section">
        <h2>🔍 Cerca Offerte di Lavoro</h2>
        
        <div className="search-filters">
          <div className="search-bar">
            <input type="text" placeholder="Cerca per posizione, azienda o competenze..." />
            <button className="search-btn" onClick={loadJobOffers}>🔍</button>
          </div>
          <div className="filters">
            <select>
              <option>Tutte le città</option>
              <option>Milano</option>
              <option>Roma</option>
              <option>Torino</option>
            </select>
            <select>
              <option>Tutti i settori</option>
              <option>Tecnologia</option>
              <option>Marketing</option>
              <option>Design</option>
            </select>
            <select>
              <option>Tipo di contratto</option>
              <option>Tempo pieno</option>
              <option>Part-time</option>
              <option>Freelance</option>
            </select>
          </div>
        </div>

        {/* ⭐ NUOVO: Statistiche offerte */}
        {jobOffers.length > 0 && (
          <div style={{ 
            background: '#f8fafc', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#64748b' }}>
              <span>📊 Totale offerte: <strong>{jobOffers.length}</strong></span>
              <span>✅ Già candidate: <strong>{appliedJobIds.size}</strong></span>
              <span>🆕 Disponibili: <strong>{availableJobs.length}</strong></span>
            </div>
          </div>
        )}

        {jobsLoading ? (
          <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>
            Caricamento offerte di lavoro...
          </div>
        ) : (
          <div className="job-listings">
            {availableJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                {jobOffers.length === 0 ? (
                  <>
                    <h3>📭 Nessuna offerta disponibile</h3>
                    <p>Al momento non ci sono offerte di lavoro pubblicate.</p>
                    <p>Torna più tardi o contatta le aziende direttamente!</p>
                  </>
                ) : (
                  <>
                    <h3>🎉 Hai candidato per tutte le offerte disponibili!</h3>
                    <p>Hai inviato candidature per tutte le {jobOffers.length} offerte pubblicate.</p>
                    <p>Controlla le tue candidature nella sezione "Le Mie Candidature".</p>
                    <button 
                      className="action-btn primary" 
                      onClick={() => setActiveSection('applications')}
                      style={{ marginTop: '1rem' }}
                    >
                      📄 Vedi Le Mie Candidature
                    </button>
                  </>
                )}
              </div>
            ) : (
              availableJobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3>{job.titoloOffertaLavorativa || 'Posizione non specificata'}</h3>
                    <div className="job-meta">
                      <span className="job-contract-type">
                        {jobService.formatContractType(job.tipoContratto)}
                      </span>
                      <span className="job-experience-level">
                        {jobService.formatExperienceLevel(job.livelloEsperienza)}
                      </span>
                    </div>
                  </div>
                  <p className="job-company">
                    {job.aziendas && job.aziendas.length > 0 
                      ? `${job.aziendas[0].nomeAzienda} • ${job.aziendas[0].sedeAzienda || 'Sede non specificata'}`
                      : 'Azienda non specificata'
                    }
                  </p>
                  <p className="job-description">
                    {job.descrizioneOffertaLavorativa || 'Descrizione non disponibile'}
                  </p>
                  <div className="job-details">
                    <p><strong>Pubblicata:</strong> {jobService.formatDate(job.dataPubblicazione)}</p>
                    {job.dataScadenza && (
                      <p>
                        <strong>Scadenza:</strong> 
                        <span className={jobService.isJobExpired(job.dataScadenza) ? 'expired' : 'active'}>
                          {jobService.formatDate(job.dataScadenza)}
                          {jobService.isJobExpired(job.dataScadenza) && ' (SCADUTA)'}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="job-tags">
                    <span className="tag">{jobService.formatContractType(job.tipoContratto)}</span>
                    <span className="tag">{jobService.formatExperienceLevel(job.livelloEsperienza)}</span>
                    {job.competenzeRichieste && (
                      <span className="tag">Competenze richieste</span>
                    )}
                  </div>
                  <div className="job-actions">
                    <button 
                      className={`apply-btn ${jobService.isJobExpired(job.dataScadenza) ? 'disabled' : ''}`}
                      onClick={() => handleApplyToJob(job)}
                      disabled={jobService.isJobExpired(job.dataScadenza)}
                    >
                      {jobService.isJobExpired(job.dataScadenza) ? '❌ Scaduta' : '📝 Candidati'}
                    </button>
                    <button className="save-job-btn">💾</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal candidatura */}
        {showApplicationModal && selectedJob && (
          <div className="application-modal-overlay" onClick={() => setShowApplicationModal(false)}>
            <div className="application-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📝 Candidati per: {selectedJob.titoloOffertaLavorativa}</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowApplicationModal(false)}
                >
                  ✖️
                </button>
              </div>
              
              <div className="modal-body">
                <div className="job-details">
                  <p><strong>Posizione:</strong> {selectedJob.titoloOffertaLavorativa}</p>
                  <p><strong>Azienda:</strong> {selectedJob.aziendas && selectedJob.aziendas.length > 0 ? selectedJob.aziendas[0].nomeAzienda : 'Non specificata'}</p>
                  <p><strong>Sede:</strong> {selectedJob.aziendas && selectedJob.aziendas.length > 0 ? selectedJob.aziendas[0].sedeAzienda || 'Non specificata' : 'Non specificata'}</p>
                  <p><strong>Tipo contratto:</strong> {jobService.formatContractType(selectedJob.tipoContratto)}</p>
                  <p><strong>Livello esperienza:</strong> {jobService.formatExperienceLevel(selectedJob.livelloEsperienza)}</p>
                  <p><strong>Descrizione:</strong> {selectedJob.descrizioneOffertaLavorativa}</p>
                  {selectedJob.competenzeRichieste && (
                    <div>
                      <p><strong>Competenze richieste:</strong></p>
                      <div dangerouslySetInnerHTML={{ __html: selectedJob.competenzeRichieste }} />
                    </div>
                  )}
                  {selectedJob.dataScadenza && (
                    <p><strong>Scadenza candidature:</strong> {jobService.formatDate(selectedJob.dataScadenza)}</p>
                  )}
                </div>

                <div className="application-form">
                  <div className="form-group">
                    <label>Carica il tuo CV *</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCVFileChange}
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      Formati accettati: PDF, DOC, DOCX (max 5MB)
                    </small>
                    {cvFile && (
                      <p style={{ color: '#10b981', marginTop: '0.5rem' }}>
                        ✅ File selezionato: {cvFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowApplicationModal(false)}
                  disabled={submittingApplication}
                >
                  Annulla
                </button>
                <button 
                  className="submit-application-btn"
                  onClick={handleSubmitApplication}
                  disabled={submittingApplication || !cvFile}
                >
                  {submittingApplication ? '⏳ Invio...' : '📤 Invia Candidatura'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderApplications = () => (
    <div className="applications-section">
      <h2>📄 Le Mie Candidature</h2>
      
      {applicationsLoading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>
          Caricamento candidature...
        </div>
      ) : (
        <>
          <div className="applications-stats">
            <div className="app-stat">
              <span className="stat-number">{userApplications.length}</span>
              <span className="stat-label">Totali</span>
            </div>
            <div className="app-stat">
              <span className="stat-number">{userApplications.filter(app => app.statoCandidatura === 'inviata').length}</span>
              <span className="stat-label">Inviate</span>
            </div>
            <div className="app-stat">
              <span className="stat-number">{userApplications.filter(app => app.statoCandidatura === 'in_revisione').length}</span>
              <span className="stat-label">In Revisione</span>
            </div>
            <div className="app-stat">
              <span className="stat-number">{userApplications.filter(app => app.statoCandidatura === 'approvata').length}</span>
              <span className="stat-label">Approvate</span>
            </div>
          </div>

          <div className="applications-list">
            {userApplications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <h3>📝 Nessuna candidatura inviata</h3>
                <p>Non hai ancora inviato candidature.</p>
                <button 
                  className="action-btn primary" 
                  onClick={() => setActiveSection('jobs')}
                  style={{ marginTop: '1rem' }}
                >
                  🔍 Cerca Lavoro
                </button>
              </div>
            ) : (
              userApplications.map(app => (
                <div key={app.id} className="application-card">
                  <div className="app-info">
                    <h3>{app.offerta_lavorativa?.titoloOffertaLavorativa || 'Posizione non specificata'}</h3>
                    <p>{app.offerta_lavorativa?.aziendas?.[0]?.nomeAzienda || 'Azienda non specificata'}</p>
                    <span className="app-date">
                      Candidatura del {new Date(app.createdAt).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <div className="app-status">
                    <span className={`status-badge ${jobService.getStatusClass(app.statoCandidatura)}`}>
                      {jobService.formatApplicationStatus(app.statoCandidatura)}
                    </span>
                  </div>
                  <div className="app-actions">
                    <button className="view-btn">👁️ Visualizza</button>
                    {app.curriculum && (
                      <button className="download-cv-btn">📄 CV</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="chat-section">
      <h2>💬 Messaggi</h2>
      
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-search">
            <input type="text" placeholder="Cerca conversazioni..." />
          </div>
          <div className="conversations-list">
            <div className="conversation-item active">
              <div className="conversation-avatar">TS</div>
              <div className="conversation-info">
                <h4>Tech Solutions SRL</h4>
                <p>Quando puoi fare il colloquio?</p>
                <span className="message-time">10:30</span>
              </div>
              <div className="unread-badge">2</div>
            </div>
            <div className="conversation-item">
              <div className="conversation-avatar">DA</div>
              <div className="conversation-info">
                <h4>Digital Agency</h4>
                <p>Grazie per la candidatura</p>
                <span className="message-time">Ieri</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="chat-main">
          <div className="chat-header">
            <h3>Tech Solutions SRL</h3>
            <span>Online</span>
          </div>
          <div className="chat-messages">
            <div className="message received">
              <p>Ciao! Abbiamo ricevuto la tua candidatura per la posizione di Frontend Developer.</p>
              <span className="message-time">09:15</span>
            </div>
            <div className="message sent">
              <p>Grazie! Sono molto interessato alla posizione.</p>
              <span className="message-time">09:20</span>
            </div>
            <div className="message received">
              <p>Perfetto! Quando saresti disponibile per un colloquio telefonico?</p>
              <span className="message-time">10:30</span>
            </div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Scrivi un messaggio..." />
            <button className="send-btn">📤</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="notifications-section">
      <h2>🔔 Notifiche</h2>
      
      <div className="notifications-header">
        <button className="mark-all-read">Segna tutte come lette</button>
      </div>

      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
            <div className="notification-content">
              <p>{notif.text}</p>
              <span className="notification-time">{notif.time}</span>
            </div>
            {notif.unread && <div className="unread-dot"></div>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <h2>⚙️ Impostazioni</h2>

      <div className="settings-groups">
        <div className="settings-group">
          <h3>Preferenze Account</h3>
          <div className="setting-item">
            <label>Email per notifiche</label>
            <input type="email" value={user?.email} readOnly />
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Ricevi notifiche email per nuove offerte
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Ricevi aggiornamenti sulle candidature
            </label>
          </div>
        </div>

        <div className="settings-group">
          <h3>Privacy</h3>
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              Rendi il profilo visibile alle aziende
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input type="checkbox" />
              Ricevi messaggi diretti dalle aziende
            </label>
          </div>
        </div>

        <div className="settings-group danger-zone">
          <h3>Zona Pericolosa</h3>
          <div className="setting-item">
            <button className="danger-btn">🗑️ Elimina Account</button>
            <p className="danger-text">Questa azione è irreversibile</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard': return renderDashboardHome();
      case 'profile': return renderProfile();
      case 'jobs': return renderJobs();
      case 'applications': return renderApplications();
      case 'chat': return renderChat();
      case 'notifications': return renderNotifications();
      case 'settings': return renderSettings();
      default: return renderDashboardHome();
    }
  };

  return (
    <div className="candidate-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>GoJob! 👨‍💼</h1>
        </div>
        <div className="header-right">
          <button className="notification-btn" onClick={() => setActiveSection('notifications')}>
            🔔
            <span className="notification-count">3</span>
          </button>
          <div className="user-menu">
            <div className="header-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span>{user?.username}</span>
            <button onClick={handleHomeRedirect} className="home-btn">🏠 Home</button>
            <button onClick={logout} className="logout-btn">🚪 Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar */}
        <nav className="dashboard-sidebar">
          <ul className="nav-menu">
            <li>
              <button 
                className={activeSection === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveSection('dashboard')}
              >
                <span className="nav-icon">🏠</span>
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'profile' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveSection('profile')}
              >
                <span className="nav-icon">👤</span>
                Il Mio Profilo
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'jobs' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveSection('jobs')}
              >
                <span className="nav-icon">🔍</span>
                Cerca Lavoro
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'applications' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveSection('applications')}
              >
                <span className="nav-icon">📄</span>
                Le Mie Candidature
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'chat' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveSection('chat')}
              >
                <span className="nav-icon">💬</span>
                Messaggi
                <span className="chat-badge">2</span>
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'notifications' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveSection('notifications')}
              >
                <span className="nav-icon">🔔</span>
                Notifiche
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'settings' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveSection('settings')}
              >
                <span className="nav-icon">⚙️</span>
                Impostazioni
              </button>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );

}

export default CandidateDashboard;
