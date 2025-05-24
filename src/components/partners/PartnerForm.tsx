'use client';

import React, { useState, useEffect } from 'react';
import { Partner, createPartner, updatePartner } from '@/lib/partners';

interface PartnerFormProps {
  userId: string;
  existingPartner?: Partner | null;
  onClose: () => void;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ userId, existingPartner, onClose }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingPartner) {
      setName(existingPartner.name || '');
      setGender(existingPartner.gender || '');
      setNotes(existingPartner.notes || '');
      setTags(existingPartner.tags?.join(', ') || '');
      setAvatarUrl(existingPartner.avatar_url || '');
    } else {
      setName('');
      setGender('');
      setNotes('');
      setTags('');
      setAvatarUrl('');
    }
  }, [existingPartner]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!userId) {
        setError("L'ID utilisateur est manquant. Impossible de sauvegarder.");
        setIsLoading(false);
        return;
    }
    if (!name.trim()) {
        setError("Le nom du partenaire est requis.");
        setIsLoading(false);
        return;
    }

    const partnerData: Partial<Partner> = {
      name: name.trim(),
      gender: gender.trim() || null,
      notes: notes.trim() || null,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag) || null,
      avatar_url: avatarUrl.trim() || null,
    };

    try {
      if (existingPartner?.id) {
        await updatePartner(existingPartner.id, { user_id: userId, ...partnerData });
      } else {
        await createPartner({ user_id: userId, ...partnerData, name: partnerData.name! });
      }
      onClose();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du partenaire:", err);
      setError("Impossible de sauvegarder le partenaire. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">{existingPartner ? "Modifier le Partenaire" : "Ajouter un Partenaire"}</h2>
      
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded">{error}</p>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nom / Pseudo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Genre
        </label>
        <input
          type="text"
          name="gender"
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          name="notes"
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (séparés par des virgules)
        </label>
        <input
          type="text"
          name="tags"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">
          URL de l&apos;avatar
        </label>
        <input
          type="url"
          name="avatarUrl"
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Sauvegarde...' : (existingPartner ? "Mettre à jour" : "Ajouter Partenaire")}
        </button>
      </div>
    </form>
  );
};

export default PartnerForm;
