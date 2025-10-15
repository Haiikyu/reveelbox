-- Create upgrade_attempts table for tracking upgrade history
CREATE TABLE IF NOT EXISTS public.upgrade_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    item_value DECIMAL(10,2) NOT NULL,
    target_multiplier INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    won_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_multiplier CHECK (target_multiplier > 0),
    CONSTRAINT valid_item_value CHECK (item_value > 0),
    CONSTRAINT valid_won_value CHECK (won_value >= 0)
);

-- Add indexes for better query performance
CREATE INDEX idx_upgrade_attempts_user_id ON public.upgrade_attempts(user_id);
CREATE INDEX idx_upgrade_attempts_created_at ON public.upgrade_attempts(created_at DESC);
CREATE INDEX idx_upgrade_attempts_success ON public.upgrade_attempts(success);

-- Enable Row Level Security
ALTER TABLE public.upgrade_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own upgrade attempts
CREATE POLICY "Users can view own upgrade attempts"
    ON public.upgrade_attempts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own upgrade attempts
CREATE POLICY "Users can insert own upgrade attempts"
    ON public.upgrade_attempts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.upgrade_attempts IS 'Tracks all upgrade attempts made by users';
COMMENT ON COLUMN public.upgrade_attempts.item_value IS 'Original value of the item being upgraded';
COMMENT ON COLUMN public.upgrade_attempts.target_multiplier IS 'Multiplier attempted (e.g., 2, 5, 10, 100)';
COMMENT ON COLUMN public.upgrade_attempts.success IS 'Whether the upgrade was successful';
COMMENT ON COLUMN public.upgrade_attempts.won_value IS 'Value won if successful, 0 if failed';
