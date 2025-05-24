'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Encounter, getEncountersByUserId, getEncountersByPartnerId, deleteEncounter } from '@/lib/encounters';
import { Partner } from '@/lib/partners'; // Pour afficher le nom du partenaire
import EncounterForm from './EncounterForm'; 

interface EncounterListProps {
  userId: string;
  partnerId?: string | null;
  partners: Partner[];
  onEditEncounter: (encounter: Encounter) => void;
  onAddEncounter: () => void;
}

const EncounterList: React.FC<EncounterListProps> = ({ userId, partnerId, partners, onEditEncounter, onAddEncounter }) => {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchEncounters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userId) {
        setError("ID utilisateur non fourni.");
        setIsLoading(false);
        return;
      }
      let fetchedEncounters;
      if (partnerId) {
        fetchedEncounters = await getEncountersByPartnerId(partnerId, userId);
      } else {
        fetchedEncounters = await getEncountersByUserId(userId);
      }
      setEncounters(fetchedEncounters || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des rencontres:", err);
      setError("Impossible de charger les rencontres.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, partnerId]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  const handleDelete = async (encounterId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette rencontre ?")) {
      try {
        await deleteEncounter(encounterId);
        // setEncounters(encounters.filter(e => e.id !== encounterId)); // L'optimistic update est bien, mais le test attend un re-fetch
        fetchEncounters(); // Re-fetch pour assurer la cohérence et satisfaire le test
      } catch (err) {
        console.error("Erreur lors de la suppression de la rencontre:", err);
        setError("Impossible de supprimer la rencontre.");
      }
    }
  };

  const handleEdit = (encounter: Encounter) => {
    setEditingEncounter(encounter);
    setShowForm(true);
    onEditEncounter(encounter); 
  };

  const handleFormClose = () => {
    setEditingEncounter(null);
    setShowForm(false);
    fetchEncounters(); 
  };
  
  const handleAddNew = () => {
    setEditingEncounter(null);
    setShowForm(true);
    onAddEncounter(); 
  };

  const getPartnerName = (pId: string | null | undefined) => {
    if (!pId) return 'N/A'; // Devrait être géré comme "Rencontre indépendante" ou similaire
    const partner = partners.find(p => p.id === pId);
    return partner ? partner.name : 'Partenaire inconnu';
  };

  if (isLoading) return <p data-testid="loading-indicator" className="text-center py-4">Chargement des rencontres...</p>;
  if (error) return <p data-testid="error-message" className="text-center text-red-500 py-4">Erreur: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {partnerId ? `Rencontres avec ${getPartnerName(partnerId)}` : 'Toutes Mes Rencontres'}
      </h1>

      <div className="mb-6 text-right">
        <button
          onClick={handleAddNew}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Ajouter une rencontre
        </button>
      </div>

      {showForm && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <EncounterForm
                    userId={userId}
                    partners={partners} 
                    existingEncounter={editingEncounter}
                    defaultPartnerId={partnerId} 
                    onClose={handleFormClose}
                />
            </div>
        </div>
      )}

      {encounters.length === 0 && !showForm ? (
        <p data-testid="no-encounters-message" className="text-center text-gray-500">Aucune rencontre enregistrée pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {encounters.map((encounter) => (
            <div key={encounter.id} data-testid={`encounter-card-${encounter.id}`} className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">
                    Rencontre du {new Date(encounter.date).toLocaleDateString('fr-FR')}
                    {encounter.partner_id ? ` avec ${getPartnerName(encounter.partner_id)}` : ' (Rencontre indépendante)'}
                  </h2>
                  {encounter.place && <p className="text-sm text-gray-500">Lieu: {encounter.place}</p>}
                </div>
                <div className="text-sm text-gray-600">
                  Humeur: {encounter.mood ? `${encounter.mood}/5` : 'N/A'}
                </div>
              </div>
              {encounter.notes && <p className="text-sm text-gray-700 mt-2 mb-3 whitespace-pre-wrap">Notes: {encounter.notes}</p>}
              {encounter.tags && encounter.tags.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-600">Tags: </span>
                  {encounter.tags.map(tag => (
                    <span key={tag} className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 mr-1 mb-1">{tag}</span>
                  ))}
                </div>
              )}
               {typeof encounter.would_return === 'boolean' && (
                <p className="text-sm text-gray-600">
                  Reverrais cette personne: {encounter.would_return ? 'Oui' : 'Non'}
                </p>
              )}
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  onClick={() => handleEdit(encounter)}
                  data-testid={`edit-encounter-${encounter.id}`}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                >
                  Modifier
                </button>
                <button
                  onClick={() => encounter.id && handleDelete(encounter.id)}
                  data-testid={`delete-encounter-${encounter.id}`}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EncounterList;