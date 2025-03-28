import React, { useState, useEffect } from 'react';
import { X, History } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Customer, CustomerFormData, CustomerNote } from '../types/customer';
import { supabase } from '../lib/supabase';
import { CustomerNotesHistory } from './CustomerNotesHistory';
import { Logo } from './Logo';

type CustomerFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  initialData?: Customer;
  title: string;
};

export function CustomerForm({ isOpen, onClose, onSubmit, initialData, title }: CustomerFormProps) {
  const [lastNote, setLastNote] = useState<CustomerNote | null>(null);
  const [allNotes, setAllNotes] = useState<CustomerNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData?.id) {
      fetchNotes(initialData.id);
    } else {
      setLastNote(null);
      setAllNotes([]);
      setNewNote('');
    }
  }, [initialData]);

  const fetchNotes = async (customerId: string) => {
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      if (notesData) {
        setAllNotes(notesData);
        if (notesData.length > 0) {
          setLastNote(notesData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      const customerData: CustomerFormData = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        birth_date: formData.get('birth_date') as string || null,
        gender: formData.get('gender') as 'homme' | 'femme' | 'enfant',
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
      };

      await onSubmit(customerData);

      // Si un nouveau commentaire est ajouté, l'enregistrer
      if (newNote && initialData?.id) {
        const { error: noteError } = await supabase
          .from('customer_notes')
          .insert([{
            customer_id: initialData.id,
            content: newNote.trim()
          }]);

        if (noteError) throw noteError;

        await fetchNotes(initialData.id);
        setNewNote('');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Logo />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Nom de famille
            </label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              required
              defaultValue={initialData?.last_name}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              Prénom
            </label>
            <input
              type="text"
              name="first_name"
              id="first_name"
              required
              defaultValue={initialData?.first_name}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
              Date de naissance
            </label>
            <input
              type="date"
              name="birth_date"
              id="birth_date"
              defaultValue={initialData?.birth_date}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Catégorie
            </label>
            <select
              name="gender"
              id="gender"
              required
              defaultValue={initialData?.gender || 'femme'}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            >
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
              <option value="enfant">Enfant</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adresse e-mail
            </label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={initialData?.email || ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
              placeholder="exemple@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              defaultValue={initialData?.phone || ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Commentaires
              </label>
              {initialData && allNotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="inline-flex items-center px-2 py-1 text-sm font-medium text-pink-600 hover:text-pink-700"
                >
                  <History className="h-4 w-4 mr-1" />
                  Voir l'historique
                </button>
              )}
            </div>
            
            {lastNote && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500 mb-1">
                  Dernier commentaire ({format(new Date(lastNote.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })})
                </div>
                <p className="text-sm text-gray-700">{lastNote.content}</p>
              </div>
            )}

            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
              placeholder="Ajouter un nouveau commentaire..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : (initialData ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </div>

      <CustomerNotesHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        notes={allNotes}
        customerName={initialData ? `${initialData.first_name} ${initialData.last_name}` : ''}
      />
    </div>
  );
}