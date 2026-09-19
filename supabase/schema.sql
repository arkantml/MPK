-- Learnly Aspiration Platform - Supabase Schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Profiles Table (For Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'VIEWER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aspirations Table
CREATE TABLE IF NOT EXISTS public.aspirations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  name TEXT,
  email TEXT,
  identity_type TEXT,
  anonymous BOOLEAN DEFAULT false,
  aspiration_type TEXT DEFAULT 'ASPA' CHECK (aspiration_type IN ('ASPA', 'ASPI')),
  group_token TEXT,
  sentiment TEXT DEFAULT 'NEUTRAL' CHECK (sentiment IN ('POSITIVE', 'NEGATIVE', 'NEUTRAL')),
  is_toxic BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWING', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED')),
  attachment_url TEXT,
  attachment_name TEXT,
  assigned_admin UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Aspiration Notes Table
CREATE TABLE IF NOT EXISTS public.aspiration_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aspiration_id UUID REFERENCES public.aspirations(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Aspiration Activity Table
CREATE TABLE IF NOT EXISTS public.aspiration_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aspiration_id UUID REFERENCES public.aspirations(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Class access tokens and global public form setting
CREATE TABLE IF NOT EXISTS public.class_access (
  class_code TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.form_settings (
  setting_key TEXT PRIMARY KEY,
  is_open BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES public.profiles(id)
);

-- Migrate databases created with the original, smaller aspirations table.
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS identity_type TEXT;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS aspiration_type TEXT DEFAULT 'ASPA';
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS group_token TEXT;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'NEUTRAL';
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS is_toxic BOOLEAN DEFAULT false;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NEW';
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS assigned_admin UUID REFERENCES public.profiles(id);
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS class_code TEXT;
ALTER TABLE public.aspirations ADD COLUMN IF NOT EXISTS access_token_hash TEXT;

UPDATE public.aspirations SET aspiration_type = 'ASPA' WHERE aspiration_type IS NULL;
UPDATE public.aspirations SET sentiment = 'NEUTRAL' WHERE sentiment IS NULL;
UPDATE public.aspirations SET status = 'NEW' WHERE status IS NULL;

INSERT INTO public.form_settings (setting_key, is_open)
VALUES ('public_form', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Replace these seed tokens before production. Only SHA-256 hashes are stored.
INSERT INTO public.class_access (class_code, token_hash) VALUES
  ('10A', encode(digest('MPK-10A-9F4K7M', 'sha256'), 'hex')),
  ('10B', encode(digest('MPK-10B-2Q8X5P', 'sha256'), 'hex')),
  ('10C', encode(digest('MPK-10C-6N3R8V', 'sha256'), 'hex')),
  ('10D', encode(digest('MPK-10D-4T7L2W', 'sha256'), 'hex')),
  ('10E', encode(digest('MPK-10E-8H5C1Z', 'sha256'), 'hex')),
  ('11A', encode(digest('MPK-11A-3V9M6K', 'sha256'), 'hex')),
  ('11B', encode(digest('MPK-11B-7P2D4Q', 'sha256'), 'hex')),
  ('11C', encode(digest('MPK-11C-5X8J3N', 'sha256'), 'hex')),
  ('11D', encode(digest('MPK-11D-1R6W9T', 'sha256'), 'hex')),
  ('11E', encode(digest('MPK-11E-4K7B2M', 'sha256'), 'hex')),
  ('12A', encode(digest('MPK-12A-8Q3F6V', 'sha256'), 'hex')),
  ('12B', encode(digest('MPK-12B-2N9C5X', 'sha256'), 'hex')),
  ('12C', encode(digest('MPK-12C-6L1H8P', 'sha256'), 'hex')),
  ('12D', encode(digest('MPK-12D-9M4R7K', 'sha256'), 'hex'))
ON CONFLICT (class_code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_class_access(p_class_code TEXT, p_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_access
    WHERE class_code = upper(trim(p_class_code))
      AND token_hash = lower(trim(p_token_hash))
      AND enabled = true
  ) AND EXISTS (
    SELECT 1 FROM public.form_settings
    WHERE setting_key = 'public_form' AND is_open = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.verify_class_access(TEXT, TEXT) TO anon, authenticated;

-- Generate Reference Number Function & Trigger
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TRIGGER AS $$
DECLARE
  new_ref TEXT;
  ref_exists BOOLEAN;
  prefix TEXT;
BEGIN
  -- Determine prefix based on aspiration_type
  IF NEW.aspiration_type = 'ASPI' THEN
    prefix := 'SPI-';
  ELSE
    prefix := 'ASP-';
  END IF;

  LOOP
    -- Generate prefix followed by 6 random alphanumeric uppercase characters
    new_ref := prefix || upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM public.aspirations WHERE reference_number = new_ref) INTO ref_exists;
    
    -- If it doesn't exist, exit loop
    IF NOT ref_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  NEW.reference_number := new_ref;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reference_number ON public.aspirations;
CREATE TRIGGER set_reference_number
  BEFORE INSERT ON public.aspirations
  FOR EACH ROW
  EXECUTE FUNCTION generate_reference_number();

-- Update updated_at Timestamp Trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_aspirations_modtime ON public.aspirations;
CREATE TRIGGER update_aspirations_modtime
  BEFORE UPDATE ON public.aspirations
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Resolve Timestamp Trigger (Sets resolved_at when status becomes RESOLVED)
CREATE OR REPLACE FUNCTION set_resolved_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'RESOLVED' AND OLD.status != 'RESOLVED' THEN
        NEW.resolved_at = now();
    ELSIF NEW.status != 'RESOLVED' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION public.validate_public_aspiration_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.form_settings WHERE setting_key = 'public_form' AND is_open = true) THEN
    RAISE EXCEPTION 'Form aspirasi sedang ditutup';
  END IF;

  IF NEW.class_code IS NULL OR NEW.access_token_hash IS NULL OR NOT public.verify_class_access(NEW.class_code, NEW.access_token_hash) THEN
    RAISE EXCEPTION 'Token kelas tidak valid atau form sedang ditutup';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_public_aspiration_access ON public.aspirations;
CREATE TRIGGER validate_public_aspiration_access
  BEFORE INSERT ON public.aspirations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_public_aspiration_access();

DROP TRIGGER IF EXISTS set_aspirations_resolved_time ON public.aspirations;
CREATE TRIGGER set_aspirations_resolved_time
  BEFORE UPDATE ON public.aspirations
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_timestamp();

-- Database Indexes
CREATE INDEX IF NOT EXISTS idx_aspirations_reference_number ON public.aspirations(reference_number);
CREATE INDEX IF NOT EXISTS idx_aspirations_status ON public.aspirations(status);
CREATE INDEX IF NOT EXISTS idx_aspirations_category ON public.aspirations(category);
CREATE INDEX IF NOT EXISTS idx_aspirations_created_at ON public.aspirations(created_at);
CREATE INDEX IF NOT EXISTS idx_aspirations_updated_at ON public.aspirations(updated_at);
CREATE INDEX IF NOT EXISTS idx_aspiration_notes_aspiration_id ON public.aspiration_notes(aspiration_id);
CREATE INDEX IF NOT EXISTS idx_aspiration_activity_aspiration_id ON public.aspiration_activity(aspiration_id);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspiration_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspiration_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can check class access" ON public.class_access;

DROP POLICY IF EXISTS "Public can read form status" ON public.form_settings;
CREATE POLICY "Public can read form status"
  ON public.form_settings FOR SELECT
  USING (setting_key = 'public_form');

DROP POLICY IF EXISTS "Super admins can update form status" ON public.form_settings;
CREATE POLICY "Super admins can update form status"
  ON public.form_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- Policies for profiles
DROP POLICY IF EXISTS "Admins can view profiles" ON public.profiles;
CREATE POLICY "Admins can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policies for aspirations
DROP POLICY IF EXISTS "Public can insert aspirations" ON public.aspirations;
CREATE POLICY "Public can insert aspirations"
  ON public.aspirations FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view safe fields of aspirations" ON public.aspirations;
CREATE POLICY "Public can view safe fields of aspirations"
  ON public.aspirations FOR SELECT
  USING (true);
-- Note: In a real environment with restricted select, we'd limit what columns are returned or use a secure view.
-- Since Supabase RLS works on row level, to restrict columns we either need a view or clientside filtering.
-- For simplicity as requested, public SELECT is allowed but clients should only display safe fields.
-- A better approach for purely safe read is a stored function:
-- CREATE FUNCTION get_aspiration_status(ref_num TEXT) RETURNS TABLE(reference_number TEXT, category TEXT, status TEXT, created_at TIMESTAMPTZ) ...

DROP POLICY IF EXISTS "Authenticated admins have full access to aspirations" ON public.aspirations;
CREATE POLICY "Authenticated admins have full access to aspirations"
  ON public.aspirations FOR ALL
  USING (auth.role() = 'authenticated');

-- Policies for aspiration_notes
DROP POLICY IF EXISTS "Authenticated admins can manage notes" ON public.aspiration_notes;
CREATE POLICY "Authenticated admins can manage notes"
  ON public.aspiration_notes FOR ALL
  USING (auth.role() = 'authenticated');

-- Policies for aspiration_activity
DROP POLICY IF EXISTS "Authenticated admins can manage activity" ON public.aspiration_activity;
CREATE POLICY "Authenticated admins can manage activity"
  ON public.aspiration_activity FOR ALL
  USING (auth.role() = 'authenticated');

-- Storage Bucket setup (Assuming you will run this in SQL Editor)
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
-- values ('aspiration-attachments', 'aspiration-attachments', true, 10485760, '{"application/pdf","image/png","image/jpeg","image/jpg","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}');

-- Storage Policies
-- CREATE POLICY "Public can upload attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'aspiration-attachments');
-- CREATE POLICY "Public can view attachments" ON storage.objects FOR SELECT USING (bucket_id = 'aspiration-attachments');
