/*
  # Ajout des commentaires clients

  1. Modifications
    - Ajout de la colonne `notes` à la table `customers`
      - Type: text
      - Nullable: true
      - Description: Stocke les commentaires associés à chaque client
*/

ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes text;