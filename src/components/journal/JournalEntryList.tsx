'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { JournalEntry, getJournalEntriesByUserId, deleteJournalEntry } from '@/lib/journalEntries';
import JournalEntryForm from './JournalEntryForm'; // À créer

interface JournalEntryListProps {
  userId: string;
  onEditEntry: (entry: JournalEntry) => void;
  onAddEntry: () => void;
}

const JournalEntryList: React.FC<JournalEntryListProps> = ({ userId, onEditEntry, onAddEntry }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userId) {
        setError("ID utilisateur non fourni.");
        setIsLoading(false);
        return;
      }
      const fetchedEntries = await getJournalEntriesByUserId(userId);
      setEntries(fetchedEntries || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des entrées de journal:", err);
      setError("Impossible de charger les entrées de journal.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (entryId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée de journal ?")) {
      try {
        await deleteJournalEntry(entryId);
        // setEntries(entries.filter(e => e.id !== entryId)); // Sera fait par fetchEntries
        fetchEntries(); // Recharger la liste après suppression
      } catch (err) {
        console.error("Erreur lors de la suppression de l'entrée de journal:", err);
        setError("Impossible de supprimer l'entrée de journal.");
      }
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
    onEditEntry(entry);
  };

  const handleFormClose = () => {
    setEditingEntry(null);
    setShowForm(false);
    fetchEntries(); // Recharger la liste
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    setShowForm(true);
    onAddEntry();
  };

  if (isLoading) return <p data-testid="loading-indicator" className="text-center py-4">Chargement du journal...</p>;
  if (error) return <p data-testid="error-message" className="text-center text-red-500 py-4">Erreur: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Mon Journal Privé</h1>

      <div className="mb-6 text-right">
        <button
          onClick={handleAddNew}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Nouvelle Entrée
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
            <JournalEntryForm
              userId={userId}
              existingEntry={editingEntry}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm ? (
        <p data-testid="no-entries-message" className="text-center text-gray-500">Aucune entrée dans le journal pour le moment.</p>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} data-testid={`entry-card-${entry.id}`} className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">
                  {new Date(entry.created_at || Date.now()).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {entry.entry_type && <span className="ml-2 italic">({entry.entry_type})</span>}
                </span>
                {entry.mood && (
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    entry.mood >= 4 ? 'bg-green-100 text-green-700' :
                    entry.mood === 3 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Humeur: {entry.mood}/5
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap mb-3">
                {entry.content}
              </div>
              {entry.media && entry.media.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Médias attachés:</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.media.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">
                        Média {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => handleEdit(entry)}
                  data-testid={`edit-entry-${entry.id}`}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                >
                  Modifier
                </button>
                <button
                  onClick={() => entry.id && handleDelete(entry.id)}
                  data-testid={`delete-entry-${entry.id}`}
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

export default JournalEntryList;