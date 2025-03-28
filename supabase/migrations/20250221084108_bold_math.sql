/*
  # Correction de la table des commentaires clients

  1. Changements
    - Suppression et recréation de la table customer_notes
    - Ajout des politiques de sécurité
    - Ajout des index pour les performances
*/

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS customer_notes;

-- Créer la table pour les commentaires clients
CREATE TABLE customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Créer les politiques de sécurité
CREATE POLICY "Enable read access for authenticated users"
ON customer_notes FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON customer_notes FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON customer_notes FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON customer_notes FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Créer un trigger pour mettre à jour updated_at
CREATE TRIGGER update_customer_notes_updated_at
  BEFORE UPDATE ON customer_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer un index pour améliorer les performances
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at DESC);