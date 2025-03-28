/*
  # Ajout de l'historique des commentaires clients

  1. Nouvelle Table
    - `customer_notes`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `content` (text)
      - `created_at` (timestamp)
  
  2. Sécurité
    - Enable RLS sur la table `customer_notes`
    - Ajout des politiques pour les utilisateurs authentifiés
*/

-- Créer la table pour l'historique des commentaires
CREATE TABLE customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Créer les politiques
CREATE POLICY "Enable read access for authenticated users"
ON customer_notes FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON customer_notes FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Créer un index pour les recherches rapides
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);

-- Migrer les notes existantes
INSERT INTO customer_notes (customer_id, content)
SELECT id, notes
FROM customers
WHERE notes IS NOT NULL AND notes != '';

-- Supprimer l'ancienne colonne notes
ALTER TABLE customers DROP COLUMN IF EXISTS notes;