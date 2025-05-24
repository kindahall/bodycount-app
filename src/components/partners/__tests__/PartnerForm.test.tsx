import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PartnerForm from '../PartnerForm';
import * as partnerLib from '@/lib/partners'; // Importer pour mocker

// Mocker les fonctions de la librairie partners
jest.mock('@/lib/partners', () => ({
  createPartner: jest.fn(),
  updatePartner: jest.fn(),
}));

const mockCreatePartner = partnerLib.createPartner as jest.Mock;
const mockUpdatePartner = partnerLib.updatePartner as jest.Mock;

describe('PartnerForm', () => {
  const mockUserId = 'user-123';
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockCreatePartner.mockClear();
    mockUpdatePartner.mockClear();
    mockOnClose.mockClear();
  });

  it('renders correctly for creating a new partner', () => {
    render(<PartnerForm userId={mockUserId} onClose={mockOnClose} />);
    expect(screen.getByRole('heading', { name: /ajouter un partenaire/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom \/ Pseudo/i)).toBeInTheDocument(); // Correspond au label exact
    expect(screen.getByRole('button', { name: /ajouter partenaire/i })).toBeInTheDocument();
  });

  it('renders correctly for editing an existing partner', () => {
    const existingPartner = {
      id: 'partner-1',
      user_id: mockUserId,
      name: 'Existing Partner',
      gender: 'Female',
      notes: 'Some notes here',
      tags: ['friend', 'test'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    render(<PartnerForm userId={mockUserId} existingPartner={existingPartner} onClose={mockOnClose} />);
    
    expect(screen.getByRole('heading', { name: /modifier le partenaire/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom \/ Pseudo/i)).toHaveValue('Existing Partner');
    expect(screen.getByLabelText(/genre/i)).toHaveValue('Female');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('Some notes here');
    expect(screen.getByLabelText(/tags/i)).toHaveValue('friend, test');
    expect(screen.getByRole('button', { name: /mettre à jour/i })).toBeInTheDocument();
  });

  it('allows input and submits for new partner', async () => {
    mockCreatePartner.mockResolvedValueOnce({ id: 'new-partner-id', name: 'New Test Partner' });
    render(<PartnerForm userId={mockUserId} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Nom \/ Pseudo/i), { target: { value: 'New Test Partner' } });
    fireEvent.change(screen.getByLabelText(/genre/i), { target: { value: 'Other' } });
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Test notes' } });
    fireEvent.change(screen.getByLabelText(/tags/i), { target: { value: 'new, cool' } });

    fireEvent.click(screen.getByRole('button', { name: /ajouter partenaire/i }));

    await waitFor(() => {
      expect(mockCreatePartner).toHaveBeenCalledTimes(1);
      expect(mockCreatePartner).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: 'New Test Partner',
        gender: 'Other',
        notes: 'Test notes',
        tags: ['new', 'cool'],
        avatar_url: null,
      });
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows input and submits for updating existing partner', async () => {
    const existingPartner = {
      id: 'partner-1',
      user_id: mockUserId,
      name: 'Old Name',
      gender: 'Male',
      notes: 'Old notes',
      tags: ['old'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockUpdatePartner.mockResolvedValueOnce({ ...existingPartner, name: 'Updated Name' });
    render(<PartnerForm userId={mockUserId} existingPartner={existingPartner} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Nom \/ Pseudo/i), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByRole('button', { name: /mettre à jour/i }));

    await waitFor(() => {
      expect(mockUpdatePartner).toHaveBeenCalledTimes(1);
      expect(mockUpdatePartner).toHaveBeenCalledWith(
        existingPartner.id,
        expect.objectContaining({ // Utiliser objectContaining pour plus de flexibilité
          name: 'Updated Name',
          gender: 'Male',
          notes: 'Old notes',
          tags: ['old'],
          avatar_url: null,
        })
      );
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows error message if name is empty on submit', async () => {
    render(<PartnerForm userId={mockUserId} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /ajouter partenaire/i }));

    // Le message d'erreur est géré par la validation HTML5 `required` pour l'instant.
    // Pour tester un message d'erreur personnalisé affiché par le composant,
    // il faudrait que le composant gère l'état d'erreur et l'affiche.
    // Ici, on vérifie que la soumission n'a pas lieu.
    await waitFor(() => {
        expect(mockCreatePartner).not.toHaveBeenCalled();
    });
    // On peut aussi vérifier si le focus est revenu sur le champ requis, ou si un message d'erreur spécifique est affiché si le composant le fait.
    // Exemple: expect(await screen.findByText(/le nom est requis/i)).toBeInTheDocument();
  });
  
  it('calls onClose when cancel button is clicked', () => {
    render(<PartnerForm userId={mockUserId} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

});