import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OnboardingFlow from '../OnboardingFlow';
// import * as privacySettingsLib from '@/lib/privacySettings'; // Supprimé car non utilisé
import * as authLib from '@/lib/auth'; // Pour mocker signUpUser et signInUser

jest.mock('@/lib/privacySettings', () => ({
  // upsertPrivacySettings: jest.fn(), // Pas utilisé dans le flux actuel
}));
jest.mock('@/lib/auth', () => ({
  signUpUser: jest.fn(),
  signInUser: jest.fn(),
}));

// const mockUpsertPrivacySettings = privacySettingsLib.upsertPrivacySettings as jest.Mock; // Pas utilisé
const mockSignUpUser = authLib.signUpUser as jest.Mock;
const mockSignInUser = authLib.signInUser as jest.Mock;


describe('OnboardingFlow', () => {
  // const mockUserId = 'user-test-onboarding'; // userId est géré en interne
  const mockOnOnboardingComplete = jest.fn();

  beforeEach(() => {
    // mockUpsertPrivacySettings.mockClear(); // Pas utilisé
    mockSignUpUser.mockClear();
    mockSignInUser.mockClear();
    mockOnOnboardingComplete.mockClear();
  });

  it('renders step 1 (Welcome) initially', () => {
    render(<OnboardingFlow onOnboardingComplete={mockOnOnboardingComplete} />);
    expect(screen.getByRole('heading', { name: /bienvenue sur bodycount/i })).toBeInTheDocument();
    expect(screen.getByText(/votre journal relationnel intelligent et privé./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /commencer/i })).toBeInTheDocument();
  });

  it('navigates to step 2 (Auth) when "Commencer" is clicked', () => {
    render(<OnboardingFlow onOnboardingComplete={mockOnOnboardingComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /commencer/i }));
    expect(screen.getByRole('heading', { name: /créez votre compte/i })).toBeInTheDocument(); // Ou "Connectez-vous"
  });

  // Le test 'allows changing privacy settings...' est supprimé car cette étape n'existe plus dans le flux actuel.
  // L'étape de confidentialité est informative.

  it('calls onOnboardingComplete on final step after authentication', async () => {
    const testUserId = 'authenticated-user-id';
    // Simuler une authentification réussie (inscription ou connexion)
    mockSignUpUser.mockResolvedValueOnce({ user: { id: testUserId }, error: null });
    // ou mockSignInUser.mockResolvedValueOnce({ user: { id: testUserId }, error: null });

    render(<OnboardingFlow onOnboardingComplete={mockOnOnboardingComplete} />);
    
    // Étape 1: Welcome
    fireEvent.click(screen.getByRole('button', { name: /commencer/i }));
    
    // Étape 2: Auth
    // Simuler la saisie pour l'inscription
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirmez le mot de passe/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    // Attendre que l'authentification soit traitée et passe à l'étape suivante
    // L'étape suivante est PrivacyStep
    expect(await screen.findByRole('heading', { name: /votre vie privée, notre priorité/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /j'ai compris/i })); // Étape 3 -> 4

    // Étape 4: Features
    expect(await screen.findByRole('heading', { name: /découvrez les fonctionnalités clés/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /suivant/i })); // Étape 4 -> 5

    // Étape 5: Finish
    expect(await screen.findByRole('heading', { name: /tout est prêt !/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /accéder à mon journal/i }));
    
    await waitFor(() => {
      expect(mockOnOnboardingComplete).toHaveBeenCalledTimes(1);
      expect(mockOnOnboardingComplete).toHaveBeenCalledWith(testUserId); // Vérifier que userId est passé
    });
  });

  it('allows navigating back from Auth (step 2) to Welcome (step 1) - (Conceptual, no back button in AuthStep)', () => {
    // L'AuthStep actuel n'a pas de bouton "Précédent".
    // Si un bouton précédent était ajouté à AuthStep, ce test serait pertinent.
    // Pour l'instant, on peut tester la navigation vers AuthStep.
    render(<OnboardingFlow onOnboardingComplete={mockOnOnboardingComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /commencer/i }));
    expect(screen.getByRole('heading', { name: /créez votre compte/i })).toBeInTheDocument();
  });
});