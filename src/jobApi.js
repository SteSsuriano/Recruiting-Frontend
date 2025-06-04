import { getToken } from './apiClient';

const API_URL = 'http://localhost:1337';

// Funzione per ottenere tutte le offerte lavorative
export const getAllJobOffers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/offerta-lavorativas?populate=aziendas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Errore durante il recupero delle offerte lavorative:', error);
    throw error;
  }
};

// Funzioni segnaposto
export const getJobOfferById = async () => ({ data: [] });
export const createJobOffer = async () => {};
export const updateJobOffer = async () => {};
export const deleteJobOffer = async () => {};
export const submitApplication = async () => {};
export const getCandidateCandidatures = async () => {};
export const getCompanyApplications = async () => {};
export const updateApplicationStatus = async () => {};