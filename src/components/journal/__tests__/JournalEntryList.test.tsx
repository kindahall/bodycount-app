import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JournalEntryList from '../JournalEntryList';
import * as journalLib from '@/lib/journalEntries';
import { JournalEntry } from '@/lib/journalEntries';

jest.mock('@/lib/journalEntries', () => ({
  getJournalEntriesByUserId: jest.fn(),
  deleteJournalEntry: jest.fn(),
}));

const mockGetJournalEntriesByUserId = journalLib.getJournalEntriesByUserId as jest.Mock;
const mockDeleteJournalEntry = journalLib.deleteJournalEntry as jest.Mock;

const mockEntries: JournalEntry[] = [
  { id: 'j1', user_id: 'u1', content: 'Feeling great today!', mood: 5, entry_type: 'diary', created_at: '2023-01-10T10:00:00Z' },
  { id: 'j2', user_id: 'u1', content: 'A bit down, reflected on work.', mood: 2, entry_type: 'reflection', created_at: '2023-01-09T12:00:00Z' },
  { id: 'j3', user_id: 'u1', content: 'Prompt response about gratitude.', mood: 4, entry_type: 'prompt', created_at: '2023-01-08T15:00:00Z' },
];

describe('JournalEntryList', () => {
  const mockUserId = 'u1';
  const mockOnEdit = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    mockGetJournalEntriesByUserId.mockClear();
    mockDeleteJournalEntry.mockClear();
    mockOnEdit.mockClear();
    mockOnAdd.mockClear();
  });

  it('renders loading state initially', async () => {
    mockGetJournalEntriesByUserId.mockImplementationOnce(() => new Promise(() => {}));
    render(<JournalEntryList userId={mockUserId} onEditEntry={mockOnEdit} onAddEntry={mockOnAdd} />);
    expect(await screen.findByTestId("loading-indicator")).toBeInTheDocument();
  });

  it('renders entries after fetching', async () => {
    mockGetJournalEntriesByUserId.mockResolvedValueOnce(mockEntries);
    render(<JournalEntryList userId={mockUserId} onEditEntry={mockOnEdit} onAddEntry={mockOnAdd} />);
    
    expect(await screen.findByText(/Feeling great today!/i)).toBeInTheDocument();
    expect(screen.getByText(/A bit down, reflected on work./i)).toBeInTheDocument();
    expect(screen.getByText(/Prompt response about gratitude./i)).toBeInTheDocument();
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
  });

  it('renders "aucune entrée" message when no entries are fetched', async () => {
    mockGetJournalEntriesByUserId.mockResolvedValueOnce([]);
    render(<JournalEntryList userId={mockUserId} onEditEntry={mockOnEdit} onAddEntry={mockOnAdd} />);
    expect(await screen.findByTestId("no-entries-message")).toBeInTheDocument();
  });

  it('calls onAddEntry when add button is clicked', async () => {
    mockGetJournalEntriesByUserId.mockResolvedValueOnce([]);
    render(<JournalEntryList userId={mockUserId} onEditEntry={mockOnEdit} onAddEntry={mockOnAdd} />);
    // Attendre que le bouton soit potentiellement rendu après un état de chargement initial
    const addButton = await screen.findByRole('button', { name: /nouvelle entrée/i }); // Correction du nom du bouton
    fireEvent.click(addButton);
    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onEditEntry when edit button is clicked', async () => {
    mockGetJournalEntriesByUserId.mockResolvedValueOnce([mockEntries[0]]);
    render(<JournalEntryList userId={mockUserId} onEditEntry={mockOnEdit} onAddEntry={mockOnAdd} />);
    
    expect(await screen.findByTestId(`entry-card-${mockEntries[0].id}`)).toBeInTheDocument();
    const editButton = screen.getByTestId(`edit-entry-${mockEntries[0].id}`);
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockEntries[0]);
  });
  
  it('calls deleteJournalEntry and re-fetches when delete button is clicked and confirmed', async () => {
    window.confirm = jest.fn(() => true);
    mockGetJournalEntriesByUserId.mockResolvedValueOnce([mockEntries[0]]);
    mockDeleteJournalEntry.mockResolvedValueOnce({ id: mockEntries[0].id });
    mockGetJournalEntriesByUserId.mockResolvedValueOnce([]); // Pour le re-fetch

    render(<JournalEntryList userId={mockUserId} onEditEntry={mockOnEdit} onAddEntry={mockOnAdd} />);

    expect(await screen.findByTestId(`entry-card-${mockEntries[0].id}`)).toBeInTheDocument();
    const deleteButton = screen.getByTestId(`delete-entry-${mockEntries[0].id}`);
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer cette entrée de journal ?'); // Correction du message
    await waitFor(() => expect(mockDeleteJournalEntry).toHaveBeenCalledWith(mockEntries[0].id));
    await waitFor(() => expect(mockGetJournalEntriesByUserId).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId("no-entries-message")).toBeInTheDocument();
  });

   it('does not call deleteJournalEntry if deletion is not confirmed', async () => {
    window.confirm = jest.fn(() => false);
    mockGetJournalEntriesByUserId.mockResolvedValueOnce([mockEntries[0]]);

    render(<JournalEntryList userId={mockUserId} onEditEntry={mockOnEdit} onAddEntry={mockOnAdd} />);
    
    expect(await screen.findByTestId(`entry-card-${mockEntries[0].id}`)).toBeInTheDocument();
    const deleteButton = screen.getByTestId(`delete-entry-${mockEntries[0].id}`);
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteJournalEntry).not.toHaveBeenCalled();
  });
});