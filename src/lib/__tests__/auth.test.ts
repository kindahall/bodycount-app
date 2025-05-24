import {
  signUpUser,
  signInUser,
  signOutUser,
  getCurrentUserSession,
  getCurrentUser,
  onAuthStateChange
} from '../auth';
import { supabase } from '../supabaseClient'; // Importer le supabase mocké
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials, Session, User, AuthError } from '@supabase/supabase-js';

// Mocker le client Supabase et spécifiquement la partie 'auth'
jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// Accéder aux mocks via l'objet supabase mocké. TypeScript devrait les reconnaître comme des jest.Mock.
const mockSignUp = supabase.auth.signUp as jest.Mock<Promise<{ data: { user: User | null, session: Session | null }, error: AuthError | null }>>;
const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock<Promise<{ data: { user: User | null, session: Session | null }, error: AuthError | null }>>;
const mockSignOut = supabase.auth.signOut as jest.Mock<Promise<{ error: AuthError | null }>>;
const mockGetSession = supabase.auth.getSession as jest.Mock<Promise<{ data: { session: Session | null }, error: AuthError | null }>>;
const mockGetUser = supabase.auth.getUser as jest.Mock<Promise<{ data: { user: User | null }, error: AuthError | null }>>;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;


describe('Auth Functions', () => {
  beforeEach(() => {
    // Réinitialiser tous les mocks avant chaque test
    mockSignUp.mockClear();
    mockSignInWithPassword.mockClear();
    mockSignOut.mockClear();
    mockGetSession.mockClear();
    mockGetUser.mockClear();
    mockOnAuthStateChange.mockClear();
    // S'assurer que onAuthStateChange retourne une structure valide pour la subscription
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  });

  describe('signUpUser', () => {
    const credentials: SignUpWithPasswordCredentials = { email: 'test@example.com', password: 'password123' };
    const mockUser = { id: 'user-id', email: 'test@example.com' } as User;
    const mockSession = { access_token: 'token', user: mockUser } as Session;

    it('should sign up a user successfully', async () => {
      mockSignUp.mockResolvedValueOnce({ data: { user: mockUser, session: mockSession }, error: null });
      const result = await signUpUser(credentials);
      expect(mockSignUp).toHaveBeenCalledWith(credentials);
      expect(result).toEqual({ user: mockUser, session: mockSession, error: null });
    });

    it('should throw an error if sign up fails', async () => {
      const mockError = { message: 'Sign up failed', name: 'AuthError', status: 400 } as AuthError;
      mockSignUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: mockError });
      await expect(signUpUser(credentials)).rejects.toEqual(mockError);
    });
  });

  describe('signInUser', () => {
    const credentials: SignInWithPasswordCredentials = { email: 'test@example.com', password: 'password123' };
    const mockUser = { id: 'user-id', email: 'test@example.com' } as User;
    const mockSession = { access_token: 'token', user: mockUser } as Session;

    it('should sign in a user successfully', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ data: { user: mockUser, session: mockSession }, error: null });
      const result = await signInUser(credentials);
      expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials);
      expect(result).toEqual({ user: mockUser, session: mockSession, error: null });
    });

    it('should throw an error if sign in fails', async () => {
      const mockError = { message: 'Sign in failed', name: 'AuthError', status: 400 } as AuthError;
      mockSignInWithPassword.mockResolvedValueOnce({ data: { user: null, session: null }, error: mockError });
      await expect(signInUser(credentials)).rejects.toEqual(mockError);
    });
  });

  describe('signOutUser', () => {
    it('should sign out a user successfully', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });
      const result = await signOutUser();
      expect(mockSignOut).toHaveBeenCalled();
      expect(result).toEqual({ error: null });
    });

    it('should throw an error if sign out fails', async () => {
      const mockError = { message: 'Sign out failed', name: 'AuthError', status: 500 } as AuthError;
      mockSignOut.mockResolvedValueOnce({ error: mockError });
      await expect(signOutUser()).rejects.toEqual(mockError);
    });
  });

  describe('getCurrentUserSession', () => {
    it('should return the current session', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' } as User;
      const mockSession = { access_token: 'token', user: mockUser } as Session;
      mockGetSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });
      const session = await getCurrentUserSession();
      expect(mockGetSession).toHaveBeenCalled();
      expect(session).toEqual(mockSession);
    });

    it('should throw an error if getSession fails', async () => {
        const mockError = { message: 'Get session failed', name: 'AuthError', status: 500 } as AuthError;
        mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: mockError });
        await expect(getCurrentUserSession()).rejects.toEqual(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' } as User;
      mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
      const user = await getCurrentUser();
      expect(mockGetUser).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });
     it('should throw an error if getUser fails', async () => {
        const mockError = { message: 'Get user failed', name: 'AuthError', status: 500 } as AuthError;
        mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: mockError });
        await expect(getCurrentUser()).rejects.toEqual(mockError);
    });
  });

  describe('onAuthStateChange', () => {
    it('should call the callback on auth state change and return subscription', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      // S'assurer que la valeur retournée par le mock correspond à la structure attendue
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } });
      
      const subscription = onAuthStateChange(callback);
      
      expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback);
      expect(subscription).toBeDefined();
      expect(subscription.unsubscribe).toEqual(mockUnsubscribe);
    });
  });
});