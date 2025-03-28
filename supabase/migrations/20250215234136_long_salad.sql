/*
  # Fix RLS policies for customers table

  1. Changes
    - Drop existing policies
    - Create new policies with proper authentication checks
    - Enable RLS on customers table

  2. Security
    - Ensure authenticated users can perform all CRUD operations
    - Policies use auth.uid() to verify authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON customers FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON customers FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON customers FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON customers FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');