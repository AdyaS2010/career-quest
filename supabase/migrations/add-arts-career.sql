-- Add Arts, Entertainment & Design Career and Challenges

-- Insert Arts, Entertainment & Design Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'arts-entertainment',
  'Arts, Entertainment & Design',
  'Creative Professional',
  'Explore creative careers spanning fine arts, music, and theater production. Design color palettes, read musical notation, and stage-manage a live show!',
  '{"primary": "#9333ea", "secondary": "#7e22ce", "accent": "#c084fc", "background": "#faf5ff"}',
  'Palette',
  25,
  8,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  color_scheme = EXCLUDED.color_scheme,
  icon = EXCLUDED.icon,
  estimated_time = EXCLUDED.estimated_time,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;

-- Get the career ID and insert challenges
DO $$
DECLARE
  arts_career_id uuid;
BEGIN
  SELECT id INTO arts_career_id FROM careers WHERE slug = 'arts-entertainment';

  -- Deduplicate challenges (keep oldest)
  DELETE FROM challenges a USING challenges b
  WHERE a.id > b.id 
  AND a.career_id = arts_career_id 
  AND a.title = b.title;

  -- Insert Color Theory Studio Challenge (Beginner)
  IF NOT EXISTS (SELECT 1 FROM challenges WHERE career_id = arts_career_id AND title = 'Color Theory Studio') THEN
    INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
    VALUES (
      arts_career_id,
      'Color Theory Studio',
      'You''re preparing pieces for a gallery show! Match color harmonies, identify warm and cool tones, and build palettes for different moods and emotions.',
      1,
      100,
      'mini_game',
      '{"subType": "color-theory-studio", "difficulty": "beginner"}'
    );
  END IF;

  -- Insert Rhythm & Sight Reading Challenge (Intermediate)
  IF NOT EXISTS (SELECT 1 FROM challenges WHERE career_id = arts_career_id AND title = 'Rhythm & Sight Reading') THEN
    INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
    VALUES (
      arts_career_id,
      'Rhythm & Sight Reading',
      'Step into the orchestra pit! Identify note values, time signatures, dynamic markings, and musical terms. Can you read music like a pro?',
      2,
      100,
      'mini_game',
      '{"subType": "rhythm-sight-reading", "difficulty": "intermediate"}'
    );
  END IF;

  -- Cleanup old Stage Manager Sim challenge if it exists
  DELETE FROM challenges 
  WHERE career_id = arts_career_id 
  AND (title = 'Stage Manager Sim' OR config->>'subType' = 'stage-manager-sim');

  -- Insert Broadway Lead Challenge (Advanced)
  IF NOT EXISTS (SELECT 1 FROM challenges WHERE career_id = arts_career_id AND title = 'Broadway Lead') THEN
    INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
    VALUES (
      arts_career_id,
      'Broadway Lead',
      'Take center stage! Memorize your lines, hit your marks in the spotlight, and deliver an award-winning performance on opening night.',
      3,
      100,
      'mini_game',
      '{"subType": "broadway-lead", "difficulty": "advanced"}'
    );
  END IF;
  END IF;
END $$;

/* 
  SECURITY HARDENING
  Enable RLS on tables where it is currently disabled.
*/
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_career_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;
