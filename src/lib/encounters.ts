import { supabase } from './supabaseClient';

export interface Encounter {
  id?: string; // UUID, généré par la base de données
  user_id: string; // UUID de l'utilisateur connecté
  partner_id?: string | null; // UUID du partenaire associé, peut être null
  date: string; // Date de la rencontre (format YYYY-MM-DD)
  place?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  mood?: number | null; // Par exemple, une échelle de 1 à 5
  photos?: string[] | null; // URLs des photos
  would_return?: boolean | null;
  created_at?: string; // Timestamp
  updated_at?: string; // Timestamp
}

// Créer une nouvelle rencontre
export const createEncounter = async (encounterData: Omit<Encounter, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('encounters')
    .insert([encounterData])
    .select()
    .single();

  if (error) {
    console.error('Error creating encounter:', error);
    throw error;
  }
  return data;
};

// Récupérer une rencontre par son ID
export const getEncounterById = async (encounterId: string) => {
  const { data, error } = await supabase
    .from('encounters')
    .select('*')
    .eq('id', encounterId)
    .single();

  if (error) {
    console.error('Error fetching encounter by ID:', error);
    if (error.code === 'PGRST116') {
        return null;
    }
    throw error;
  }
  return data;
};

// Récupérer toutes les rencontres d'un utilisateur
export const getEncountersByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('encounters')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching encounters by user ID:', error);
    throw error;
  }
  return data;
};

// Récupérer toutes les rencontres associées à un partenaire spécifique
export const getEncountersByPartnerId = async (partnerId: string, userId: string) => {
  const { data, error } = await supabase
    .from('encounters')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('user_id', userId) // S'assurer que l'utilisateur ne récupère que ses propres rencontres
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching encounters by partner ID:', error);
    throw error;
  }
  return data;
};

// Mettre à jour une rencontre
export const updateEncounter = async (encounterId: string, updates: Partial<Omit<Encounter, 'id' | 'user_id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('encounters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', encounterId)
    .select()
    .single();

  if (error) {
    console.error('Error updating encounter:', error);
    throw error;
  }
  return data;
};

// Supprimer une rencontre
export const deleteEncounter = async (encounterId: string) => {
  const { data, error } = await supabase
    .from('encounters')
    .delete()
    .eq('id', encounterId)
    .select()
    .single();

  if (error) {
    console.error('Error deleting encounter:', error);
    if (error.code === 'PGRST116') {
        return { id: encounterId, message: 'Encounter not found, presumed deleted or never existed.' };
    }
    throw error;
  }
  return data;
};