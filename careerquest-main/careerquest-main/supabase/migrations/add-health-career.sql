-- Add Health Sciences Career and Challenges

-- Insert Health Sciences Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'health-sciences',
  'Health Sciences',
  'Medical Professional',
  'Diagnose patients, prescribe treatments, and manage emergency situations. Save lives through medical expertise and quick decision-making.',
  '{"primary": "#dc2626", "secondary": "#b91c1c", "accent": "#f87171", "background": "#fef2f2"}',
  'Stethoscope',
  20,
  4,
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
  health_career_id uuid;
BEGIN
  SELECT id INTO health_career_id FROM careers WHERE slug = 'health-sciences';

  -- Insert Symptom Detective Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    health_career_id,
    'Symptom Detective',
    'Diagnose patients by selecting examination actions, gathering clues, and making accurate diagnoses based on clinical findings.',
    1,
    100,
    'mini_game',
    '{"subType": "symptom-detective", "difficulty": "beginner"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Treatment Planner Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    health_career_id,
    'Treatment Planner',
    'Prescribe appropriate treatments by balancing effectiveness, safety, and patient compliance. Avoid dangerous contraindications.',
    2,
    100,
    'mini_game',
    '{"subType": "treatment-planner", "difficulty": "intermediate"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Emergency Room Rush Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    health_career_id,
    'Emergency Room Rush',
    'Triage incoming patients by severity, treat critical cases first, and manage multiple emergencies under time pressure.',
    3,
    100,
    'mini_game',
    '{"subType": "emergency-room-rush", "difficulty": "advanced"}'
  )
  ON CONFLICT DO NOTHING;
END $$;
