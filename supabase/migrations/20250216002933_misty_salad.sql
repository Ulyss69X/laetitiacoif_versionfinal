/*
  # Create activities tables and related schemas

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `date` (date)
      - `total_services` (numeric)
      - `total_products` (numeric)
      - `total_amount` (numeric)
      - `payment_method` (enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `activity_services`
      - `id` (uuid, primary key)
      - `activity_id` (uuid, foreign key to activities)
      - `service_id` (uuid, foreign key to services)
      - `price` (numeric)

    - `activity_products`
      - `id` (uuid, primary key)
      - `activity_id` (uuid, foreign key to activities)
      - `product_id` (uuid, foreign key to products)
      - `price` (numeric)
      - `quantity` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('especes', 'cheque', 'carte', 'autres');

-- Create activities table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_services numeric(10,2) NOT NULL DEFAULT 0,
  total_products numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_services table
CREATE TABLE activity_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id),
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create activity_products table
CREATE TABLE activity_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  price numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON activities FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON activities FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON activities FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON activities FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Policies for activity_services
CREATE POLICY "Enable read access for authenticated users"
ON activity_services FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON activity_services FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON activity_services FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON activity_services FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Policies for activity_products
CREATE POLICY "Enable read access for authenticated users"
ON activity_products FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON activity_products FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users"
ON activity_products FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users"
ON activity_products FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Create trigger for updating updated_at
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();