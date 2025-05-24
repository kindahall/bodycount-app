import {
  createPartner,
  getPartnerById,
  getPartnersByUserId,
  updatePartner,
  deletePartner,
  Partner
} from '../partners';
import { supabase } from '../supabaseClient';

// Mocker le client Supabase
jest.mock('../supabaseClient', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(), // Sera configuré pour retourner une Promise dans chaque test
  };
  return {
    supabase: {
      from: jest.fn(() => mockChain),
      // Si vous utilisez supabase.auth ou d'autres services, mockez-les ici aussi si nécessaire
      // auth: { ... } 
    }
  };
});

// Pour accéder aux mocks des méthodes chaînées dans les tests
const getMockChain = () => (supabase.from('anyTable') as any);


describe('Partner Functions', () => {
  const mockUserId = 'test-user-id';
  const mockPartnerId = 'test-partner-id';
  const mockPartnerData: Omit<Partner, 'id' | 'created_at' | 'updated_at'> = {
    user_id: mockUserId,
    name: 'Test Partner',
    gender: 'Male',
    notes: 'Some notes',
    tags: ['test', 'friend'],
  };
  const mockFullPartnerData: Partner = {
    id: mockPartnerId,
    ...mockPartnerData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    // Réinitialiser tous les mocks avant chaque test
    (supabase.from as jest.Mock).mockClear();
    const mockChain = getMockChain();
    Object.values(mockChain).forEach((mockFn: any) => { // Rétablir 'any' pour satisfaire TypeScript ici, l'erreur ESLint originale était pour ce 'any'
      if (jest.isMockFunction(mockFn)) {
        (mockFn as jest.Mock).mockClear(); // Caster ici pour utiliser les méthodes de mock
        // S'assurer que les méthodes chaînables retournent 'this' (l'objet mockChain)
        if (['select', 'insert', 'update', 'delete', 'eq', 'order'].includes((mockFn as jest.Mock).getMockName() === 'jest.fn()' ? (mockFn as jest.Mock).getMockImplementation()?.name || '' : (mockFn as jest.Mock).name)) {
           (mockFn as jest.Mock).mockReturnThis();
        }
      }
    });
     // Ré-appliquer .mockReturnThis() explicitement après clear, car le clear peut les enlever.
    mockChain.select.mockReturnThis();
    mockChain.insert.mockReturnThis();
    mockChain.update.mockReturnThis();
    mockChain.delete.mockReturnThis();
    mockChain.eq.mockReturnThis();
    mockChain.order.mockReturnThis();
  });

  describe('createPartner', () => {
    it('should create a partner successfully', async () => {
      getMockChain().single.mockResolvedValueOnce({ data: mockFullPartnerData, error: null });
      
      const result = await createPartner(mockPartnerData);
      expect(supabase.from).toHaveBeenCalledWith('partners');
      expect(getMockChain().insert).toHaveBeenCalledWith([mockPartnerData]);
      expect(getMockChain().select).toHaveBeenCalled();
      expect(getMockChain().single).toHaveBeenCalled();
      expect(result).toEqual(mockFullPartnerData);
    });

    it('should throw an error if Supabase call fails', async () => {
      const mockError = { message: 'Insert failed', code: 'XYZ', details: '', hint: '' };
      getMockChain().single.mockResolvedValueOnce({ data: null, error: mockError });
      
      await expect(createPartner(mockPartnerData)).rejects.toEqual(mockError);
    });
  });

  describe('getPartnerById', () => {
    it('should return a partner if found', async () => {
      getMockChain().single.mockResolvedValueOnce({ data: mockFullPartnerData, error: null });

      const result = await getPartnerById(mockPartnerId);
      expect(supabase.from).toHaveBeenCalledWith('partners');
      expect(getMockChain().select).toHaveBeenCalledWith('*');
      expect(getMockChain().eq).toHaveBeenCalledWith('id', mockPartnerId);
      expect(getMockChain().single).toHaveBeenCalled();
      expect(result).toEqual(mockFullPartnerData);
    });

    it('should return null if partner not found (PGRST116)', async () => {
      const mockError = { message: 'Not found', code: 'PGRST116', details: '', hint: '' };
      getMockChain().single.mockResolvedValueOnce({ data: null, error: mockError });

      const result = await getPartnerById('non-existent-id');
      expect(result).toBeNull();
    });
    
    it('should throw an error for other Supabase errors', async () => {
      const mockError = { message: 'DB error', code: 'XXX', details: '', hint: '' };
      getMockChain().single.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(getPartnerById(mockPartnerId)).rejects.toEqual(mockError);
    });
  });

  describe('getPartnersByUserId', () => {
    it('should return a list of partners for a user', async () => {
      const partnersList = [mockFullPartnerData, { ...mockFullPartnerData, id: 'partner2' }];
      getMockChain().order.mockResolvedValueOnce({ data: partnersList, error: null }); 

      const result = await getPartnersByUserId(mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('partners');
      expect(getMockChain().select).toHaveBeenCalledWith('*');
      expect(getMockChain().eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(getMockChain().order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(partnersList);
    });
  });

  describe('updatePartner', () => {
    it('should update a partner successfully', async () => {
      const updates: Partial<Partner> = { name: 'Updated Name' };
      const updatedPartner = { ...mockFullPartnerData, ...updates, updated_at: expect.any(String) };
      getMockChain().single.mockResolvedValueOnce({ data: updatedPartner, error: null });

      const result = await updatePartner(mockPartnerId, updates);
      expect(supabase.from).toHaveBeenCalledWith('partners');
      expect(getMockChain().update).toHaveBeenCalledWith(expect.objectContaining({name: 'Updated Name', updated_at: expect.any(String)}));
      expect(getMockChain().eq).toHaveBeenCalledWith('id', mockPartnerId);
      expect(getMockChain().select).toHaveBeenCalled();
      expect(getMockChain().single).toHaveBeenCalled();
      expect(result).toEqual(updatedPartner);
    });
  });

  describe('deletePartner', () => {
    it('should delete a partner successfully', async () => {
      getMockChain().single.mockResolvedValueOnce({ data: { id: mockPartnerId }, error: null });
      
      const result = await deletePartner(mockPartnerId);
      expect(supabase.from).toHaveBeenCalledWith('partners');
      expect(getMockChain().delete).toHaveBeenCalled();
      expect(getMockChain().eq).toHaveBeenCalledWith('id', mockPartnerId);
      expect(getMockChain().select).toHaveBeenCalled();
      expect(getMockChain().single).toHaveBeenCalled();
      expect(result).toEqual({ id: mockPartnerId });
    });

     it('should return a specific message if partner to delete is not found (PGRST116)', async () => {
      const mockError = { message: 'Not found', code: 'PGRST116', details: '', hint: '' };
      getMockChain().single.mockResolvedValueOnce({ data: null, error: mockError });
      
      const result = await deletePartner('non-existent-id');
      expect(result).toEqual({ id: 'non-existent-id', message: 'Partner not found, presumed deleted or never existed.' });
    });
  });
});