'use client';

import React, { useState } from 'react';
import { signUpUser, signInUser } from '@/lib/auth';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
  <div className="text-center">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Bienvenue sur Bodycount</h2>
    <p className="mb-6 text-gray-600">Votre journal relationnel intelligent et privé.</p>
    <button onClick={onNext} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
      Commencer
    </button>
  </div>
);

const AuthStep = ({ onAuthenticated }: { onAuthenticated: (userId: string) => void }) => {
  const [isSigningUp, setIsSigningUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (isSigningUp && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    try {
      let userId: string | undefined;
      if (isSigningUp) {
        const credentials: SignUpWithPasswordCredentials = { email, password };
        const { user, error: signUpError } = await signUpUser(credentials);
        if (signUpError) throw signUpError;
        userId = user?.id; 
        if (!userId && !signUpError) { 
            alert("Inscription réussie ! Veuillez vérifier votre e-mail pour confirmer votre compte avant de vous connecter.");
             setIsLoading(false);
            return; 
        }

      } else {
        const credentials: SignInWithPasswordCredentials = { email, password };
        const { user, error: signInError } = await signInUser(credentials);
        if (signInError) throw signInError;
        userId = user?.id;
      }
      
      if (userId) {
        onAuthenticated(userId);
      } else {
         setError("Impossible de récupérer l'ID utilisateur après l'authentification.");
      }
    } catch (err: unknown) { 
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-center text-gray-700">
        {isSigningUp ? "Créez votre compte" : "Connectez-vous"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md text-center">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required 
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required 
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        {isSigningUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmez le mot de passe</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required 
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
        )}
        <button type="submit" disabled={isLoading} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          {isLoading ? 'Chargement...' : (isSigningUp ? "S'inscrire" : "Se connecter")}
        </button>
        <button type="button" onClick={() => setIsSigningUp(!isSigningUp)} className="w-full text-sm text-indigo-600 hover:text-indigo-500 text-center mt-2">
          {isSigningUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
        </button>
      </form>
    </div>
  );
};

const PrivacyStep = ({ onNext }: { onNext: () => void }) => (
  <div className="text-center">
    <h2 className="text-xl font-semibold mb-4 text-gray-700">Votre Vie Privée, Notre Priorité</h2>
    <p className="mb-3 text-gray-600">
      Chez Bodycount, nous prenons votre confidentialité très au sérieux. Toutes vos données personnelles et entrées de journal sont stockées de manière sécurisée.
    </p>
    <p className="mb-6 text-gray-600">
      Nous ne vendrons jamais vos données et ne les partagerons qu&apos;avec des tiers essentiels au fonctionnement de l&apos;application (comme notre fournisseur de base de données sécurisée), et ce, toujours dans le respect de notre politique de confidentialité.
    </p>
    <button onClick={onNext} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
      J&apos;ai compris
    </button>
  </div>
);

const FeaturesStep = ({ onNext }: { onNext: () => void }) => (
  <div className="text-left">
    <h2 className="text-xl font-semibold mb-6 text-center text-gray-700">Découvrez les Fonctionnalités Clés</h2>
    <ul className="space-y-4 mb-6 text-gray-600">
      <li><strong>Journal des Partenaires & Rencontres:</strong> Documentez vos relations et interactions en détail.</li>
      <li><strong>Journal Privé (Mirror):</strong> Un espace pour vos réflexions personnelles et émotions brutes.</li>
      <li><strong>Insights par Holly (IA):</strong> Recevez des analyses et aperçus basés sur vos entrées pour mieux vous comprendre.</li>
    </ul>
    <button onClick={onNext} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
      Suivant
    </button>
  </div>
);

const FinishStep = ({ onFinish }: { onFinish: () => void }) => (
  <div className="text-center">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Tout est Prêt !</h2>
    <p className="mb-6 text-gray-600">Vous êtes prêt à commencer votre voyage d&apos;introspection avec Bodycount.</p>
    <button onClick={onFinish} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
      Accéder à mon Journal
    </button>
  </div>
);

const OnboardingFlow = ({ onOnboardingComplete }: { onOnboardingComplete: (userId: string) => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const handleNext = () => setCurrentStep(prev => prev + 1);
  
  const handleAuthenticated = (id: string) => {
    setUserId(id);
    handleNext();
  };

  const handleFinish = () => {
    if (userId) {
      onOnboardingComplete(userId);
      localStorage.setItem('onboardingComplete', 'true');
    } else {
        console.error("UserID est null à la fin de l'onboarding");
    }
  };

  const steps = [
    <WelcomeStep key="welcome" onNext={handleNext} />,
    <AuthStep key="auth" onAuthenticated={handleAuthenticated} />,
    <PrivacyStep key="privacy" onNext={handleNext} />,
    <FeaturesStep key="features" onNext={handleNext} />,
    <FinishStep key="finish" onFinish={handleFinish} />
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-lg transition-all duration-500 ease-in-out">
        {steps[currentStep]}
      </div>
    </div>
  );
};

export default OnboardingFlow;
