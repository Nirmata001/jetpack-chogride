-- ==============================================================================
-- JETPACK CHOGRIDE - SUPABASE DATABASE SCHEMA
-- Copy and paste this entire script into your Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create the players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  discord_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  coins_accumulated BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Case-insensitive unique constraint on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_unique_username ON public.players (LOWER(username));

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_players_discord ON public.players (discord_id);
CREATE INDEX IF NOT EXISTS idx_players_wallet ON public.players (wallet_address);
CREATE INDEX IF NOT EXISTS idx_players_coins ON public.players (coins_accumulated DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Allow reads, registration (inserts), and updates
DROP POLICY IF EXISTS "Public can view players" ON public.players;
CREATE POLICY "Public can view players"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can register player" ON public.players;
CREATE POLICY "Public can register player"
  ON public.players
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update player wallet and coins" ON public.players;
CREATE POLICY "Public can update player wallet and coins"
  ON public.players
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Enforce that username and discord_id CANNOT be changed once saved;
--    Only wallet_address (and coins_accumulated) can be updated.
CREATE OR REPLACE FUNCTION public.enforce_immutable_player_identity()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent altering username once registered
  IF LOWER(OLD.username) <> LOWER(NEW.username) THEN
    RAISE EXCEPTION 'Username is permanent and cannot be changed once registered.';
  END IF;

  -- Prevent altering Discord ID once registered
  IF OLD.discord_id <> NEW.discord_id THEN
    RAISE EXCEPTION 'Discord ID is permanent and cannot be changed once registered.';
  END IF;

  -- Automatically update timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_player_identity ON public.players;
CREATE TRIGGER trg_lock_player_identity
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_immutable_player_identity();
