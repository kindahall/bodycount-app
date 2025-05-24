'use client';

import React, { useState, useEffect } from 'react';
import { JournalEntry, createJournalEntry, updateJournalEntry } from '@/lib/journalEntries';

interface JournalEntryFormProps {
  userId: string;
  existingEntry?: JournalEntry | null;
  onClose: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ userId, existingEntry, onClose }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [entryType, setEntryType] = useState<string | undefined>(undefined);
  const [media, setMedia] = useState(''); // Gérer comme une chaîne d'URLs séparées par des virgules

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content || '');
      setMood(existingEntry.mood === null ? undefined : existingEntry.mood);
      setEntryType(existingEntry.entry_type || undefined);
      setMedia(existingEntry.media?.join(', ') || '');
    } else {
      setContent('');
      setMood(undefined);
      setEntryType('diary'); // Type par défaut
      setMedia('');
    }
  }, [existingEntry]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!userId) {
        setError("L'ID utilisateur est manquant.");
        setIsLoading(false);
        return;
    }
    if (!content.trim()) {
        setError("Le contenu de l'entrée ne peut pas être vide.");
        setIsLoading(false);
        return;
    }

    const entryData: Partial<JournalEntry> = {
      user_id: userId,
      content: content.trim(),
      mood: mood === undefined ? null : Number(mood),
      entry_type: entryType || null,
      media: media.split(',').map(m => m.trim()).filter(m => m).length > 0 ? media.split(',').map(m => m.trim()).filter(m => m) : null,
    };

    try {
      if (existingEntry?.id) {
        await updateJournalEntry(existingEntry.id, entryData);
      } else {
        if (!entryData.content) throw new Error("Le contenu est requis pour créer une entrée de journal.");
        await createJournalEntry(entryData as Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>);
      }
      onClose();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de l'entrée de journal:", err);
      setError("Impossible de sauvegarder l'entrée. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[85vh] overflow-y-auto p-1">
      <h2 className="text-xl font-semibold text-gray-700">{existingEntry ? "Modifier l'Entrée" : "Nouvelle Entrée de Journal"}</h2>
      
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded">{error}</p>}

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Contenu <span className="text-red-500">*</span>
        </label>
        <textarea
          name="content"
          id="content"
          required
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          placeholder="Exprimez-vous librement..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mood" className="block text-sm font-medium text-gray-700">Humeur (1-5)</label>
          <input type="number" name="mood" id="mood" min="1" max="5" value={mood === undefined ? '' : mood} 
                 onChange={(e) => setMood(e.target.value === '' ? undefined : parseInt(e.target.value))}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
        </div>
        <div>
          <label htmlFor="entryType" className="block text-sm font-medium text-gray-700">Type d&apos;entrée</label>
          <select 
            name="entryType" 
            id="entryType" 
            value={entryType || 'diary'} 
            onChange={(e) => setEntryType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          >
            <option value="diary">Journal intime</option>
            <option value="reflection">Réflexion</option>
            <option value="prompt">Réponse à un prompt</option>
            <option value="other">Autre</option>
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="media" className="block text-sm font-medium text-gray-700">
          Médias (URLs séparées par des virgules)
        </label>
        <input
          type="text"
          name="media"
          id="media"
          value={media}
          onChange={(e) => setMedia(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          placeholder="http://exemple.com/image.jpg, http://exemple.com/autre.png"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button type="button" onClick={onClose} disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
          Annuler
        </button>
        <button type="submit" disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
          {isLoading ? 'Sauvegarde...' : (existingEntry ? "Mettre à jour" : "Enregistrer")}
        </button>
      </div>
    </form>
  );
};

export default JournalEntryForm;
