import {
  getPrivacySettings,
  upsertPrivacySettings,
  setPin,
  verifyPin,
  removePin,
  PrivacySettings,
  // simpleHash // Supprimé car non utilisé directement
} from '../privacySettings';
import { supabase } from '../supabaseClient';
import { TextEncoder } from 'util'; // Importer TextEncoder
global.TextEncoder = TextEncoder; // Assigner globalement si nécessaire pour les tests


// Mocker le client Supabase
const mockSelectSupabase = jest.fn();
const mockInsertSupabase = jest.fn();
const mockUpdateSupabase = jest.fn();
const mockUpsertSupabase = jest.fn();
const mockEqSupabase = jest.fn();
const mockSingleSupabase = jest.fn();

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelectSupabase,
      insert: mockInsertSupabase,
      update: mockUpdateSupabase,
      upsert: mockUpsertSupabase,
      eq: mockEqSupabase,
      single: mockSingleSupabase,
    })),
  },
}));

// Mock pour window.crypto.subtle pour contrôler la sortie de simpleHash
const mockDigestActual = jest.fn();
Object.defineProperty(window, 'crypto', {
  value: { subtle: { digest: mockDigestActual, }, },
  writable: true,
});
// global.TextEncoder = require('util').TextEncoder; // Déplacé en haut


