import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CustomerNote } from '../types/customer';
import { Logo } from './Logo';

type CustomerNotesHistoryProps = {
  isOpen: boolean;
  onClose: () => void;
  notes: CustomerNote[];
  customerName: string;
};

export function CustomerNotesHistory({ isOpen, onClose, notes, customerName }: CustomerNotesHistoryProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Logo />
            <h2 className="text-xl font-semibold text-gray-900">
              Historique des commentaires - {customerName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucun commentaire pour ce client
            </p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">
                  {format(new Date(note.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}