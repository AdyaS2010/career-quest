-- Run this SQL in your Supabase SQL Editor to add the IT career

-- Insert Information Technology Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'information-technology',
  'Information Technology',
  'Software Engineer',
  'Design, develop, and debug software systems. Build algorithms, hunt bugs, and architect scalable solutions in this tech-focused career path.',
  '{"primary": "#10b981", "secondary": "#059669", "accent": "#34d399", "background": "#ecfdf5"}',
  'Code2',
  20,
  2,
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

-- Insert the three challenges
-- First, get the career ID
WITH it_career AS (
  SELECT id FROM careers WHERE slug = 'information-technology'
)
INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
SELECT 
  it_career.id,
  'Bug Hunt Detective',
  'Debug code by identifying syntax errors and logic bugs. Click on problematic lines to squash those bugs!',
  1,
  100,
  'mini_game',
  '{"subType": "bug-hunt", "difficulty": "beginner"}'
FROM it_career
WHERE NOT EXISTS (
  SELECT 1 FROM challenges 
  WHERE career_id = it_career.id 
  AND title = 'Bug Hunt Detective'
);

WITH it_career AS (
  SELECT id FROM careers WHERE slug = 'information-technology'
)
INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
SELECT 
  it_career.id,
  'Algorithm Builder',
  'Solve programming challenges using visual code blocks. Drag and snap blocks together to create working algorithms.',
  2,
  100,
  'mini_game',
  '{"subType": "algorithm-builder", "difficulty": "intermediate"}'
FROM it_career
WHERE NOT EXISTS (
  SELECT 1 FROM challenges 
  WHERE career_id = it_career.id 
  AND title = 'Algorithm Builder'
);

WITH it_career AS (
  SELECT id FROM careers WHERE slug = 'information-technology'
)
INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
SELECT 
  it_career.id,
  'System Design Architect',
  'Design a scalable system by placing and connecting components. Balance speed, cost, and reliability under load.',
  3,
  100,
  'mini_game',
  '{"subType": "system-design", "difficulty": "advanced"}'
FROM it_career
WHERE NOT EXISTS (
  SELECT 1 FROM challenges 
  WHERE career_id = it_career.id 
  AND title = 'System Design Architect'
);
