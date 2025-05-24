// jest.config.js
const nextJest = require('next/jest');

// Fournir le chemin vers votre application Next.js pour charger next.config.js et les variables .env dans votre environnement de test
const createJestConfig = nextJest({
  dir: './',
});

// Ajouter toute configuration Jest personnalisée à exporter par createJestConfig
const customJestConfig = {
  // Ajouter plus d'options de configuration avant chaque exécution de test ici
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // si vous avez un fichier de configuration global
  
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Gérer les alias de module (si vous en utilisez dans tsconfig.json)
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  transform: {
    // Utiliser ts-jest pour les fichiers .ts/.tsx
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Assurez-vous que cela pointe vers votre tsconfig
    }],
  },
  // Ignorer les transformations pour node_modules sauf pour certains modules spécifiques si nécessaire
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};

// createJestConfig est exporté de cette manière pour s'assurer que next/jest peut charger la configuration Next.js pour les tests
module.exports = createJestConfig(customJestConfig);