import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './CandidateDashboard.css';
import { aziendaService } from './aziendaService';
import { companyJobService } from './companyJobService';
import { companyApplicationsService } from './companyApplicationsService';

function AziendaDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  const [aziendaProfile, setAziendaProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [partitaIva, setPartitaIva] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [sede, setSede] = useState('');

  // Stati per gestione offerte lavorative
  const [companyJobOffers, setCompanyJobOffers] = useState([]);
  const [jobOffersLoading, setJobOffersLoading] = useState(false);
  const [showJobOfferModal, setShowJobOfferModal] = useState(false);
  const [editingJobOffer, setEditingJobOffer] = useState(null);
  const [savingJobOffer, setSavingJobOffer] = useState(false);

  // Stati per gestione candidature
  const [companyApplications, setCompanyApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');

  // Stati form offerta lavorativa
  const [jobOfferForm, setJobOfferForm] = useState({
    titoloOffertaLavorativa: '',
    descrizioneOffertaLavorativa: '',
    tipoContratto: '',
    livelloEsperienza: '',
    competenzeRichieste: '',
    dataPubblicazione: '',
    dataScadenza: ''
  });

  // Carica profilo all'avvio
  useEffect(() => {
    const initializeAziendaData = async () => {
      if (user?.email && user?.jwt) {
        console.log('=== INIZIALIZZAZIONE DASHBOARD AZIENDA ===');
        console.log('User email:', user.email);
        console.log('JWT presente:', !!user.jwt);
        
        try {
          await loadProfile();
          console.log('✅ Profilo azienda caricato');
        } catch (error) {
          console.error('❌ Errore caricamento profilo azienda:', error);
        }
      }
    };

    initializeAziendaData();
  }, [user?.email, user?.jwt]);

  // Carica offerte e candidature quando il profilo è disponibile
  useEffect(() => {
    const loadCompanyData = async () => {
      if (aziendaProfile?.id) {
        console.log('=== CARICAMENTO DATI AZIENDA ===');
        console.log('Profilo azienda disponibile, ID:', aziendaProfile.id);
        
        try {
          await Promise.all([
            loadCompanyJobOffers(),
            loadCompanyApplications()
          ]);
          console.log('✅ Dati azienda caricati');
        } catch (error) {
          console.error('❌ Errore caricamento dati azienda:', error);
        }
      }
    };

    loadCompanyData();
  }, [aziendaProfile?.id]);

  // Refresh quando si entra nelle sezioni specifiche
  useEffect(() => {
    const refreshSectionData = async () => {
      if (!aziendaProfile?.id) return;

      if (activeSection === 'jobposts') {
        try {
          await loadCompanyJobOffers();
        } catch (error) {
          console.error('❌ Errore refresh offerte:', error);
        }
      } else if (activeSection === 'candidates') {
        try {
          await loadCompanyApplications();
        } catch (error) {
          console.error('❌ Errore refresh candidature:', error);
        }
      }
    };

    refreshSectionData();
  }, [activeSection, aziendaProfile?.id]);

  // Effetto per aggiornare gli stati locali quando il profilo cambia
  useEffect(() => {
    if (aziendaProfile) {
      console.log('Struttura completa aziendaProfile:', aziendaProfile);
      
      let attr = null;
      
      if (aziendaProfile.attributes) {
        attr = aziendaProfile.attributes;
      } else if (aziendaProfile.data && aziendaProfile.data.attributes) {
        attr = aziendaProfile.data.attributes;
      } else {
        attr = aziendaProfile;
      }
      
      console.log('Attributi trovati:', attr);
      
      if (attr) {
        setNome(attr.nomeAzienda || '');
        setEmail(attr.emailAzienda || '');
        setPartitaIva(attr.partitaIva || '');
        setDescrizione(attr.descrizioneAzienda || '');
        setSede(attr.sedeAzienda || '');
      }
    }
  }, [aziendaProfile]);

  // Carica profilo azienda
  const loadProfile = async () => {
    try {
      console.log('🟡 INIZIO loadProfile');
      setProfileLoading(true);
      
      const profile = await aziendaService.getProfile(user);
      
      if (profile) {
        setAziendaProfile(profile);
        console.log('✅ Profilo azienda impostato');
        
        try {
          localStorage.setItem(`aziendaProfile_${user.email}`, JSON.stringify(profile));
        } catch (storageError) {
          console.warn('⚠️ Impossibile salvare profilo in localStorage:', storageError);
        }
      } else {
        console.warn('⚠️ Nessun profilo azienda trovato.');
        
        try {
          const cachedProfile = localStorage.getItem(`aziendaProfile_${user.email}`);
          if (cachedProfile) {
            const parsed = JSON.parse(cachedProfile);
            setAziendaProfile(parsed);
            console.log('📦 Profilo azienda caricato dalla cache');
          }
        } catch (cacheError) {
          console.warn('⚠️ Impossibile caricare profilo dalla cache:', cacheError);
        }
      }
    } catch (error) {
      console.error('❌ ERRORE in loadProfile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Carica offerte azienda
  const loadCompanyJobOffers = async () => {
    try {
      setJobOffersLoading(true);
      
      if (!aziendaProfile?.id) {
        console.warn('⚠️ Profilo azienda non disponibile per caricare offerte');
        setCompanyJobOffers([]);
        return;
      }
      
      const offers = await companyJobService.getCompanyJobOffers(aziendaProfile.id);
      setCompanyJobOffers(offers);
      
      console.log('✅ Offerte azienda caricate:', offers.length, 'elementi');
      
    } catch (error) {
      console.error('❌ Errore nel caricamento delle offerte azienda:', error);
    } finally {
      setJobOffersLoading(false);
    }
  };

  // Carica candidature ricevute dall'azienda
  const loadCompanyApplications = async () => {
    try {
      setApplicationsLoading(true);
      
      if (!aziendaProfile?.id) {
        console.warn('⚠️ Profilo azienda non disponibile per caricare candidature');
        setCompanyApplications([]);
        return;
      }
      
      console.log('🔄 Caricamento candidature per azienda ID:', aziendaProfile.id);
      
      const applications = await companyApplicationsService.getCompanyApplications(aziendaProfile.id);
      setCompanyApplications(applications);
      
      console.log('✅ Candidature azienda caricate:', applications.length, 'elementi');
      
      // Salva nel localStorage per persistenza
      try {
        localStorage.setItem(`companyApplications_${aziendaProfile.id}`, JSON.stringify(applications));
      } catch (storageError) {
        console.warn('⚠️ Impossibile salvare candidature in localStorage:', storageError);
      }
      
    } catch (error) {
      console.error('❌ Errore nel caricamento delle candidature azienda:', error);
      
      // Prova a caricare dalla cache
      try {
        const cachedApplications = localStorage.getItem(`companyApplications_${aziendaProfile?.id}`);
        if (cachedApplications) {
          const parsed = JSON.parse(cachedApplications);
          setCompanyApplications(parsed);
          console.log('📦 Candidature caricate dalla cache:', parsed.length);
        }
      } catch (cacheError) {
        console.warn('⚠️ Impossibile caricare candidature dalla cache:', cacheError);
      }
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Gestisce il cambio di stato di una candidatura - VERSIONE MIGLIORATA
  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    try {
      setUpdatingStatus(true);
      
      console.log('🔄 Aggiornamento stato candidatura:', { applicationId, newStatus });
      
      // Prima verifica che la candidatura esista
      const existingApp = await companyApplicationsService.checkApplicationExists(applicationId);
      if (!existingApp) {
        throw new Error('Candidatura non trovata');
      }
      
      console.log('✅ Candidatura verificata, procedo con aggiornamento');
      
      // Prova prima con il metodo semplice
      try {
        await companyApplicationsService.updateApplicationStatusSimple(applicationId, newStatus);
        console.log('✅ Aggiornamento riuscito con metodo semplice');
      } catch (simpleError) {
        console.log('❌ Metodo semplice fallito, provo con metodo completo:', simpleError.message);
        
        // Se il metodo semplice fallisce, prova con quello completo
        await companyApplicationsService.updateApplicationStatus(applicationId, newStatus, statusNotes);
        console.log('✅ Aggiornamento riuscito con metodo completo');
      }
      
      // Ricarica le candidature per vedere i cambiamenti
      await loadCompanyApplications();
      
      // Chiudi il modal e reset
      setShowApplicationModal(false);
      setSelectedApplication(null);
      setStatusNotes('');
      
      // Mostra messaggio di successo
      const statusLabel = companyApplicationsService.formatStatus(newStatus);
      alert(`✅ Stato candidatura aggiornato a: ${statusLabel}`);
      
    } catch (error) {
      console.error('❌ Errore aggiornamento stato candidatura:', error);
      
      // Gestione errori specifici
      let errorMessage = 'Si è verificato un errore durante l\'aggiornamento dello stato.';
      
      if (error.message.includes('non trovata')) {
        errorMessage = 'La candidatura selezionata non è più disponibile.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Non hai i permessi per modificare questa candidatura.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Dati non validi per l\'aggiornamento dello stato.';
      } else if (error.message.includes('Token')) {
        errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
      }
      
      alert(`❌ Errore nell'aggiornamento dello stato\n\n${errorMessage}\n\nDettagli: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Funzione per testare l'aggiornamento stato (per debug)
  const testStatusUpdate = async (applicationId) => {
    try {
      console.log('🧪 Test aggiornamento stato per:', applicationId);
      
      // Verifica esistenza
      const app = await companyApplicationsService.checkApplicationExists(applicationId);
      console.log('📋 Candidatura esistente:', !!app);
      
      if (app) {
        console.log('📊 Stato attuale:', app.statoCandidatura);
        
        // Test cambio a "in_revisione"
        await companyApplicationsService.updateApplicationStatusSimple(applicationId, 'in_revisione');
        console.log('✅ Test riuscito');
        
        // Ricarica
        await loadCompanyApplications();
      }
    } catch (error) {
      console.error('❌ Test fallito:', error);
    }
  };

  // Apre il modal per gestire una candidatura
  const handleManageApplication = (application) => {
    console.log('Gestione candidatura:', application);
    setSelectedApplication(application);
    setStatusNotes('');
    setShowApplicationModal(true);
  };

  // Apri modal per nuova offerta
  const handleCreateJobOffer = () => {
    setEditingJobOffer(null);
    setJobOfferForm({
      titoloOffertaLavorativa: '',
      descrizioneOffertaLavorativa: '',
      tipoContratto: '',
      livelloEsperienza: '',
      competenzeRichieste: '',
      dataPubblicazione: '',
      dataScadenza: ''
    });
    setShowJobOfferModal(true);
  };

  // Apri modal per modifica offerta
  const handleEditJobOffer = (jobOffer) => {
    setEditingJobOffer(jobOffer);
    setJobOfferForm({
      titoloOffertaLavorativa: jobOffer.titoloOffertaLavorativa || '',
      descrizioneOffertaLavorativa: jobOffer.descrizioneOffertaLavorativa || '',
      tipoContratto: jobOffer.tipoContratto || '',
      livelloEsperienza: jobOffer.livelloEsperienza || '',
      competenzeRichieste: jobOffer.competenzeRichieste || '',
      dataPubblicazione: companyJobService.formatDateForInput(jobOffer.dataPubblicazione),
      dataScadenza: companyJobService.formatDateForInput(jobOffer.dataScadenza)
    });
    setShowJobOfferModal(true);
  };

  // Gestisce l'invio del form offerta
  const handleSubmitJobOffer = async () => {
    if (!aziendaProfile) {
      alert('Errore: Profilo azienda non trovato');
      return;
    }

    try {
      setSavingJobOffer(true);

      if (editingJobOffer) {
        await companyJobService.updateJobOffer(editingJobOffer.documentId || editingJobOffer.id, jobOfferForm);
        alert('✅ Offerta modificata con successo!');
      } else {
        await companyJobService.createJobOffer(jobOfferForm, aziendaProfile.id);
        alert('✅ Offerta creata e pubblicata con successo!');
      }

      setShowJobOfferModal(false);
      setEditingJobOffer(null);
      
      setTimeout(async () => {
        try {
          await loadCompanyJobOffers();
        } catch (error) {
          console.error('❌ Errore nel ricaricamento offerte:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Errore nel salvataggio offerta:', error);
      
      if (error.message.includes('Rilevati errori nei dati inseriti')) {
        alert(`❌ Offerta incompleta\n\n${error.message}\n\nCorreggi i dati inseriti.`);
      } else {
        alert(`❌ Errore nel salvataggio dell'offerta\n\n${error.message}`);
      }
    } finally {
      setSavingJobOffer(false);
    }
  };

  // Elimina offerta
  const handleDeleteJobOffer = async (jobOffer) => {
    if (!confirm(`Sei sicuro di voler eliminare l'offerta "${jobOffer.titoloOffertaLavorativa}"?`)) {
      return;
    }

    try {
      await companyJobService.deleteJobOffer(jobOffer.documentId || jobOffer.id);
      alert('✅ Offerta eliminata con successo!');
      
      setTimeout(async () => {
        try {
          await loadCompanyJobOffers();
        } catch (error) {
          console.error('❌ Errore nel ricaricamento dopo eliminazione:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Errore nell\'eliminazione offerta:', error);
      alert('❌ Errore nell\'eliminazione dell\'offerta');
    }
  };

  // Aggiorna campo form offerta
  const updateJobOfferForm = (field, value) => {
    setJobOfferForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!aziendaProfile) {
      alert('Profilo non caricato');
      return;
    }

    try {
      setSaving(true);
      
      const updatedData = {
        partitaIva: partitaIva || '',
        descrizioneAzienda: descrizione || '',
        sedeAzienda: sede || ''
      };

      await aziendaService.updateProfile(
        aziendaProfile.documentId || aziendaProfile.id, 
        updatedData, 
        user.jwt
      );
      
      alert('Profilo aggiornato con successo!');
      await loadProfile();
      
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert(`Errore durante il salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Dashboard con statistiche candidature
  const renderDashboardHome = () => {
    const jobStats = companyJobService.getJobOfferStats(companyJobOffers);
    const applicationStats = companyApplicationsService.getApplicationsStats(companyApplications);
    
    return (
      <div className="dashboard-home">
        <div className="welcome-section">
          <h2>👋 Benvenuto, {user?.username}!</h2>
          <p>Gestisci le tue offerte di lavoro e i candidati interessati.</p>
        </div>
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-number">{jobStats.published}</div>
            <div className="stat-label">Offerte Pubblicate</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{applicationStats.total}</div>
            <div className="stat-label">Candidature Ricevute</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{applicationStats.interviews}</div>
            <div className="stat-label">Colloqui Programmati</div>
          </div>
        </div>
      </div>
    );
  };

  // Sezione candidature ricevute
  const renderCandidates = () => {
    // Filtra e cerca candidature
    let filteredApplications = companyApplicationsService.filterApplicationsByStatus(
      companyApplications, 
      applicationFilter
    );
    
    if (applicationSearch.trim()) {
      filteredApplications = companyApplicationsService.searchApplications(
        filteredApplications, 
        applicationSearch
      );
    }

    // Ordina per data (più recenti prima)
    filteredApplications = companyApplicationsService.sortApplicationsByDate(filteredApplications);

    const stats = companyApplicationsService.getApplicationsStats(companyApplications);

    return (
      <div className="applications-section">
        <h2>👥 Candidature Ricevute</h2>
        
        {/* Statistiche */}
        <div className="applications-stats">
          <div className="app-stat">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Totali</span>
          </div>
          <div className="app-stat">
            <span className="stat-number">{stats.received}</span>
            <span className="stat-label">Ricevute</span>
          </div>
          <div className="app-stat">
            <span className="stat-number">{stats.inReview}</span>
            <span className="stat-label">In Revisione</span>
          </div>
          <div className="app-stat">
            <span className="stat-number">{stats.interviews}</span>
            <span className="stat-label">Colloqui</span>
          </div>
          <div className="app-stat">
            <span className="stat-number">{stats.approved}</span>
            <span className="stat-label">Approvate</span>
          </div>
        </div>

        {/* Filtri e ricerca */}
        <div className="search-filters" style={{ marginBottom: '2rem' }}>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Cerca per nome candidato o posizione..." 
              value={applicationSearch}
              onChange={(e) => setApplicationSearch(e.target.value)}
            />
            <button className="search-btn" onClick={() => loadCompanyApplications()}>🔍</button>
          </div>
          <div className="filters">
            <select 
              value={applicationFilter} 
              onChange={(e) => setApplicationFilter(e.target.value)}
            >
              <option value="all">Tutti gli stati</option>
              {companyApplicationsService.getApplicationStatuses().map(status => (
                <option key={status.value} value={status.value}>
                  {status.icon} {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {applicationsLoading ? (
          <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>
            Caricamento candidature...
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                {companyApplications.length === 0 ? (
                  <>
                    <h3>📭 Nessuna candidatura ricevuta</h3>
                    <p>Non hai ancora ricevuto candidature per le tue offerte.</p>
                    <p>Assicurati di aver pubblicato delle offerte di lavoro!</p>
                  </>
                ) : (
                  <>
                    <h3>🔍 Nessun risultato</h3>
                    <p>Nessuna candidatura corrisponde ai filtri applicati.</p>
                    <button 
                      className="action-btn secondary"
                      onClick={() => {
                        setApplicationFilter('all');
                        setApplicationSearch('');
                      }}
                    >
                      🗑️ Pulisci Filtri
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredApplications.map(app => (
                <div key={app.id} className="application-card">
                  <div className="app-info">
                    <h3>{companyApplicationsService.getCandidateName(app)}</h3>
                    <p><strong>Posizione:</strong> {companyApplicationsService.getJobTitle(app)}</p>
                    <span className="app-date">
                      Candidatura {companyApplicationsService.formatApplicationDate(app.createdAt)}
                    </span>
                  </div>
                  <div className="app-status">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: companyApplicationsService.getStatusColor(app.statoCandidatura),
                        color: 'white'
                      }}
                    >
                      {companyApplicationsService.getStatusIcon(app.statoCandidatura)} {companyApplicationsService.formatStatus(app.statoCandidatura)}
                    </span>
                  </div>
                  <div className="app-actions">
                    <button 
                      className="view-btn"
                      onClick={() => handleManageApplication(app)}
                    >
                      👁️ Gestisci
                    </button>
                    {companyApplicationsService.getCVDownloadUrl(app) && (
                      <a 
                        href={companyApplicationsService.getCVDownloadUrl(app)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="download-cv-btn"
                        style={{ textDecoration: 'none' }}
                      >
                        📄 CV
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal gestione candidatura - VERSIONE MIGLIORATA */}
        {showApplicationModal && selectedApplication && (
          <div className="application-modal-overlay" onClick={() => setShowApplicationModal(false)}>
            <div className="application-modal application-management-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>👥 Gestione Candidatura</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowApplicationModal(false)}
                >
                  ✖️
                </button>
              </div>
              
              <div className="modal-body">
                {/* Informazioni di debug */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace'
                }}>
                  <strong>Debug Info:</strong> ID: {selectedApplication.id}, 
                  Stato: {selectedApplication.statoCandidatura}
                </div>

                <div className="application-details">
                  <h4>📋 Dettagli Candidatura</h4>
                  <div className="detail-grid">
                    <div><strong>Candidato:</strong> {companyApplicationsService.getCandidateName(selectedApplication)}</div>
                    <div><strong>Posizione:</strong> {companyApplicationsService.getJobTitle(selectedApplication)}</div>
                    <div><strong>Data candidatura:</strong> {companyApplicationsService.formatApplicationDate(selectedApplication.createdAt)}</div>
                    <div>
                      <strong>Stato attuale:</strong> 
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: companyApplicationsService.getStatusColor(selectedApplication.statoCandidatura),
                          color: 'white',
                          marginLeft: '0.5rem'
                        }}
                      >
                        {companyApplicationsService.getStatusIcon(selectedApplication.statoCandidatura)} 
                        {companyApplicationsService.formatStatus(selectedApplication.statoCandidatura)}
                      </span>
                    </div>
                  </div>
                  
                  {companyApplicationsService.getCVDownloadUrl(selectedApplication) && (
                    <div style={{ marginTop: '1rem' }}>
                      <a 
                        href={companyApplicationsService.getCVDownloadUrl(selectedApplication)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="download-cv-btn"
                        style={{ textDecoration: 'none', display: 'inline-block' }}
                      >
                        📄 Scarica CV
                      </a>
                    </div>
                  )}
                </div>

                <div className="status-management">
                  <h4>🔄 Cambia Stato</h4>
                  
                  {/* Pulsante di test (per debug) */}
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => testStatusUpdate(selectedApplication.id)}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      🧪 Test Aggiornamento
                    </button>
                  </div>

                  <div className="status-buttons">
                    {companyApplicationsService.getApplicationStatuses().map(status => (
                      <button
                        key={status.value}
                        className={`status-btn ${selectedApplication.statoCandidatura === status.value ? 'active' : ''}`}
                        style={{ 
                          backgroundColor: selectedApplication.statoCandidatura === status.value ? status.color : '#f1f5f9',
                          color: selectedApplication.statoCandidatura === status.value ? 'white' : '#374151',
                          border: `2px solid ${status.color}`,
                          margin: '0.25rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          opacity: updatingStatus ? 0.6 : 1
                        }}
                        onClick={() => handleUpdateApplicationStatus(selectedApplication.id, status.value)}
                        disabled={updatingStatus || selectedApplication.statoCandidatura === status.value}
                      >
                        {updatingStatus ? '⏳' : status.icon} {status.label}
                        {selectedApplication.statoCandidatura === status.value && ' (Attuale)'}
                      </button>
                    ))}
                  </div>
                  
                  {/* Campo note opzionale */}
                  <div style={{ marginTop: '1rem' }}>
                    <label>📝 Note (opzionale):</label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Aggiungi note per questo aggiornamento di stato..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginTop: '0.5rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowApplicationModal(false)}
                  disabled={updatingStatus}
                >
                  Chiudi
                </button>
                
                {updatingStatus && (
                  <div style={{ 
                    color: '#667eea', 
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>⏳</span>
                    Aggiornamento in corso...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderJobPosts = () => (
    <div className="jobs-section">
      <h2>📢 Le Mie Offerte</h2>
      
      <div className="job-posts-header">
        <button 
          className="create-job-btn"
          onClick={handleCreateJobOffer}
        >
          ➕ Crea Nuova Offerta
        </button>
      </div>

      {jobOffersLoading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>
          Caricamento offerte...
        </div>
      ) : (
        <div className="job-listings">
          {companyJobOffers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <h3>📝 Nessuna offerta pubblicata</h3>
              <p>Non hai ancora creato offerte di lavoro.</p>
              <button 
                className="action-btn primary" 
                onClick={handleCreateJobOffer}
                style={{ marginTop: '1rem' }}
              >
                ➕ Crea Prima Offerta
              </button>
            </div>
          ) : (
            companyJobOffers.map(job => (
              <div key={job.id} className="job-card company-job-card">
                <div className="job-header">
                  <h3>{job.titoloOffertaLavorativa}</h3>
                  <div className="job-status">
                    <span className={`status-badge ${job.publishedAt ? 'published' : 'draft'}`}>
                      {job.publishedAt ? '🟢 Pubblicata' : '🟡 Bozza'}
                    </span>
                  </div>
                </div>
                <p className="job-company">{nome} • {sede}</p>
                <p className="job-description">{job.descrizioneOffertaLavorativa}</p>
                <div className="job-meta">
                  <span className="job-contract">{companyJobService.getContractTypes().find(t => t.value === job.tipoContratto)?.label}</span>
                  <span className="job-experience">{companyJobService.getExperienceLevels().find(l => l.value === job.livelloEsperienza)?.label}</span>
                  {job.dataScadenza && (
                    <span className="job-deadline">
                      Scade: {new Date(job.dataScadenza).toLocaleDateString('it-IT')}
                    </span>
                  )}
                </div>
                <div className="job-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditJobOffer(job)}
                  >
                    ✏️ Modifica
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteJobOffer(job)}
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal gestione offerta */}
      {showJobOfferModal && (
        <div className="application-modal-overlay" onClick={() => setShowJobOfferModal(false)}>
          <div className="application-modal job-offer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingJobOffer ? '✏️ Modifica Offerta' : '➕ Crea Nuova Offerta'}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowJobOfferModal(false)}
              >
                ✖️
              </button>
            </div>
            
            <div className="modal-body">
              <div className="job-offer-form">
                <div className="form-group">
                  <label>Titolo Offerta *</label>
                  <input
                    type="text"
                    value={jobOfferForm.titoloOffertaLavorativa}
                    onChange={(e) => updateJobOfferForm('titoloOffertaLavorativa', e.target.value)}
                    placeholder="es. Frontend Developer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descrizione Offerta *</label>
                  <textarea
                    value={jobOfferForm.descrizioneOffertaLavorativa}
                    onChange={(e) => updateJobOfferForm('descrizioneOffertaLavorativa', e.target.value)}
                    placeholder="Descrivi la posizione, le responsabilità e i requisiti..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo Contratto *</label>
                    <select
                      value={jobOfferForm.tipoContratto}
                      onChange={(e) => updateJobOfferForm('tipoContratto', e.target.value)}
                      required
                    >
                      <option value="">Seleziona tipo contratto</option>
                      {companyJobService.getContractTypes().map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Livello Esperienza *</label>
                    <select
                      value={jobOfferForm.livelloEsperienza}
                      onChange={(e) => updateJobOfferForm('livelloEsperienza', e.target.value)}
                      required
                    >
                      <option value="">Seleziona livello</option>
                      {companyJobService.getExperienceLevels().map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Competenze Richieste *</label>
                  <textarea
                    value={jobOfferForm.competenzeRichieste}
                    onChange={(e) => updateJobOfferForm('competenzeRichieste', e.target.value)}
                    placeholder="Elenca le competenze tecniche e soft skills richieste..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data Pubblicazione</label>
                    <input
                      type="datetime-local"
                      value={jobOfferForm.dataPubblicazione}
                      onChange={(e) => updateJobOfferForm('dataPubblicazione', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Data Scadenza</label>
                    <input
                      type="datetime-local"
                      value={jobOfferForm.dataScadenza}
                      onChange={(e) => updateJobOfferForm('dataScadenza', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowJobOfferModal(false)}
                disabled={savingJobOffer}
              >
                Annulla
              </button>
              <button 
                className="submit-application-btn"
                onClick={handleSubmitJobOffer}
                disabled={savingJobOffer}
              >
                {savingJobOffer ? '⏳ Salvando...' : (editingJobOffer ? '💾 Salva Modifiche' : '📤 Crea e Pubblica')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompanyProfile = () => {
    return (
      <div className="profile-section">
        <h2>🏢 Il Mio Profilo Aziendale</h2>
        
        {profileLoading ? (
          <div className="loading">
            <p>⏳ Caricamento profilo...</p>
          </div>
        ) : (
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="profile-info">
                <h3>{nome || 'Nome non disponibile'}</h3>
                <p>{email || 'Email non disponibile'}</p>
              </div>
            </div>
            
            <div className="profile-form">
              <div className="form-group">
                <label>Nome Azienda</label>
                <input 
                  type="text" 
                  value={nome || ''} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#6b7280' }}
                />
              </div>

              <div className="form-group">
                <label>Email Azienda</label>
                <input 
                  type="email" 
                  value={email || ''} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#6b7280' }}
                />
              </div>

              <div className="form-group">
                <label>Descrizione Azienda</label>
                <textarea 
                  value={descrizione || ''} 
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Inserisci una descrizione dell'azienda"
                  rows="3"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Sede Azienda</label>
                <input 
                  type="text" 
                  value={sede || ''} 
                  onChange={(e) => setSede(e.target.value)}
                  placeholder="Inserisci la sede dell'azienda"
                />
              </div>

              <div className="form-group">
                <label>Partita IVA</label>
                <input 
                  type="text" 
                  value={partitaIva || ''} 
                  onChange={(e) => setPartitaIva(e.target.value)}
                  placeholder="Inserisci la partita IVA"
                />
              </div>

              <button 
                className="save-btn" 
                onClick={handleSaveProfile} 
                disabled={saving}
              >
                {saving ? '⏳ Salvataggio...' : '💾 Salva Profilo'}
              </button>

              <button 
                onClick={loadProfile}
                style={{ 
                  marginLeft: '1rem', 
                  background: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                🔄 Ricarica
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboardHome();
      case 'jobposts': return renderJobPosts();
      case 'candidates': return renderCandidates();
      case 'profile': return renderCompanyProfile();
      default: return renderDashboardHome();
    }
  };

  return (
    <div className="candidate-dashboard">
      <header className="dashboard-header">
        <div className="header-left"><h1>GoJob! 🏢</h1></div>
        <div className="header-right">
          <div className="user-menu">
            <div className="header-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <span>{user?.username}</span>
            <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <nav className="dashboard-sidebar">
          <ul className="nav-menu">
            <li><button className={activeSection === 'dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveSection('dashboard')}><span className="nav-icon">🏠</span>Dashboard</button></li>
            <li><button className={activeSection === 'jobposts' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveSection('jobposts')}><span className="nav-icon">📢</span>Offerte di Lavoro</button></li>
            <li><button className={activeSection === 'candidates' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveSection('candidates')}><span className="nav-icon">👥</span>Candidati</button></li>
            <li><button className={activeSection === 'profile' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveSection('profile')}><span className="nav-icon">🏢</span>Profilo Aziendale</button></li>
          </ul>
        </nav>
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AziendaDashboard;