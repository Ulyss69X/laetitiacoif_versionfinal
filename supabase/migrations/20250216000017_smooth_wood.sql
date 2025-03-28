/*
  # Enable email authentication

  1. Changes
    - Enable email authentication for the project
    - Configure email provider settings
    - Disable email confirmation requirement
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_provider_enabled boolean DEFAULT true,
  email_confirmation_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert or update auth settings
INSERT INTO auth.config (email_provider_enabled, email_confirmation_required)
VALUES (true, false)
ON CONFLICT (id) DO UPDATE
SET 
  email_provider_enabled = true,
  email_confirmation_required = false,
  updated_at = now();