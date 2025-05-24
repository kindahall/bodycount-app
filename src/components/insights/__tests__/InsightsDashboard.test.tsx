import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InsightsDashboard from '../InsightsDashboard';
import * as encounterLib from '@/lib/encounters';
import * as partnerLib from '@/lib/partners';
import * as journalLib from '@/lib/journalEntries';
import * as insightsLib from '@/lib/insights';
import { Encounter } from '@/lib/encounters';
import { Partner } from '@/lib/partners';
import { JournalEntry } from '@/lib/journalEntries';

// Mocker les fonctions de récupération de données
jest.mock('@/lib/encounters', () => ({
  getEncountersByUserId: jest.fn(),
}));
jest.mock('@/lib/partners', () => ({
  getPartnersByUserId: jest.fn(),
}));
jest.mock('@/lib/journalEntries', () => ({
  getJournalEntriesByUserId: jest.fn(),
}));

// Mocker partiellement les fonctions d'insights
// Nous laissons les fonctions de calcul (calculate*) utiliser leur implémentation réelle
// mais nous mockons les fonctions de génération d'insights (generate*)
jest.mock('@/lib/insights', () => {
  const originalModule = jest.requireActual('@/lib/insights');
  return {
    ...originalModule, // Garder les fonctions de calcul réelles
    generateSimpleTagInsight: jest.fn(),
    generatePartnerMoodInsight: jest.fn(),
  };
});

const mockGetEncountersByUserId = encounterLib.getEncountersByUserId as jest.Mock;
const mockGetPartnersByUserId = partnerLib.getPartnersByUserId as jest.Mock;
const mockGetJournalEntriesByUserId = journalLib.getJournalEntriesByUserId as jest.Mock;
const mockGenerateSimpleTagInsight = insightsLib.generateSimpleTagInsight as jest.Mock;
const mockGeneratePartnerMoodInsight = insightsLib.generatePartnerMoodInsight as jest.Mock;

const mockUserId = 'user-123';
const mockEncountersData: Encounter[] = [
  { id: 'e1', user_id: mockUserId, partner_id: 'p1', date: '2023-01-10', mood: 5, tags: ['fun', 'date'], place: 'Restaurant', notes: '', created_at: '', updated_at: '' },
  { id: 'e2', user_id: mockUserId, partner_id: 'p2', date: '2023-01-15', mood: 3, tags: ['serious'], place: 'Cafe', notes: '', created_at: '', updated_at: '' },
];
const mockPartnersData: Partner[] = [
  { id: 'p1', user_id: mockUserId, name: 'Partner A', created_at: '' },
  { id: 'p2', user_id: mockUserId, name: 'Partner B', created_at: '' },
];
const mockJournalEntriesData: JournalEntry[] = [
  { id: 'j1', user_id: mockUserId, content: 'Great day', mood: 5, entry_type: 'diary', created_at: '2023-01-01T00:00:00Z' },
];

