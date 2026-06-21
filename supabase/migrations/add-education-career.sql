-- Add Education Career and Challenges

-- Insert Education Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'education',
  'Education',
  'Educator',
  'Step into the world of education! Match students with the right activities, design effective lesson plans, and manage real school crises in this immersive teaching simulation.',
  '{"primary": "#4f46e5", "secondary": "#4338ca", "accent": "#818cf8", "background": "#eef2ff"}',
  'GraduationCap',
  25,
  6,
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
  education_career_id uuid;
BEGIN
  SELECT id INTO education_career_id FROM careers WHERE slug = 'education';

  -- Insert Classroom Conductor Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    education_career_id,
    'Classroom Conductor',
    'It''s your first week as a preschool teacher! A room full of energetic kids with different learning styles needs engaging activities — match each student with the perfect activity.',
    1,
    100,
    'mini_game',
    '{"subType": "classroom-conductor", "difficulty": "beginner"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Lesson Plan Lab Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    education_career_id,
    'Lesson Plan Lab',
    'You''re a curriculum coordinator preparing next week''s lesson plans. Build complete, well-aligned lessons by choosing the right objectives, strategies, assessments, and resources for each subject.',
    2,
    100,
    'mini_game',
    '{"subType": "lesson-plan-lab", "difficulty": "intermediate"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert School Crisis Manager Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    education_career_id,
    'School Crisis Manager',
    'You''re the assistant principal and it''s a chaotic Monday morning. Multiple urgent situations arrive in your inbox — prioritize wisely and choose the best response for each crisis!',
    3,
    100,
    'mini_game',
    '{"subType": "school-crisis-manager", "difficulty": "advanced"}'
  )
  ON CONFLICT DO NOTHING;
END $$;
