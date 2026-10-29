ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz NOT NULL DEFAULT now();
UPDATE public.materials SET last_reviewed_at = status_updated_at;