describe('InsightsDashboard', () => {
  beforeEach(() => {
    mockGetEncountersByUserId.mockClear();
    mockGetPartnersByUserId.mockClear();
    mockGetJournalEntriesByUserId.mockClear();
    mockGenerateSimpleTagInsight.mockClear();
    mockGeneratePartnerMoodInsight.mockClear();
  });

  it('renders loading state initially', async () => {
    mockGetEncountersByUserId.mockImplementationOnce(() => new Promise(() => {})); // Ne résout jamais
    mockGetPartnersByUserId.mockImplementationOnce(() => new Promise(() => {}));
    mockGetJournalEntriesByUserId.mockImplementationOnce(() => new Promise(() => {}));

    render(<InsightsDashboard userId={mockUserId} />);
    expect(await screen.findByText(/chargement des insights/i)).toBeInTheDocument();
  });

  it('renders error state if data fetching fails', async () => {
    mockGetEncountersByUserId.mockRejectedValueOnce(new Error('Failed to fetch encounters'));
    mockGetPartnersByUserId.mockResolvedValueOnce(mockPartnersData); // Les autres peuvent réussir
    mockGetJournalEntriesByUserId.mockResolvedValueOnce(mockJournalEntriesData);

    render(<InsightsDashboard userId={mockUserId} />);
    expect(await screen.findByText(/erreur: impossible de charger les données pour les insights/i)).toBeInTheDocument();
  });

  it('renders "pas assez de données" message if no encounters', async () => {
    mockGetEncountersByUserId.mockResolvedValueOnce([]);
    mockGetPartnersByUserId.mockResolvedValueOnce(mockPartnersData);
    mockGetJournalEntriesByUserId.mockResolvedValueOnce(mockJournalEntriesData);

    render(<InsightsDashboard userId={mockUserId} />);
    expect(await screen.findByText(/pas assez de données pour générer des insights/i)).toBeInTheDocument();
  });

  it('renders dashboard with data and generated insights', async () => {
    mockGetEncountersByUserId.mockResolvedValueOnce(mockEncountersData);
    mockGetPartnersByUserId.mockResolvedValueOnce(mockPartnersData);
    mockGetJournalEntriesByUserId.mockResolvedValueOnce(mockJournalEntriesData);
    // Utiliser mockImplementation pour s'assurer que la valeur est retournée à chaque appel
    mockGenerateSimpleTagInsight.mockImplementation(() => "Insight sur les tags !");
    mockGeneratePartnerMoodInsight.mockImplementation(() => "Insight sur l'humeur des partenaires !");

    render(<InsightsDashboard userId={mockUserId} />);

    // Vérifier les titres des sections
    expect(await screen.findByText(/tableau de bord des insights/i)).toBeInTheDocument();
    expect(screen.getByText(/fréquence des tags dans les rencontres/i)).toBeInTheDocument();
    expect(screen.getByText(/évolution de l'humeur moyenne/i)).toBeInTheDocument();
    expect(screen.getByText(/statistiques par partenaire/i)).toBeInTheDocument();

    // Vérifier les insights générés
    await waitFor(() => {
      // S'assurer que les données de base sont là avant de vérifier les fonctions d'insight
      expect(screen.getByText('fun')).toBeInTheDocument();
    });

    // À ce stade, tagFrequency devrait être calculé.
    // calculateTagFrequency(mockEncountersData) devrait retourner { fun: 1, date: 1, serious: 1 }
    const expectedTagFrequency = { fun: 1, date: 1, serious: 1 };

    await waitFor(() => {
      expect(mockGenerateSimpleTagInsight).toHaveBeenCalledWith(expectedTagFrequency);
      expect(screen.getByText("Insight sur les tags !")).toBeInTheDocument();
    }, { timeout: 2000 }); // Augmenter le timeout
    
    // De même pour partnerMoodInsight, s'assurer que partnerStats et partners sont prêts.
    // Pour simplifier, on se concentre sur le fait que la fonction est appelée.
    await waitFor(() => {
      expect(mockGeneratePartnerMoodInsight).toHaveBeenCalled();
      expect(screen.getByText("Insight sur l'humeur des partenaires !")).toBeInTheDocument();
    }, { timeout: 2000 }); // Augmenter le timeout

    // Vérifier quelques données calculées (ex: un tag fréquent)
    // calculateTagFrequency retourne { fun: 1, date: 1, serious: 1 }
    // Le composant affiche les 5 premiers.
    await waitFor(() => {
        expect(screen.getByText('fun')).toBeInTheDocument();
        const funCountBadge = screen.getAllByText('1').find(el => el.previousSibling?.textContent === 'fun');
        expect(funCountBadge).toBeInTheDocument();
    });
    

    // Vérifier une entrée d'évolution d'humeur (ex: Jan 2023)
    // Encounters: Jan (5+3)/2 = 4. Journal: Jan (5)/1 = 5. Combined: (5+3+5)/3 = 4.33
    await waitFor(() => {
      const moodRow = screen.getByText('2023-01').closest('tr');
      expect(moodRow).toHaveTextContent(/4\.3/i); // Humeur moyenne
      expect(moodRow).toHaveTextContent(/3/);    // Nombre d'entrées (2 rencontres + 1 journal)
    });


    // Vérifier une stat de partenaire (ex: Partner A)
    // Partner A: 1 rencontre, humeur 5
    await waitFor(() => {
      const partnerARow = screen.getByText('Partner A').closest('tr');
      expect(partnerARow).toHaveTextContent(/1/); // Nb. Rencontres
      expect(partnerARow).toHaveTextContent(/5\.0/); // Humeur Moyenne
    });
  });
  
  it('does not render generated insights section if insights are null', async () => {
    mockGetEncountersByUserId.mockResolvedValueOnce(mockEncountersData);
    mockGetPartnersByUserId.mockResolvedValueOnce(mockPartnersData);
    mockGetJournalEntriesByUserId.mockResolvedValueOnce(mockJournalEntriesData);
    mockGenerateSimpleTagInsight.mockReturnValueOnce(null);
    mockGeneratePartnerMoodInsight.mockReturnValueOnce(null);

    render(<InsightsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.queryByText(/quelques observations de Holly/i)).not.toBeInTheDocument();
    });
  });

});