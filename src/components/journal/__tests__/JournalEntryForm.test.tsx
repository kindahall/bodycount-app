import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JournalEntryForm from '../JournalEntryForm';
import * as journalLib from '@/lib/journalEntries'; // Importer pour mocker

// Mocker les fonctions de la librairie journalEntries
jest.mock('@/lib/journalEntries', () => ({
  createJournalEntry: jest.fn(),
  updateJournalEntry: jest.fn(),
}));

const mockCreateJournalEntry = journalLib.createJournalEntry as jest.Mock;
const mockUpdateJournalEntry = journalLib.updateJournalEntry as jest.Mock;

describe('JournalEntryForm', () => {
  const mockUserId = 'user-123';
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockCreateJournalEntry.mockClear();
    mockUpdateJournalEntry.mockClear();
    mockOnClose.mockClear();
  });

  it('renders correctly for creating a new journal entry', () => {
    render(<JournalEntryForm userId={mockUserId} onClose={mockOnClose} />);
    expect(screen.getByRole('heading', { name: /nouvelle entrée de journal/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contenu/i)).toBeInTheDocument(); // Commence par "Contenu"
    expect(screen.getByRole('button', { name: /^Enregistrer$/i })).toBeInTheDocument(); // Texte exact "Enregistrer"
  });

  it('renders correctly for editing an existing journal entry', () => {
    const existingEntry = {
      id: 'entry-1',
      user_id: mockUserId,
      content: 'Existing content',
      mood: 3,
      entry_type: 'reflection',
      created_at: new Date().toISOString(),
    };
    render(<JournalEntryForm userId={mockUserId} existingEntry={existingEntry} onClose={mockOnClose} />);
    
    expect(screen.getByRole('heading', { name: /modifier l'entrée/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contenu/i)).toHaveValue('Existing content');
    expect(screen.getByLabelText(/type d'entrée/i)).toHaveValue('reflection');
    expect(screen.getByLabelText(/humeur \(1-5\)/i)).toHaveValue(3); // Sans ", optionnel"
    expect(screen.getByRole('button', { name: /mettre à jour/i })).toBeInTheDocument(); // Texte exact
  });

  it('allows input and submits for new entry', async () => {
    mockCreateJournalEntry.mockResolvedValueOnce({ id: 'new-entry-id', content: 'New test content' });
    render(<JournalEntryForm userId={mockUserId} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/^Contenu/i), { target: { value: 'New test content' } });
    fireEvent.change(screen.getByLabelText(/type d'entrée/i), { target: { value: 'diary' } });
    fireEvent.change(screen.getByLabelText(/humeur \(1-5\)/i), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer$/i }));

    await waitFor(() => {
      expect(mockCreateJournalEntry).toHaveBeenCalledTimes(1);
      expect(mockCreateJournalEntry).toHaveBeenCalledWith({
        user_id: mockUserId,
        content: 'New test content',
        entry_type: 'diary',
        mood: 5,
        media: null, // Assumant que media est null par défaut
      });
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows input and submits for updating existing entry', async () => {
    const existingEntry = {
      id: 'entry-1',
      user_id: mockUserId,
      content: 'Old content',
      mood: 2,
      entry_type: 'reflection',
      created_at: new Date().toISOString(),
    };
    mockUpdateJournalEntry.mockResolvedValueOnce({ ...existingEntry, content: 'Updated content' });
    render(<JournalEntryForm userId={mockUserId} existingEntry={existingEntry} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/^Contenu/i), { target: { value: 'Updated content' } });
    fireEvent.click(screen.getByRole('button', { name: /mettre à jour/i }));

    await waitFor(() => {
      expect(mockUpdateJournalEntry).toHaveBeenCalledTimes(1);
      expect(mockUpdateJournalEntry).toHaveBeenCalledWith(existingEntry.id, 
        expect.objectContaining({
          content: 'Updated content',
          entry_type: 'reflection', // Les autres champs restent
          mood: 2,
        })
      );
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows error if content is empty on submit', async () => {
    render(<JournalEntryForm userId={mockUserId} onClose={mockOnClose} />);
    // Le champ content est un textarea et a l'attribut `required`
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer$/i }));
    
    await waitFor(() => {
        expect(mockCreateJournalEntry).not.toHaveBeenCalled();
    });
    // On pourrait vérifier un message d'erreur spécifique si le composant en affiche un
    // ou si le focus est revenu sur le champ requis.
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<JournalEntryForm userId={mockUserId} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

});