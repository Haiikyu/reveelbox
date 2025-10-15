-- Migration: Add missing profile customization columns
-- Created: 2025-01-04

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS current_level_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_level_xp INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level);
CREATE INDEX IF NOT EXISTS idx_profiles_total_exp ON public.profiles(total_exp);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON public.profiles(current_streak);

-- Update existing profiles to set default values for new columns
UPDATE public.profiles
SET
  current_level_xp = 0,
  next_level_xp = 100,
  current_streak = COALESCE(consecutive_days, 0),
  longest_streak = COALESCE(consecutive_days, 0),
  last_activity = COALESCE(updated_at, NOW())
WHERE current_level_xp IS NULL;

-- Create function to automatically update last_activity
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_activity on profile updates
DROP TRIGGER IF EXISTS trigger_update_last_activity ON public.profiles;
CREATE TRIGGER trigger_update_last_activity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.website IS 'User website or social media link';
COMMENT ON COLUMN public.profiles.current_level_xp IS 'XP progress in current level';
COMMENT ON COLUMN public.profiles.next_level_xp IS 'XP required for next level';
COMMENT ON COLUMN public.profiles.current_streak IS 'Current consecutive days streak';
COMMENT ON COLUMN public.profiles.longest_streak IS 'Longest consecutive days streak ever achieved';
COMMENT ON COLUMN public.profiles.last_activity IS 'Last time user was active';
