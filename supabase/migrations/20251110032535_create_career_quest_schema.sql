/*
  # Career Quest - Initial Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text, optional)
      - `total_score` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `careers`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `name` (text) - Display name (e.g., "Culinary Arts")
      - `title` (text) - Job title (e.g., "Chef")
      - `description` (text)
      - `color_scheme` (jsonb) - Store colors for theming
      - `icon` (text) - Lucide icon name
      - `estimated_time` (integer) - Minutes to complete
      - `order_index` (integer) - Display order
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `challenges`
      - `id` (uuid, primary key)
      - `career_id` (uuid, foreign key to careers)
      - `title` (text)
      - `description` (text)
      - `order_index` (integer)
      - `max_score` (integer)
      - `challenge_type` (text) - 'scenario', 'skill_task', 'mini_game'
      - `config` (jsonb) - Challenge-specific configuration
      - `created_at` (timestamp)
    
    - `user_career_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `career_id` (uuid, foreign key to careers)
      - `status` (text) - 'not_started', 'in_progress', 'completed'
      - `score` (integer, default 0)
      - `completed_at` (timestamp, nullable)
      - `started_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_challenge_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `challenge_id` (uuid, foreign key to challenges)
      - `status` (text) - 'locked', 'unlocked', 'in_progress', 'completed'
      - `score` (integer, default 0)
      - `attempts` (integer, default 0)
      - `best_score` (integer, default 0)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `achievements`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `requirement` (jsonb) - Achievement unlock criteria
      - `created_at` (timestamp)
    
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `achievement_id` (uuid, foreign key to achievements)
      - `unlocked_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for career and challenge definitions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  total_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create careers table
CREATE TABLE IF NOT EXISTS careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  color_scheme jsonb DEFAULT '{}',
  icon text NOT NULL,
  estimated_time integer DEFAULT 15,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active careers"
  ON careers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid REFERENCES careers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  order_index integer DEFAULT 0,
  max_score integer DEFAULT 100,
  challenge_type text NOT NULL,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (true);

-- Create user_career_progress table
CREATE TABLE IF NOT EXISTS user_career_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  career_id uuid REFERENCES careers(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started',
  score integer DEFAULT 0,
  completed_at timestamptz,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, career_id)
);

ALTER TABLE user_career_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own career progress"
  ON user_career_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career progress"
  ON user_career_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career progress"
  ON user_career_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_challenge_progress table
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  status text DEFAULT 'locked',
  score integer DEFAULT 0,
  attempts integer DEFAULT 0,
  best_score integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge progress"
  ON user_challenge_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress"
  ON user_challenge_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress"
  ON user_challenge_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);