describe('PrivacySettings Functions', () => {
  const mockUserId = 'test-user-id';
  const baseMockSettings: Omit<PrivacySettings, 'user_id' | 'updated_at'> = {
    discreet_mode_active: true,
    pin_hash: 'initial_hashed_pin', // Valeur initiale pour les tests
    alias: 'TestAlias',
    offline_cache: false,
    notifications_allowed: true,
  };
  const mockSettings: PrivacySettings = {
    ...baseMockSettings,
    user_id: mockUserId,
    updated_at: new Date().toISOString(),
  };

  // Fonction utilitaire pour simuler le hashage tel qu'il serait fait par simpleHash
  const getExpectedHash = async (pin: string): Promise<string> => {
    // Cette implémentation doit correspondre à celle de simpleHash pour que les tests soient valides
    // ou nous mockons mockDigestActual pour retourner une valeur prévisible.
    // const encoder = new TextEncoder(); // Pas besoin ici si on simule directement le buffer
    // const data = encoder.encode(pin); // Non utilisé
    // Simuler un retour de digest pour un hash prévisible
    // Par exemple, un buffer de 32 bytes rempli de 1 pour '1234' et de 2 pour '0000'
    let buffer;
    if (pin === '1234') {
        buffer = new Uint8Array(32).fill(1).buffer;
    } else if (pin === '0000') {
        buffer = new Uint8Array(32).fill(2).buffer;
    } else {
        buffer = new Uint8Array(32).fill(0).buffer; // Default pour les autres
    }
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };


  beforeEach(() => {
    (supabase.from as jest.Mock).mockClear();
    mockSelectSupabase.mockClear().mockReturnThis();
    mockInsertSupabase.mockClear().mockReturnThis();
    mockUpdateSupabase.mockClear().mockReturnThis();
    mockUpsertSupabase.mockClear().mockReturnThis();
    mockEqSupabase.mockClear().mockReturnThis();
    mockSingleSupabase.mockClear();
    mockDigestActual.mockClear(); // Clear le mock de digest
  });


  describe('getPrivacySettings', () => {
    it('should return settings if found', async () => {
      mockSingleSupabase.mockResolvedValueOnce({ data: mockSettings, error: null });
      const result = await getPrivacySettings(mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('privacy_settings');
      expect(result).toEqual(mockSettings);
    });

    it('should return null if settings not found (PGRST116)', async () => {
      const mockError = { message: 'Not found', code: 'PGRST116', details: '', hint: '' };
      mockSingleSupabase.mockResolvedValueOnce({ data: null, error: mockError });
      const result = await getPrivacySettings('new-user-id');
      expect(result).toBeNull();
    });
  });

  describe('upsertPrivacySettings', () => {
    it('should upsert settings successfully', async () => {
      const newSettingsData = { ...mockSettings, user_id: 'upsert-user', alias: 'New Alias' };
      mockUpsertSupabase.mockReturnThis(); 
      mockSelectSupabase.mockReturnThis(); 
      mockSingleSupabase.mockResolvedValueOnce({ data: newSettingsData, error: null });

      const result = await upsertPrivacySettings(newSettingsData);
      expect(mockUpsertSupabase).toHaveBeenCalledWith(
        expect.objectContaining({ alias: 'New Alias', updated_at: expect.any(String) }),
        { onConflict: 'user_id' }
      );
      expect(result).toEqual(newSettingsData);
    });
  
    it('should throw error if user_id is missing', async () => {
        const invalidSettings: Partial<Omit<PrivacySettings, 'user_id'>> = { discreet_mode_active: true };
        await expect(upsertPrivacySettings(invalidSettings as PrivacySettings)).rejects.toThrow('user_id is required to upsert privacy settings.');
    });
    });

  describe('PIN functions', () => {
    const pin = '1234';
    const wrongPin = '0000';

    it('setPin should hash and upsert settings', async () => {
      const expectedHashedPin = await getExpectedHash(pin);
      // Mock digest pour qu'il retourne la valeur attendue pour '1234'
      mockDigestActual.mockResolvedValueOnce(new Uint8Array(32).fill(1).buffer);

      mockSingleSupabase.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found', details: '', hint: '' } }); 
      
      mockUpsertSupabase.mockReturnThis();
      mockSelectSupabase.mockReturnThis();
      mockSingleSupabase.mockResolvedValueOnce({ data: { ...mockSettings, pin_hash: expectedHashedPin, discreet_mode_active: true }, error: null });

      const success = await setPin(mockUserId, pin); 
      
      expect(mockDigestActual).toHaveBeenCalled(); // Vérifie que le hashage a eu lieu
      expect(mockUpsertSupabase).toHaveBeenCalledWith(
        expect.objectContaining({
            user_id: mockUserId,
            pin_hash: expectedHashedPin,
            discreet_mode_active: true,
        }),
        { onConflict: 'user_id' }
      );
      expect(success).toBe(true);
    });

    it('verifyPin should correctly verify a PIN', async () => {
      const correctHashedPin = await getExpectedHash(pin);
      // Mock digest pour le PIN correct
      mockDigestActual.mockResolvedValueOnce(new Uint8Array(32).fill(1).buffer);
      mockSingleSupabase.mockResolvedValueOnce({ data: { ...mockSettings, pin_hash: correctHashedPin }, error: null }); 
      
      const isValid = await verifyPin(mockUserId, pin);
      expect(mockDigestActual).toHaveBeenCalled();
      expect(isValid).toBe(true);

      // Mock digest pour le mauvais PIN
      mockDigestActual.mockResolvedValueOnce(new Uint8Array(32).fill(2).buffer); // Hash différent
      mockSingleSupabase.mockResolvedValueOnce({ data: { ...mockSettings, pin_hash: correctHashedPin }, error: null }); 
      
      const isInvalid = await verifyPin(mockUserId, wrongPin);
      expect(mockDigestActual).toHaveBeenCalled();
      expect(isInvalid).toBe(false);
    });
    
    it('verifyPin should return false if no PIN is set', async () => {
      mockSingleSupabase.mockResolvedValueOnce({ data: { ...mockSettings, pin_hash: null }, error: null });
      
      const isValid = await verifyPin(mockUserId, pin);
      expect(isValid).toBe(false);
      expect(mockDigestActual).not.toHaveBeenCalled(); 
    });

    it('removePin should set pin_hash to null and discreet_mode_active to false', async () => {
      const initialSettingsWithPin = { ...mockSettings, pin_hash: 'somehash', discreet_mode_active: true };
      mockSingleSupabase.mockResolvedValueOnce({ data: initialSettingsWithPin, error: null }); 
      
      mockUpsertSupabase.mockReturnThis();
      mockSelectSupabase.mockReturnThis();
      mockSingleSupabase.mockResolvedValueOnce({ data: { ...initialSettingsWithPin, pin_hash: null, discreet_mode_active: false }, error: null });

      const success = await removePin(mockUserId);
      expect(mockUpsertSupabase).toHaveBeenCalledWith(
        expect.objectContaining({
          pin_hash: null,
          discreet_mode_active: false,
        }),
        { onConflict: 'user_id' }
      );
      expect(success).toBe(true);
    });
  });
});