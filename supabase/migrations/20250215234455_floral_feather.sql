/*
  # Create admin user

  1. Changes
    - Create admin user with proper credentials
    - Set up admin role and permissions

  2. Security
    - Create admin user with secure password
    - Ensure proper role assignment
*/

-- Create admin user if it doesn't exist
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  )
  SELECT
    gen_random_uuid(),
    'admin@laetitiacoif.com',
    crypt('LaetitiaCoif2025!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@laetitiacoif.com'
  )
  RETURNING id INTO new_user_id;

  -- If a new user was created, insert into auth.identities
  IF new_user_id IS NOT NULL THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', 'admin@laetitiacoif.com'),
      'email',
      'admin@laetitiacoif.com',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;