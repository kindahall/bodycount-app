import {
  createEncounter,
  getEncounterById,
  getEncountersByUserId,
  getEncountersByPartnerId,
  updateEncounter,
  deleteEncounter,
  Encounter
} from '../encounters';
import { supabase } from '../supabaseClient'; // Sera le client mocké

// Déclarer les mocks pour chaque fonction de la chaîne
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

// Mocker le client Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({ // from retourne toujours cet objet avec les mocks
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    })),
    // auth: jest.fn(), // Si d'autres services Supabase sont utilisés
  },
}));

describe('Encounter Functions', () => {
  const mockUserId = 'test-user-id';
  const mockPartnerId = 'test-partner-id';
  const mockEncounterId = 'test-encounter-id';

  const mockEncounterData: Omit<Encounter, 'id' | 'created_at' | 'updated_at'> = {
    user_id: mockUserId,
    partner_id: mockPartnerId,
    date: new Date().toISOString().split('T')[0],
    place: 'Test Place',
    notes: 'Test notes for encounter',
    mood: 4,
    tags: ['test', 'fun'],
  };

  const mockFullEncounterData: Encounter = {
    id: mockEncounterId,
    ...mockEncounterData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    // Réinitialiser tous les mocks et leur comportement de chaînage
    (supabase.from as jest.Mock).mockClear();
    
    const mockChain = {
        select: mockSelect.mockClear().mockReturnThis(),
        insert: mockInsert.mockClear().mockReturnThis(),
        update: mockUpdate.mockClear().mockReturnThis(),
        delete: mockDelete.mockClear().mockReturnThis(),
        eq: mockEq.mockClear().mockReturnThis(),
        order: mockOrder.mockClear().mockReturnThis(),
        single: mockSingle.mockClear(),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockChain);
  });

  describe('createEncounter', () => {
    it('should create an encounter successfully', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockFullEncounterData, error: null });
      const result = await createEncounter(mockEncounterData);
      expect(supabase.from).toHaveBeenCalledWith('encounters');
      expect(mockInsert).toHaveBeenCalledWith([mockEncounterData]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockFullEncounterData);
    });

    it('should throw an error if Supabase call fails', async () => {
      const mockError = { message: 'Insert failed', code: 'XYZ', details: '', hint: '' };
      mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
      await expect(createEncounter(mockEncounterData)).rejects.toEqual(mockError);
    });
  });

  describe('getEncounterById', () => {
    it('should return an encounter if found', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockFullEncounterData, error: null });
      const result = await getEncounterById(mockEncounterId);
      expect(supabase.from).toHaveBeenCalledWith('encounters');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockEncounterId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockFullEncounterData);
    });

    it('should return null if encounter not found', async () => {
      const mockError = { message: 'Not found', code: 'PGRST116', details: '', hint: '' };
      mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
      const result = await getEncounterById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getEncountersByUserId', () => {
    it('should return a list of encounters for a user', async () => {
      const encountersList = [mockFullEncounterData, { ...mockFullEncounterData, id: 'encounter2' }];
      mockOrder.mockResolvedValueOnce({ data: encountersList, error: null });
      const result = await getEncountersByUserId(mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('encounters');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockOrder).toHaveBeenCalledWith('date', { ascending: false });
      expect(result).toEqual(encountersList);
    });
  });

  describe('getEncountersByPartnerId', () => {
    it('should return encounters for a specific partner and user', async () => {
      const encountersList = [mockFullEncounterData];
      mockOrder.mockResolvedValueOnce({ data: encountersList, error: null });
      const result = await getEncountersByPartnerId(mockPartnerId, mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('encounters');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('partner_id', mockPartnerId);
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId); // Vérifie le deuxième appel à eq
      expect(mockOrder).toHaveBeenCalledWith('date', { ascending: false });
      expect(result).toEqual(encountersList);
    });
  });
  
  describe('updateEncounter', () => {
    it('should update an encounter successfully', async () => {
      const updates: Partial<Encounter> = { place: 'Updated Place' };
      const updatedEncounter = { ...mockFullEncounterData, ...updates, updated_at: expect.any(String) };
      mockSingle.mockResolvedValueOnce({ data: updatedEncounter, error: null });
      const result = await updateEncounter(mockEncounterId, updates);
      expect(supabase.from).toHaveBeenCalledWith('encounters');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({place: 'Updated Place', updated_at: expect.any(String)}));
      expect(mockEq).toHaveBeenCalledWith('id', mockEncounterId);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(updatedEncounter);
    });
  });

  describe('deleteEncounter', () => {
    it('should delete an encounter successfully', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: mockEncounterId }, error: null });
      const result = await deleteEncounter(mockEncounterId);
      expect(supabase.from).toHaveBeenCalledWith('encounters');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', mockEncounterId);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ id: mockEncounterId });
    });

    it('should return a specific message if encounter to delete is not found', async () => {
      const mockError = { message: 'Not found', code: 'PGRST116', details: '', hint: '' };
      mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
      const result = await deleteEncounter('non-existent-id');
      expect(result).toEqual({ id: 'non-existent-id', message: 'Encounter not found, presumed deleted or never existed.' });
    });
  });
});