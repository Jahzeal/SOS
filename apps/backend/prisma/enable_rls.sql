-- ==============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) FIX
-- Resolves: rls_disabled_in_public & sensitive_columns_exposed
-- 
-- Description:
-- Enables Row Level Security (RLS) on all public tables.
-- Because your NestJS backend connects as the database owner/superuser ('postgres'),
-- Prisma queries will BYPASS RLS and continue working normally.
-- External requests hitting Supabase's auto-generated REST API (PostgREST)
-- will be completely blocked from accessing or modifying data.
-- ==============================================================================

-- 1. Enable RLS on all existing tables
ALTER TABLE IF EXISTS public."Business" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SubscriptionPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SubscriptionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."PhoneRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RepairTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AdminNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."PlatformSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."VerificationLog" ENABLE ROW LEVEL SECURITY;

-- 2. Automatically enable RLS on every table in the public schema (excluding prisma metadata)
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT LIKE '_prisma%'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    END LOOP;
END $$;
