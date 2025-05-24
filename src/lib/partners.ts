import { supabase } from './supabaseClient';

export interface Partner {
  id?: string; // UUID, généré par la base de données
  user_id: string; // UUID de l'utilisateur connecté
  name: string;
  gender?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  tags?: string[] | null;
  created_at?: string; // Timestamp
  updated_at?: string; // Timestamp
}

// Créer un nouveau partenaire
export const createPartner = async (partnerData: Omit<Partner, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('partners')
    .insert([partnerData])
    .select()
    .single(); // .single() pour retourner un seul objet au lieu d'un tableau

  if (error) {
    console.error('Error creating partner:', error);
    throw error;
  }
  return data;
};

// Récupérer un partenaire par son ID
export const getPartnerById = async (partnerId: string) => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single();

  if (error) {
    console.error('Error fetching partner by ID:', error);
    // Ne pas lever d'erreur si c'est une erreur 'not found', retourner null à la place
    if (error.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
        return null;
    }
    throw error;
  }
  return data;
};

// Récupérer tous les partenaires d'un utilisateur
export const getPartnersByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching partners by user ID:', error);
    throw error;
  }
  return data;
};

// Mettre à jour un partenaire
export const updatePartner = async (partnerId: string, updates: Partial<Omit<Partner, 'id' | 'user_id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('partners')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', partnerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating partner:', error);
    throw error;
  }
  return data;
};

// Supprimer un partenaire
export const deletePartner = async (partnerId: string) => {
  const { data, error } = await supabase
    .from('partners')
    .delete()
    .eq('id', partnerId)
    .select()
    .single();

  if (error) {
    console.error('Error deleting partner:', error);
    // Gérer le cas où le partenaire n'existe pas déjà (peut être considéré comme une suppression réussie)
    if (error.code === 'PGRST116') {
        return { id: partnerId, message: 'Partner not found, presumed deleted or never existed.' };
    }
    throw error;
  }
  return data;
};