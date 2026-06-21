-- Add Media & Communication Career and Challenges

-- Insert Media & Communication Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'media-communication',
  'Media & Communication',
  'Journalist',
  'Uncover the truth and tell compelling stories as an investigative journalist. Master fact-checking, interviewing techniques, and article writing to inform the public.',
  '{"primary": "#9333ea", "secondary": "#7e22ce", "accent": "#c084fc", "background": "#faf5ff"}',
  'Newspaper',
  20,
  3,
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
  media_career_id uuid;
BEGIN
  SELECT id INTO media_career_id FROM careers WHERE slug = 'media-communication';

  -- Insert Fact-Check Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    media_career_id,
    'Fact-Check Detective',
    'Sort through social media claims and separate truth from fiction. Verify sources and mark claims as true, false, or needing verification.',
    1,
    100,
    'mini_game',
    '{"subType": "fact-check", "difficulty": "beginner"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Interview Master Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    media_career_id,
    'Interview Master',
    'Conduct interviews with key sources to gather crucial facts for your story. Build rapport and ask the right questions to unlock deeper insights.',
    2,
    100,
    'mini_game',
    '{"subType": "interview-master", "difficulty": "intermediate"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Story Crafter Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    media_career_id,
    'Story Crafter',
    'Craft a compelling news article by selecting the perfect headline and arranging facts, quotes, and context into lede, body, and conclusion sections.',
    3,
    100,
    'mini_game',
    '{"subType": "story-crafter", "difficulty": "advanced"}'
  )
  ON CONFLICT DO NOTHING;
END $$;
