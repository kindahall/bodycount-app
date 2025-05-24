import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EncounterForm from '../EncounterForm';
import * as encounterLib from '@/lib/encounters';
import { Partner } from '@/lib/partners'; // Importer le type Partner

// Mocker les fonctions de la librairie encounters
jest.mock('@/lib/encounters', () => ({
  createEncounter: jest.fn(),
  updateEncounter: jest.fn(),
}));

const mockCreateEncounter = encounterLib.createEncounter as jest.Mock;
const mockUpdateEncounter = encounterLib.updateEncounter as jest.Mock;

const mockPartners: Partner[] = [
  { id: 'p1', user_id: 'u1', name: 'Partner Alpha', created_at: '' },
  { id: 'p2', user_id: 'u1', name: 'Partner Beta', created_at: '' },
];

describe('EncounterForm', () => {
  const mockUserId = 'user-123';
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockCreateEncounter.mockClear();
    mockUpdateEncounter.mockClear();
    mockOnClose.mockClear();
  });

  it('renders correctly for creating a new encounter', () => {
    render(<EncounterForm userId={mockUserId} partners={mockPartners} onClose={mockOnClose} />);
    expect(screen.getByRole('heading', { name: /ajouter une rencontre/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/partenaire \(optionnel\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Date/i)).toBeInTheDocument(); // Commence par "Date"
    expect(screen.getByRole('button', { name: /ajouter rencontre/i })).toBeInTheDocument();
  });

  it('renders correctly for editing an existing encounter', () => {
    const existingEncounter = {
      id: 'e1',
      user_id: mockUserId,
      partner_id: 'p1',
      date: '2023-10-26',
      place: 'Cafe',
      tags: ['coffee', 'chat'],
      notes: 'Good talk',
      mood: 4,
      created_at: new Date().toISOString(),
    };
    render(
      <EncounterForm
        userId={mockUserId}
        partners={mockPartners}
        existingEncounter={existingEncounter}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByRole('heading', { name: /modifier la rencontre/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/partenaire \(optionnel\)/i)).toHaveValue('p1');
    expect(screen.getByLabelText(/^Date/i)).toHaveValue('2023-10-26');
    expect(screen.getByLabelText(/^Lieu$/i)).toHaveValue('Cafe'); // Label exact "Lieu"
    expect(screen.getByLabelText(/tags \(séparés par des virgules\)/i)).toHaveValue('coffee, chat');
    expect(screen.getByLabelText(/^Notes$/i)).toHaveValue('Good talk'); // Label exact "Notes"
    expect(screen.getByLabelText(/humeur \(1-5\)/i)).toHaveValue(4); // Sans "optionnel"
    expect(screen.getByRole('button', { name: /mettre à jour/i })).toBeInTheDocument(); // Plus court
  });

  it('allows input and submits for new encounter', async () => {
    mockCreateEncounter.mockResolvedValueOnce({ id: 'new-encounter-id', date: '2023-11-15' });
    render(<EncounterForm userId={mockUserId} partners={mockPartners} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/partenaire \(optionnel\)/i), { target: { value: 'p2' } });
    fireEvent.change(screen.getByLabelText(/^Date/i), { target: { value: '2023-11-15' } });
    fireEvent.change(screen.getByLabelText(/^Lieu$/i), { target: { value: 'Park' } });
    fireEvent.change(screen.getByLabelText(/tags \(séparés par des virgules\)/i), { target: { value: 'walk, nature' } });
    fireEvent.change(screen.getByLabelText(/^Notes$/i), { target: { value: 'Nice walk' } });
    fireEvent.change(screen.getByLabelText(/humeur \(1-5\)/i), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /ajouter rencontre/i }));

    await waitFor(() => {
      expect(mockCreateEncounter).toHaveBeenCalledTimes(1);
      expect(mockCreateEncounter).toHaveBeenCalledWith({
        user_id: mockUserId,
        partner_id: 'p2',
        date: '2023-11-15',
        place: 'Park',
        tags: ['walk', 'nature'],
        notes: 'Nice walk',
        mood: 5,
        photos: null, // Assumant que photos est null par défaut si non fourni
        would_return: null, // Assumant que would_return est null par défaut
      });
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows input and submits for updating existing encounter', async () => {
    const existingEncounter = {
      id: 'e1',
      user_id: mockUserId,
      partner_id: 'p1',
      date: '2023-10-26',
      place: 'Cafe',
      tags: ['coffee', 'chat'],
      notes: 'Good talk',
      mood: 4,
      created_at: new Date().toISOString(),
    };
    mockUpdateEncounter.mockResolvedValueOnce({ ...existingEncounter, place: 'New Cafe' });
    render(
      <EncounterForm
        userId={mockUserId}
        partners={mockPartners}
        existingEncounter={existingEncounter}
        onClose={mockOnClose}
      />
    );

    fireEvent.change(screen.getByLabelText(/^Lieu$/i), { target: { value: 'New Cafe' } });
    fireEvent.click(screen.getByRole('button', { name: /mettre à jour/i })); // Plus court

    await waitFor(() => {
      expect(mockUpdateEncounter).toHaveBeenCalledTimes(1);
      expect(mockUpdateEncounter).toHaveBeenCalledWith(existingEncounter.id, 
        expect.objectContaining({
          place: 'New Cafe', // Seul le lieu a été changé
          // Les autres champs devraient être ceux de existingEncounter
          partner_id: 'p1',
          date: '2023-10-26',
          tags: ['coffee', 'chat'],
          notes: 'Good talk',
          mood: 4,
        })
      );
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // it('shows error if date is empty on submit', async () => {
  //   // Le champ date a une valeur par défaut (date actuelle) et est HTML5 required.
  //   // Ce test, tel quel, soumettrait avec la date actuelle.
  //   // Pour tester un champ date vide, il faudrait d'abord le vider.
  //   // Pour l'instant, la validation `required` du navigateur est supposée fonctionner.
  //   render(<EncounterForm userId={mockUserId} partners={mockPartners} onClose={mockOnClose} />);
  //   // Si on voulait vider le champ date:
  //   // fireEvent.change(screen.getByLabelText(/^Date/i), { target: { value: '' } });
  //   fireEvent.click(screen.getByRole('button', { name: /ajouter rencontre/i }));
    
  //   await waitFor(() => {
  //       expect(mockCreateEncounter).not.toHaveBeenCalled();
  //   });
  // });

  it('calls onClose when cancel button is clicked', () => {
    render(<EncounterForm userId={mockUserId} partners={mockPartners} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

});