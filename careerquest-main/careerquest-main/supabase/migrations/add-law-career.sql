-- Add Law & Government Career and Challenges

-- Insert Law & Government Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'law-government',
  'Law & Government',
  'Lawyer',
  'Build compelling legal arguments, sort evidence, and cross-examine witnesses. Master the art of justice in the courtroom.',
  '{"primary": "#3b82f6", "secondary": "#1d4ed8", "accent": "#60a5fa", "background": "#eff6ff"}',
  'Scale',
  20,
  1,
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
  law_career_id uuid;
BEGIN
  SELECT id INTO law_career_id FROM careers WHERE slug = 'law-government';

  -- Insert Evidence Detective Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    law_career_id,
    'Evidence Detective',
    'Sort evidence into admissible and inadmissible piles. Learn what evidence is valid in a court of law.',
    1,
    100,
    'mini_game',
    '{"subType": "evidence-detective", "difficulty": "beginner"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Courtroom Arguments Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    law_career_id,
    'Courtroom Arguments',
    'Build compelling legal arguments by selecting precedents, arranging points logically, and presenting persuasively.',
    2,
    100,
    'mini_game',
    '{"subType": "courtroom-arguments", "difficulty": "intermediate"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Cross-Examination Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    law_career_id,
    'Cross-Examination Simulator',
    'Question witnesses strategically and find contradictions in their testimony to uncover the truth.',
    3,
    100,
    'mini_game',
    '{"subType": "cross-examination", "difficulty": "advanced"}'
  )
  ON CONFLICT DO NOTHING;
END $$;
