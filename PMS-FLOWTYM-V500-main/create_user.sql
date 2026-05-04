-- ═══════════════════════════════════════════════════════════════════════════
-- FLOWTYM PMS — Création utilisateur de test
-- Exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Crée un utilisateur admin confirmé directement en base
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  'admin@flowtym.com',
  crypt('Flowtym2026!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Flowtym","hotel_id":"00000000-0000-0000-0000-000000000001"}',
  false,
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Vérification
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'admin@flowtym.com';
