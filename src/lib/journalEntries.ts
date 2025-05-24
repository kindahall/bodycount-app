import { supabase } from './supabaseClient';

export interface JournalEntry {
  id?: string; // UUID, généré par la base de données
  user_id: string; // UUID de l'utilisateur connecté
  entry_type?: string | null; // 'reflection', 'diary', 'prompt'
  content: string;
  mood?: number | null; // Par exemple, une échelle de 1 à 5
  media?: string[] | null; // URLs des médias associés
  created_at?: string; // Timestamp
  updated_at?: string; // Timestamp
}

// Créer une nouvelle entrée de journal
export const createJournalEntry = async (entryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([entryData])
    .select()
    .single();

  if (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
  return data;
};

// Récupérer une entrée de journal par son ID
export const getJournalEntryById = async (entryId: string) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (error) {
    console.error('Error fetching journal entry by ID:', error);
    if (error.code === 'PGRST116') { // Not found
        return null;
    }
    throw error;
  }
  return data;
};

// Récupérer toutes les entrées de journal d'un utilisateur
export const getJournalEntriesByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching journal entries by user ID:', error);
    throw error;
  }
  return data;
};

// Mettre à jour une entrée de journal
export const updateJournalEntry = async (entryId: string, updates: Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
  return data;
};

// Supprimer une entrée de journal
export const deleteJournalEntry = async (entryId: string) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    console.error('Error deleting journal entry:', error);
     if (error.code === 'PGRST116') {
        return { id: entryId, message: 'Journal entry not found, presumed deleted or never existed.' };
    }
    throw error;
  }
  return data;
};