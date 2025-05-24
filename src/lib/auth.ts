import { supabase } from './supabaseClient';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';

// Inscription d'un nouvel utilisateur
export const signUpUser = async (credentials: SignUpWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }
  // data.user contient l'utilisateur si l'inscription réussit et la confirmation email n'est pas requise
  // data.session est null si la confirmation email est requise
  return { user: data.user, session: data.session, error };
};

// Connexion d'un utilisateur existant
export const signInUser = async (credentials: SignInWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }
  return { user: data.user, session: data.session, error };
};

// Déconnexion de l'utilisateur actuel
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
  return { error };
};

// Récupérer la session utilisateur actuelle
export const getCurrentUserSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
   if (error) {
    console.error('Error getting session:', error.message);
    throw error;
  }
  return session;
};

// Récupérer l'utilisateur actuel
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    throw error;
  }
  return user;
};

// Écouter les changements d'état d'authentification
export const onAuthStateChange = (callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};