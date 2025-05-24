'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react'; // Ajout de useCallback
import { Partner, getPartnersByUserId, deletePartner } from '@/lib/partners'; // Assurez-vous que le user_id est géré
import PartnerForm from './PartnerForm';

interface PartnerListProps {
  userId: string;
  onEditPartner: (partner: Partner) => void;
  onSelectPartner: (partnerId: string | undefined) => void; // Peut-être undefined si aucun partenaire n'est sélectionné
  onAddPartner: () => void;
}

const PartnerList: React.FC<PartnerListProps> = ({ userId, onEditPartner, onSelectPartner, onAddPartner }) => {
  const [allPartners, setAllPartners] = useState<Partner[]>([]); // Stocke tous les partenaires récupérés
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userId) {
        setError("ID utilisateur non fourni.");
        setIsLoading(false);
        return;
      }
      const fetchedPartners = await getPartnersByUserId(userId);
      setAllPartners(fetchedPartners || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des partenaires:", err);
      setError("Impossible de charger les partenaires.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // userId est une dépendance de fetchPartners

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]); // Maintenant fetchPartners est une dépendance stable

  const handleDelete = async (partnerId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce partenaire ?")) {
      try {
        await deletePartner(partnerId);
        fetchPartners(); 
      } catch (err) {
        console.error("Erreur lors de la suppression du partenaire:", err);
        setError("Impossible de supprimer le partenaire.");
      }
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setShowForm(true);
    onEditPartner(partner);
  };

  const handleFormClose = () => {
    setEditingPartner(null);
    setShowForm(false);
    fetchPartners(); 
  };

  const handleAddNew = () => {
    setEditingPartner(null);
    setShowForm(true);
    onAddPartner(); 
  }

  const filteredPartners = useMemo(() => {
    return allPartners.filter(partner => {
      const nameMatch = partner.name.toLowerCase().includes(searchTerm.toLowerCase());
      const notesMatch = partner.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const tagMatch = filterTag ? partner.tags?.includes(filterTag.trim()) : true;
      return (nameMatch || notesMatch) && tagMatch;
    });
  }, [allPartners, searchTerm, filterTag]);

  if (isLoading) return <p data-testid="loading-indicator" className="text-center py-4">Chargement des partenaires...</p>;
  if (error) return <p data-testid="error-message" className="text-center text-red-500 py-4">Erreur: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Mes Partenaires</h1>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex-grow w-full sm:w-auto">
          <input
            type="text"
            placeholder="Rechercher par nom ou notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-grow w-full sm:w-auto">
          <input
            type="text"
            placeholder="Filtrer par tag..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          />
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full sm:w-auto"
        >
          Ajouter un partenaire
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <PartnerForm
              userId={userId} 
              existingPartner={editingPartner}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {filteredPartners.length === 0 && !showForm ? (
        <p data-testid="no-partners-message" className="text-center text-gray-500">
          {allPartners.length > 0 ? "Aucun partenaire ne correspond à vos critères de recherche." : "Aucun partenaire enregistré pour le moment."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              data-testid={`partner-card-${partner.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectPartner(partner.id)} 
            >
              <h2 className="text-xl font-semibold mb-2">{partner.name}</h2>
              {partner.gender && <p className="text-sm text-gray-600 mb-1">Genre: {partner.gender}</p>}
              {partner.notes && <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">Notes: {partner.notes}</p>}
              {partner.tags && partner.tags.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-600">Tags: </span>
                  {partner.tags.map(tag => (
                    <span key={tag} className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 mr-1 mb-1">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(partner); }} // Empêcher le clic de la carte
                  data-testid={`edit-partner-${partner.id}`}
                  className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                >
                  Modifier
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (partner.id) {
                      handleDelete(partner.id);
                    }
                  }} // Empêcher le clic de la carte et rendre l'appel conditionnel plus explicite
                  data-testid={`delete-partner-${partner.id}`}
                  className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
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

export default PartnerList;