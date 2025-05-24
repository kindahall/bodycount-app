import {
  createJournalEntry,
  getJournalEntryById,
  getJournalEntriesByUserId,
  updateJournalEntry,
  deleteJournalEntry,
  JournalEntry
} from '../journalEntries';
import { supabase } from '../supabaseClient';

// Mock du client Supabase (similaire aux autres fichiers de test)
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    })),
  },
}));

describe('JournalEntry Functions', () => {
  const mockUserId = 'test-user-id';
  const mockEntryId = 'test-entry-id';

  const mockEntryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'> = {
    user_id: mockUserId,
    content: 'This is a test journal entry.',
    mood: 5,
    entry_type: 'diary',
  };

  const mockFullEntryData: JournalEntry = {
    id: mockEntryId,
    ...mockEntryData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
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

  describe('createJournalEntry', () => {
    it('should create a journal entry successfully', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockFullEntryData, error: null });
      const result = await createJournalEntry(mockEntryData);
      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockInsert).toHaveBeenCalledWith([mockEntryData]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockFullEntryData);
    });

    it('should throw an error if Supabase call fails', async () => {
      const mockError = { message: 'Insert failed', code: 'XYZ', details: '', hint: '' };
      mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
      await expect(createJournalEntry(mockEntryData)).rejects.toEqual(mockError);
    });
  });

  describe('getJournalEntryById', () => {
    it('should return a journal entry if found', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockFullEntryData, error: null });
      const result = await getJournalEntryById(mockEntryId);
      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockEntryId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockFullEntryData);
    });

    it('should return null if entry not found', async () => {
      const mockError = { message: 'Not found', code: 'PGRST116', details: '', hint: '' };
      mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
      const result = await getJournalEntryById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getJournalEntriesByUserId', () => {
    it('should return a list of journal entries for a user', async () => {
      const entriesList = [mockFullEntryData, { ...mockFullEntryData, id: 'entry2' }];
      mockOrder.mockResolvedValueOnce({ data: entriesList, error: null });
      const result = await getJournalEntriesByUserId(mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(entriesList);
    });
  });
  
  describe('updateJournalEntry', () => {
    it('should update a journal entry successfully', async () => {
      const updates: Partial<JournalEntry> = { content: 'Updated content' };
      const updatedEntry = { ...mockFullEntryData, ...updates, updated_at: expect.any(String) };
      mockSingle.mockResolvedValueOnce({ data: updatedEntry, error: null });
      const result = await updateJournalEntry(mockEntryId, updates);
      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({content: 'Updated content', updated_at: expect.any(String)}));
      expect(mockEq).toHaveBeenCalledWith('id', mockEntryId);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(updatedEntry);
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete a journal entry successfully', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: mockEntryId }, error: null });
      const result = await deleteJournalEntry(mockEntryId);
      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', mockEntryId);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ id: mockEntryId });
    });

    it('should return a specific message if entry to delete is not found', async () => {
      const mockError = { message: 'Not found', code: 'PGRST116', details: '', hint: '' };
      mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
      const result = await deleteJournalEntry('non-existent-id');
      expect(result).toEqual({ id: 'non-existent-id', message: 'Journal entry not found, presumed deleted or never existed.' });
    });
  });
});