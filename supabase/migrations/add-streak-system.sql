-- Add streak tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMPTZ;

-- We also make sure the policies are set to allow users to update their own profiles
-- (Though existing RLS policies likely already allow users to update their own profile data).
