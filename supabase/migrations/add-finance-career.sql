-- Add Financial Services Career and Challenges

-- Insert Financial Services Career
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index, is_active)
VALUES (
  'financial-services',
  'Financial Services',
  'Financial Analyst',
  'Step into the world of finance! Balance budgets, build investment portfolios, and detect fraudulent transactions in this high-stakes career simulation.',
  '{"primary": "#0d9488", "secondary": "#0f766e", "accent": "#2dd4bf", "background": "#f0fdfa"}',
  'DollarSign',
  25,
  5,
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
  finance_career_id uuid;
BEGIN
  SELECT id INTO finance_career_id FROM careers WHERE slug = 'financial-services';

  -- Insert Budget Balancer Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    finance_career_id,
    'Budget Balancer',
    'You''ve just been hired at a startup! Categorize the company''s monthly expenses into the correct budget categories before the board meeting.',
    1,
    100,
    'mini_game',
    '{"subType": "budget-balancer", "difficulty": "beginner"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Investment Simulator Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    finance_career_id,
    'Investment Simulator',
    'A client has $10,000 to invest. Build a diversified portfolio and navigate through volatile market events to maximize their returns!',
    2,
    100,
    'mini_game',
    '{"subType": "investment-simulator", "difficulty": "intermediate"}'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Fraud Detector Challenge
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    finance_career_id,
    'Fraud Detector',
    'The bank''s AI flagged suspicious transactions across multiple accounts. Review them carefully — catch the fraud, but don''t flag innocent customers!',
    3,
    100,
    'mini_game',
    '{"subType": "fraud-detector", "difficulty": "advanced"}'
  )
  ON CONFLICT DO NOTHING;
END $$;
