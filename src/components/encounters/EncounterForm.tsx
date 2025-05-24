'use client';

import React, { useState, useEffect } from 'react';
import { Encounter, createEncounter, updateEncounter } from '@/lib/encounters';
import { Partner } from '@/lib/partners';

interface EncounterFormProps {
  userId: string;
  partners: Partner[]; // Pour le sélecteur de partenaire
  existingEncounter?: Encounter | null;
  defaultPartnerId?: string | null; // Pour pré-remplir si on ajoute depuis la page d'un partenaire
  onClose: () => void;
}

const EncounterForm: React.FC<EncounterFormProps> = ({ userId, partners, existingEncounter, defaultPartnerId, onClose }) => {
  const [partnerId, setPartnerId] = useState<string | undefined>(defaultPartnerId || undefined);
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [photos, setPhotos] = useState(''); // Gérer comme une chaîne d'URLs séparées par des virgules
  const [wouldReturn, setWouldReturn] = useState<boolean | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingEncounter) {
      setPartnerId(existingEncounter.partner_id || undefined);
      setDate(existingEncounter.date ? new Date(existingEncounter.date).toISOString().split('T')[0] : '');
      setPlace(existingEncounter.place || '');
      setTags(existingEncounter.tags?.join(', ') || '');
      setNotes(existingEncounter.notes || '');
      setMood(existingEncounter.mood || undefined);
      setPhotos(existingEncounter.photos?.join(', ') || '');
      setWouldReturn(existingEncounter.would_return === null ? undefined : existingEncounter.would_return);
    } else {
      // Réinitialiser pour le mode ajout, en utilisant defaultPartnerId si fourni
      setPartnerId(defaultPartnerId || undefined);
      setDate(new Date().toISOString().split('T')[0]); // Date actuelle par défaut
      setPlace('');
      setTags('');
      setNotes('');
      setMood(undefined);
      setPhotos('');
      setWouldReturn(undefined);
    }
  }, [existingEncounter, defaultPartnerId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!userId) {
        setError("L'ID utilisateur est manquant.");
        setIsLoading(false);
        return;
    }
    if (!date) {
        setError("La date de la rencontre est requise.");
        setIsLoading(false);
        return;
    }

    const encounterData: Partial<Encounter> = {
      user_id: userId,
      partner_id: partnerId || null,
      date,
      place: place.trim() || null,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag).length > 0 ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : null,
      notes: notes.trim() || null,
      mood: mood === undefined ? null : Number(mood),
      photos: photos.split(',').map(p => p.trim()).filter(p => p).length > 0 ? photos.split(',').map(p => p.trim()).filter(p => p) : null,
      would_return: wouldReturn === undefined ? null : wouldReturn,
    };

    try {
      if (existingEncounter?.id) {
        await updateEncounter(existingEncounter.id, encounterData);
      } else {
        // Assurer que les champs requis pour la création sont présents
        if (!encounterData.date) throw new Error("La date est requise pour créer une rencontre.");
        await createEncounter(encounterData as Omit<Encounter, 'id' | 'created_at' | 'updated_at'>);
      }
      onClose();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la rencontre:", err);
      setError("Impossible de sauvegarder la rencontre. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
      <h2 className="text-xl font-semibold text-gray-700">{existingEncounter ? 'Modifier la Rencontre' : 'Ajouter une Rencontre'}</h2>
      
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded">{error}</p>}

      <div>
        <label htmlFor="partnerId" className="block text-sm font-medium text-gray-700">Partenaire (Optionnel)</label>
        <select
          id="partnerId"
          name="partnerId"
          value={partnerId || ''}
          onChange={(e) => setPartnerId(e.target.value || undefined)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Aucun / Rencontre indépendante</option>
          {partners.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
        <input type="date" name="date" id="date" required value={date} onChange={(e) => setDate(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>

      <div>
        <label htmlFor="place" className="block text-sm font-medium text-gray-700">Lieu</label>
        <input type="text" name="place" id="place" value={place} onChange={(e) => setPlace(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>

      <div>
        <label htmlFor="mood" className="block text-sm font-medium text-gray-700">Humeur (1-5)</label>
        <input type="number" name="mood" id="mood" min="1" max="5" value={mood === undefined ? '' : mood} 
               onChange={(e) => setMood(e.target.value === '' ? undefined : parseInt(e.target.value))}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea name="notes" id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (séparés par des virgules)</label>
        <input type="text" name="tags" id="tags" value={tags} onChange={(e) => setTags(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>

      <div>
        <label htmlFor="photos" className="block text-sm font-medium text-gray-700">Photos (URLs séparées par des virgules)</label>
        <input type="text" name="photos" id="photos" value={photos} onChange={(e) => setPhotos(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>

      <div className="flex items-center">
        <input type="checkbox" name="wouldReturn" id="wouldReturn" 
               checked={wouldReturn === true} 
               onChange={(e) => setWouldReturn(e.target.checked ? true : (wouldReturn === false ? undefined : false))} // Cycle: undefined -> true -> false -> undefined
               className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
        <label htmlFor="wouldReturn" className="ml-2 block text-sm text-gray-900">
          Je reverrais cette personne ? (Oui/Non/Non spécifié)
        </label>
      </div>


      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onClose} disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          Annuler
        </button>
        <button type="submit" disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
          {isLoading ? 'Sauvegarde...' : (existingEncounter ? 'Mettre à jour' : 'Ajouter Rencontre')}
        </button>
      </div>
    </form>
  );
};

export default EncounterForm;