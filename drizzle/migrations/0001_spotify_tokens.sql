CREATE TABLE public.spotify_tokens (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  owner_id uuid NOT NULL,
  refresh_token text NOT NULL,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.spotify_tokens TO service_role;
ALTER TABLE public.spotify_tokens ENABLE ROW LEVEL SECURITY;