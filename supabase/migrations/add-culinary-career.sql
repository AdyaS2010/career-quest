-- Add Culinary Arts Career and Challenges

-- Insert Culinary Arts Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'culinary-arts',
  'Culinary Arts',
  'Chef',
  'Master the art of cooking in a fast-paced kitchen. Take orders, prepare dishes, and create beautiful plate presentations.',
  '{"primary": "#ea580c", "secondary": "#c2410c", "accent": "#fb923c", "background": "#fff7ed"}',
  'ChefHat',
  20,
  0,
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
  culinary_career_id uuid;
BEGIN
  SELECT id INTO culinary_career_id FROM careers WHERE slug = 'culinary-arts';

  -- Insert Order Taking Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    culinary_career_id,
    'Order Taking Station',
    'Take customer orders quickly and accurately. Remember their preferences and dietary restrictions to get it right!',
    1,
    100,
    'mini_game',
    '{"subType": "order-taking", "difficulty": "beginner"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Cooking Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    culinary_career_id,
    'Cooking Challenge',
    'Cook dishes perfectly by managing multiple timers and following recipes. Don''t let anything burn!',
    2,
    100,
    'mini_game',
    '{"subType": "cooking-challenge", "difficulty": "intermediate"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Plate Presentation Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    culinary_career_id,
    'Plate Presentation Master',
    'Arrange ingredients beautifully on the plate to create restaurant-quality presentations that wow customers.',
    3,
    100,
    'mini_game',
    '{"subType": "plate-presentation", "difficulty": "advanced"}'
  )
  ON CONFLICT DO NOTHING;
END $$;
