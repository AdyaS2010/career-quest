/*
  # Story System & Character Progression

  1. Updates
    - Add `level` and `experience` to profiles
    - Add `character_name` and `character_avatar` to profiles
    - Add function to calculate total points
    - Add story progression tracking
  
  2. New Tables
    - `story_chapters` - Story narrative content
    - `user_story_progress` - User's story progression
  
  3. Functions
    - Function to auto-update total_score from challenges
*/

-- Add story and character fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN level integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'experience'
  ) THEN
    ALTER TABLE profiles ADD COLUMN experience integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'character_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN character_name text DEFAULT 'Explorer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'character_avatar'
  ) THEN
    ALTER TABLE profiles ADD COLUMN character_avatar text DEFAULT 'adventurer';
  END IF;
END $$;

-- Create story chapters table
CREATE TABLE IF NOT EXISTS story_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  unlock_requirement jsonb DEFAULT '{}',
  reward_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE story_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view story chapters"
  ON story_chapters FOR SELECT
  TO authenticated
  USING (true);

-- Create user story progress table
CREATE TABLE IF NOT EXISTS user_story_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES story_chapters(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story progress"
  ON user_story_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own story progress"
  ON user_story_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own story progress"
  ON user_story_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate total score from challenges
CREATE OR REPLACE FUNCTION calculate_user_total_score(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(SUM(best_score), 0)
  INTO total
  FROM user_challenge_progress
  WHERE user_id = user_uuid;
  
  RETURN total;
END;
$$;

-- Function to update profile total score
CREATE OR REPLACE FUNCTION update_profile_total_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    total_score = calculate_user_total_score(NEW.user_id),
    experience = calculate_user_total_score(NEW.user_id),
    level = LEAST(100, 1 + FLOOR(calculate_user_total_score(NEW.user_id) / 100)),
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update total score
DROP TRIGGER IF EXISTS update_total_score_trigger ON user_challenge_progress;
CREATE TRIGGER update_total_score_trigger
  AFTER INSERT OR UPDATE OF best_score
  ON user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_total_score();

-- Insert story chapters
INSERT INTO story_chapters (chapter_number, title, content, unlock_requirement, reward_points) VALUES
(1, 'The Journey Begins', 'Welcome, brave explorer! You''ve arrived at the mystical Career Islands, a place where dreams take shape and futures are forged. I''m Quinn, your guide on this incredible journey. Together, we''ll explore five legendary islands, each holding the secrets of a different career path.', '{}', 0),
(2, 'First Island Conquered', 'Incredible work! You''ve completed your first career island. I can see you''re a natural explorer. Four more islands await, each with unique challenges and treasures to discover.', '{"careers_completed": 1}', 50),
(3, 'The Path Unfolds', 'You''re making remarkable progress! Two islands explored, and you''re discovering skills you never knew you had. The map is revealing more of its secrets.', '{"careers_completed": 2}', 75),
(4, 'Master Explorer', 'Astounding! Three career paths mastered. You''re becoming a true jack-of-all-trades. The islands recognize your dedication.', '{"careers_completed": 3}', 100),
(5, 'Legend in the Making', 'Four islands conquered! You''re approaching legendary status. Only one island remains. Are you ready for the final challenge?', '{"careers_completed": 4}', 150),
(6, 'Career Quest Champion', 'INCREDIBLE! You''ve explored all five Career Islands and mastered every challenge. You are now a Career Quest Champion! The world is yours to shape, and your future shines brighter than ever.', '{"careers_completed": 5}', 200)
ON CONFLICT DO NOTHING;
