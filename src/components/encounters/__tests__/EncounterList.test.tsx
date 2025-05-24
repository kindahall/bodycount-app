import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EncounterList from '../EncounterList';
import * as encounterLib from '@/lib/encounters';
import { Encounter } from '@/lib/encounters';
import { Partner } from '@/lib/partners';

jest.mock('@/lib/encounters', () => ({
  getEncountersByUserId: jest.fn(),
  deleteEncounter: jest.fn(),
}));

const mockGetEncountersByUserId = encounterLib.getEncountersByUserId as jest.Mock;
const mockDeleteEncounter = encounterLib.deleteEncounter as jest.Mock;

const mockPartners: Partner[] = [
  { id: 'p1', user_id: 'u1', name: 'Partner Alpha', created_at: '' },
  { id: 'p2', user_id: 'u1', name: 'Partner Beta', created_at: '' },
];

const mockEncounters: Encounter[] = [
  { id: 'e1', user_id: 'u1', partner_id: 'p1', date: '2023-01-10', place: 'Restaurant Alpha', mood: 5, tags: ['fun', 'date'], notes: 'Notes Alpha', created_at: '2023-01-10T00:00:00Z' },
  { id: 'e2', user_id: 'u1', partner_id: 'p2', date: '2023-01-15', place: 'Cafe Beta', mood: 3, tags: ['serious'], notes: 'Notes Beta', created_at: '2023-01-15T00:00:00Z' },
  { id: 'e3', user_id: 'u1', partner_id: null, date: '2023-01-20', place: 'Home Alone', mood: 2, tags: ['solo'], notes: 'Notes Solo', created_at: '2023-01-20T00:00:00Z' },
];

describe('EncounterList', () => {
  const mockUserId = 'u1';
  const mockOnEdit = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    mockGetEncountersByUserId.mockClear();
    mockDeleteEncounter.mockClear();
    mockOnEdit.mockClear();
    mockOnAdd.mockClear();
  });

  it('renders loading state initially', async () => {
    mockGetEncountersByUserId.mockImplementationOnce(() => new Promise(() => {}));
    render(<EncounterList userId={mockUserId} partners={mockPartners} onEditEncounter={mockOnEdit} onAddEncounter={mockOnAdd} />);
    expect(await screen.findByTestId("loading-indicator")).toBeInTheDocument();
  });

  it('renders encounters after fetching', async () => {
    mockGetEncountersByUserId.mockResolvedValueOnce(mockEncounters);
    render(<EncounterList userId={mockUserId} partners={mockPartners} onEditEncounter={mockOnEdit} onAddEncounter={mockOnAdd} />);
    
    expect(await screen.findByTestId(`encounter-card-${mockEncounters[0].id}`)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Restaurant Alpha'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Partner Alpha'))).toBeInTheDocument();
    
    expect(await screen.findByTestId(`encounter-card-${mockEncounters[1].id}`)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Cafe Beta'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Partner Beta'))).toBeInTheDocument();
    
    expect(await screen.findByTestId(`encounter-card-${mockEncounters[2].id}`)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Home Alone'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Rencontre indépendante'))).toBeInTheDocument();
    
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
  });

  it('renders "aucune rencontre" message when no encounters are fetched', async () => {
    mockGetEncountersByUserId.mockResolvedValueOnce([]);
    render(<EncounterList userId={mockUserId} partners={mockPartners} onEditEncounter={mockOnEdit} onAddEncounter={mockOnAdd} />);
    expect(await screen.findByTestId("no-encounters-message")).toBeInTheDocument();
  });

  it('calls onAddEncounter when add button is clicked', async () => {
    mockGetEncountersByUserId.mockResolvedValueOnce([]);
    render(<EncounterList userId={mockUserId} partners={mockPartners} onEditEncounter={mockOnEdit} onAddEncounter={mockOnAdd} />);
    // Attendre que le bouton soit potentiellement rendu après un état de chargement initial
    const addButton = await screen.findByRole('button', { name: /ajouter une rencontre/i });
    fireEvent.click(addButton);
    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onEditEncounter when edit button is clicked', async () => {
    mockGetEncountersByUserId.mockResolvedValueOnce([mockEncounters[0]]);
    render(<EncounterList userId={mockUserId} partners={mockPartners} onEditEncounter={mockOnEdit} onAddEncounter={mockOnAdd} />);
    
    expect(await screen.findByTestId(`encounter-card-${mockEncounters[0].id}`)).toBeInTheDocument();
    const editButton = screen.getByTestId(`edit-encounter-${mockEncounters[0].id}`);
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockEncounters[0]);
  });
  
  it('calls deleteEncounter and re-fetches when delete button is clicked and confirmed', async () => {
    window.confirm = jest.fn(() => true);
    mockGetEncountersByUserId.mockResolvedValueOnce([mockEncounters[0]]);
    mockDeleteEncounter.mockResolvedValueOnce({ id: mockEncounters[0].id });
    mockGetEncountersByUserId.mockResolvedValueOnce([]); 

    render(<EncounterList userId={mockUserId} partners={mockPartners} onEditEncounter={mockOnEdit} onAddEncounter={mockOnAdd} />);

    expect(await screen.findByTestId(`encounter-card-${mockEncounters[0].id}`)).toBeInTheDocument();
    const deleteButton = screen.getByTestId(`delete-encounter-${mockEncounters[0].id}`);
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer cette rencontre ?');
    await waitFor(() => expect(mockDeleteEncounter).toHaveBeenCalledWith(mockEncounters[0].id));
    await waitFor(() => expect(mockGetEncountersByUserId).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId("no-encounters-message")).toBeInTheDocument();
  });

   it('does not call deleteEncounter if deletion is not confirmed', async () => {
    window.confirm = jest.fn(() => false);
    mockGetEncountersByUserId.mockResolvedValueOnce([mockEncounters[0]]);

    render(<EncounterList userId={mockUserId} partners={mockPartners} onEditEncounter={mockOnEdit} onAddEncounter={mockOnAdd} />);
    
    expect(await screen.findByTestId(`encounter-card-${mockEncounters[0].id}`)).toBeInTheDocument();
    const deleteButton = screen.getByTestId(`delete-encounter-${mockEncounters[0].id}`);
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteEncounter).not.toHaveBeenCalled();
  });
});