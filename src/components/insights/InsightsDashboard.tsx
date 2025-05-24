'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Encounter, getEncountersByUserId } from '@/lib/encounters';
import { Partner, getPartnersByUserId } from '@/lib/partners';
import { JournalEntry, getJournalEntriesByUserId } from '@/lib/journalEntries';
import {
  calculateTagFrequency,
  calculateMoodEvolution,
  calculatePartnerInteractionStats,
  generateSimpleTagInsight,
  generatePartnerMoodInsight
} from '@/lib/insights';

interface InsightsDashboardProps {
  userId: string;
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ userId }) => {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userId) {
          setError("ID utilisateur non fourni.");
          setIsLoading(false);
          return;
        }
        const [fetchedEncounters, fetchedPartners, fetchedJournalEntries] = await Promise.all([
          getEncountersByUserId(userId),
          getPartnersByUserId(userId),
          getJournalEntriesByUserId(userId)
        ]);
        setEncounters(fetchedEncounters || []);
        setPartners(fetchedPartners || []);
        setJournalEntries(fetchedJournalEntries || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des données pour les insights:", err);
        setError("Impossible de charger les données pour les insights.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const tagFrequencies: ReturnType<typeof calculateTagFrequency> = useMemo(() => calculateTagFrequency(encounters), [encounters]);
  const moodEvolutions: ReturnType<typeof calculateMoodEvolution> = useMemo(() => calculateMoodEvolution(encounters, journalEntries), [encounters, journalEntries]);
  const partnerStats: ReturnType<typeof calculatePartnerInteractionStats> = useMemo(() => calculatePartnerInteractionStats(encounters, partners), [encounters, partners]);

  const simpleTagInsight = useMemo(() => generateSimpleTagInsight(tagFrequencies), [tagFrequencies]);
  const partnerMoodInsight = useMemo(() => generatePartnerMoodInsight(partnerStats), [partnerStats]);

  if (isLoading) return <p className="text-center py-8">Chargement des insights...</p>;
  if (error) return <p className="text-center text-red-500 py-8">Erreur: {error}</p>;
  if (encounters.length === 0) return <p className="text-center text-gray-500 py-8">Pas assez de données pour générer des insights. Commencez par ajouter des rencontres !</p>;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Tableau de Bord des Insights</h1>

      {(simpleTagInsight || partnerMoodInsight) && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-md shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-blue-700 mb-3">Quelques observations de Holly :</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-600">
            {simpleTagInsight && <li>{simpleTagInsight}</li>}
            {partnerMoodInsight && <li>{partnerMoodInsight}</li>}
          </ul>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Fréquence des Tags dans les Rencontres</h2>
        {Object.keys(tagFrequencies).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(tagFrequencies)
              .sort(([, countA], [, countB]) => countB - countA)
              .slice(0, 5)
              .map(([tag, count]) => (
              <li key={tag} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <span className="font-medium text-gray-600">{tag}</span>
                <span className="text-sm bg-indigo-500 text-white font-semibold px-2 py-0.5 rounded-full">{count}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500">Aucun tag utilisé pour le moment.</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Évolution de l&apos;Humeur Moyenne (par mois)</h2>
        {moodEvolutions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Humeur Moyenne (/5)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nb. Rencontres</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {moodEvolutions.map(me => (
                  <tr key={me.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{me.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{me.averageMood !== null ? me.averageMood.toFixed(1) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{me.encounterCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-500">Pas de données d&apos;humeur pour afficher une évolution.</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Statistiques par Partenaire</h2>
        {partnerStats.length > 0 ? (
           <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partenaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nb. Rencontres</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Humeur Moyenne (/5)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partnerStats.map(ps => (
                  <tr key={ps.partnerId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ps.partnerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ps.encounterCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ps.averageMood !== null ? ps.averageMood.toFixed(1) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-500">Aucune rencontre avec des partenaires pour afficher des statistiques.</p>}
      </div>

    </div>
  );
};

export default InsightsDashboard;
