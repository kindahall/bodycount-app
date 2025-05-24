import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PartnerList from '../PartnerList';
import * as partnerLib from '@/lib/partners';
import { Partner } from '@/lib/partners'; // Importer le type

jest.mock('@/lib/partners', () => ({
  getPartnersByUserId: jest.fn(),
  deletePartner: jest.fn(),
}));

const mockGetPartnersByUserId = partnerLib.getPartnersByUserId as jest.Mock;
const mockDeletePartner = partnerLib.deletePartner as jest.Mock;

const mockPartners: Partner[] = [
  { id: 'p1', user_id: 'u1', name: 'Partner Alpha', gender: 'Male', notes: 'Notes Alpha', tags: ['tag1', 'tag2'], created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
  { id: 'p2', user_id: 'u1', name: 'Partner Beta', gender: 'Female', notes: 'Notes Beta', tags: ['tag2', 'tag3'], created_at: '2023-01-02T00:00:00Z', updated_at: '2023-01-02T00:00:00Z' },
];

describe('PartnerList', () => {
  const mockUserId = 'u1';
  const mockOnEdit = jest.fn();
  const mockOnSelectPartner = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    mockGetPartnersByUserId.mockClear();
    mockDeletePartner.mockClear();
    mockOnEdit.mockClear();
    mockOnSelectPartner.mockClear();
    mockOnAdd.mockClear();
  });

  it('renders loading state initially', async () => {
    mockGetPartnersByUserId.mockImplementationOnce(() => new Promise(() => {})); // Ne résout jamais

    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    // Utiliser findByTestId pour attendre l'indicateur de chargement
    expect(await screen.findByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.queryByText('Partner Alpha')).not.toBeInTheDocument();
  });

  it('renders partners after fetching', async () => {
    mockGetPartnersByUserId.mockResolvedValueOnce(mockPartners);
    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    await waitFor(() => expect(screen.getByText('Partner Alpha')).toBeInTheDocument());
    expect(screen.getByText('Partner Beta')).toBeInTheDocument();
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
  });

  it('renders "aucun partenaire" message when no partners are fetched', async () => {
    mockGetPartnersByUserId.mockResolvedValueOnce([]);
    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    expect(await screen.findByTestId("no-partners-message")).toBeInTheDocument();
    expect(screen.getByText("Aucun partenaire enregistré pour le moment.")).toBeInTheDocument();
  });

  it('calls onAddPartner when add button is clicked', async () => {
    mockGetPartnersByUserId.mockResolvedValueOnce([]);
    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /ajouter un partenaire/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ajouter un partenaire/i }));
    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onEditPartner when edit button is clicked', async () => {
    mockGetPartnersByUserId.mockResolvedValueOnce([mockPartners[0]]);
    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    await screen.findByText('Partner Alpha'); 
    const editButton = screen.getByTestId(`edit-partner-${mockPartners[0].id}`);
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockPartners[0]);
  });

  it('calls onSelectPartner when a partner card is clicked', async () => {
    mockGetPartnersByUserId.mockResolvedValueOnce([mockPartners[0]]);
    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    const partnerCard = await screen.findByTestId(`partner-card-${mockPartners[0].id}`);
    fireEvent.click(partnerCard);
    expect(mockOnSelectPartner).toHaveBeenCalledTimes(1);
    expect(mockOnSelectPartner).toHaveBeenCalledWith(mockPartners[0].id);
  });
  
  it('calls deletePartner and re-fetches when delete button is clicked and confirmed', async () => {
    window.confirm = jest.fn(() => true); 
    mockGetPartnersByUserId.mockResolvedValueOnce([mockPartners[0]]); 
    mockDeletePartner.mockResolvedValueOnce({ id: mockPartners[0].id }); 
    mockGetPartnersByUserId.mockResolvedValueOnce([]); 

    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    await screen.findByText(mockPartners[0].name);
    const deleteButton = screen.getByTestId(`delete-partner-${mockPartners[0].id}`);
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer ce partenaire ?');
    
    await waitFor(() => expect(mockDeletePartner).toHaveBeenCalledWith(mockPartners[0].id));
    await waitFor(() => expect(mockGetPartnersByUserId).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId("no-partners-message")).toBeInTheDocument();
    expect(screen.getByText("Aucun partenaire enregistré pour le moment.")).toBeInTheDocument();
  });

   it('does not call deletePartner if deletion is not confirmed', async () => {
    window.confirm = jest.fn(() => false);
    mockGetPartnersByUserId.mockResolvedValueOnce([mockPartners[0]]);

    render(
      <PartnerList
        userId={mockUserId}
        onEditPartner={mockOnEdit}
        onSelectPartner={mockOnSelectPartner}
        onAddPartner={mockOnAdd}
      />
    );
    
    await screen.findByText(mockPartners[0].name); 
    const deleteButton = screen.getByTestId(`delete-partner-${mockPartners[0].id}`);
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeletePartner).not.toHaveBeenCalled();
  });

});