-- ═══════════════════════════════════════════════════════════════════════════
-- FLOWTYM PMS — RESET COMPLET (étape 1/2)
-- Exécuter CE fichier EN PREMIER, puis init_database.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Supprime toutes les tables du schéma public en cascade
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', r.tablename);
  END LOOP;
END
$$;

-- Supprime toutes les vues du schéma public
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT viewname
    FROM pg_catalog.pg_views
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', r.viewname);
  END LOOP;
END
$$;

-- ✅ Base nettoyée. Exécutez maintenant init_database.sql
