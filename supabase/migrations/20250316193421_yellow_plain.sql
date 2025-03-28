/*
  # Create customer notes table

  1. New Table
    - `customer_notes`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add indexes for performance optimization
*/

-- Create the customer notes table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_notes') THEN
    CREATE TABLE customer_notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      content text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

    -- Create security policies
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

    -- Create trigger for updating updated_at
    CREATE TRIGGER update_customer_notes_updated_at
      BEFORE UPDATE ON customer_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- Create indexes for better performance
    CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
    CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at DESC);
  END IF;
END $$;