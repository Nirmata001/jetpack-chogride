-- ========================================================
-- JETPACK CHOGRIDE - PLAYER DATABASE SCHEMA FOR SUPABASE
-- Run this in the Supabase Dashboard -> SQL Editor -> New Query
-- ========================================================

-- 1. Create the players table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    discord_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    coins_accumulated BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for fast queries and leaderboard
CREATE INDEX IF NOT EXISTS idx_players_username ON public.players(username);
CREATE INDEX IF NOT EXISTS idx_players_coins ON public.players(coins_accumulated DESC);

-- 3. Trigger function to enforce immutability of username and discord_id
-- (Only wallet_address, coins_accumulated, and updated_at can be updated by users)
CREATE OR REPLACE FUNCTION public.enforce_player_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent altering username
    IF NEW.username <> OLD.username THEN
        RAISE EXCEPTION 'Username is permanent and cannot be modified once set.';
    END IF;

    -- Prevent altering discord_id
    IF NEW.discord_id <> OLD.discord_id THEN
        RAISE EXCEPTION 'Discord ID is permanent and cannot be modified once set.';
    END IF;

    -- Automatically bump updated_at
    NEW.updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to players table
DROP TRIGGER IF EXISTS trg_enforce_player_immutable_fields ON public.players;
CREATE TRIGGER trg_enforce_player_immutable_fields
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.enforce_player_immutable_fields();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Allow public read, registration, and wallet updates
-- Allow anyone to read players (e.g. for leaderboard and profile lookup)
DROP POLICY IF EXISTS "Public can view players" ON public.players;
CREATE POLICY "Public can view players"
ON public.players
FOR SELECT
TO public
USING (true);

-- Allow anyone to register a new player profile
DROP POLICY IF EXISTS "Public can register player" ON public.players;
CREATE POLICY "Public can register player"
ON public.players
FOR INSERT
TO public
WITH CHECK (true);

-- Allow updating player records (the database trigger strictly prevents modifying username or discord_id)
DROP POLICY IF EXISTS "Players can update wallet and coins" ON public.players;
CREATE POLICY "Players can update wallet and coins"
ON public.players
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
