import { supabase } from './supabaseClient';

export interface PrivacySettings {
  user_id?: string; // PK, est aussi le user_id de la table users
  discreet_mode_active?: boolean | null;
  pin_hash?: string | null;
  alias?: string | null;
  offline_cache?: boolean | null;
  last_purge?: string | null; // Timestamp
  notifications_allowed?: boolean | null;
  updated_at?: string; // Timestamp, géré par trigger ou manuellement
}

// Récupérer les paramètres de confidentialité d'un utilisateur
export const getPrivacySettings = async (userId: string): Promise<PrivacySettings | null> => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Pas de ligne trouvée, ce qui est normal si non encore configuré
      return null;
    }
    console.error('Error fetching privacy settings:', error.message);
    throw error;
  }
  return data;
};

// Mettre à jour (ou insérer si non existant) les paramètres de confidentialité
export const upsertPrivacySettings = async (settings: PrivacySettings): Promise<PrivacySettings | null> => {
  if (!settings.user_id) {
    throw new Error('user_id is required to upsert privacy settings.');
  }
  
  const settingsToUpsert = {
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('privacy_settings')
    .upsert(settingsToUpsert, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting privacy settings:', error.message);
    throw error;
  }
  return data;
};

// --- Fonctions spécifiques pour le PIN (exemple client-side, le hashage devrait être robuste) ---

// Simule un hashage de PIN (NE PAS UTILISER EN PRODUCTION TEL QUEL)
// Une bibliothèque de hashage robuste comme bcrypt ou argon2 devrait être utilisée,
// et le hashage devrait idéalement se faire côté client avant l'envoi au serveur.
// Exportée pour les tests
export const simpleHash = async (pin: string): Promise<string> => {
  // Ceci est une simplification extrême pour l'exemple.
  // En réalité, utilisez window.crypto.subtle pour SHA-256 ou une lib dédiée.
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback très basique si window.crypto n'est pas disponible (ex: SSR, tests node simples)
  return `hashed_${pin}_fallback`; 
};


export const setPin = async (userId: string, pin: string): Promise<boolean> => {
  try {
    const pin_hash = await simpleHash(pin);
    const currentSettings = await getPrivacySettings(userId) || { user_id: userId };
    await upsertPrivacySettings({ ...currentSettings, user_id: userId, pin_hash, discreet_mode_active: true });
    return true;
  } catch (error) {
    console.error("Error setting PIN:", error);
    return false;
  }
};

export const verifyPin = async (userId: string, pinAttempt: string): Promise<boolean> => {
  try {
    const settings = await getPrivacySettings(userId);
    if (settings && settings.pin_hash) {
      const attemptHash = await simpleHash(pinAttempt);
      return attemptHash === settings.pin_hash;
    }
    return false; // Pas de PIN configuré ou pas de settings
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return false;
  }
};

export const removePin = async (userId: string): Promise<boolean> => {
    try {
        const currentSettings = await getPrivacySettings(userId);
        if (currentSettings) {
            await upsertPrivacySettings({ ...currentSettings, user_id: userId, pin_hash: null, discreet_mode_active: false });
        }
        // Si currentSettings est null, il n'y a rien à faire, considérer comme réussi.
        return true; 
    } catch (error) {
        console.error("Error removing PIN:", error);
        return false;
    }
};