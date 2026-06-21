-- Add the new Bank Teller Challenge and update Fraud Detector scoring

-- We need to execute within a DO block to get the ID safely
DO $$
DECLARE
  finance_career_id uuid;
BEGIN
  -- Get the Financial Services career ID
  SELECT id INTO finance_career_id FROM careers WHERE slug = 'financial-services';

  IF finance_career_id IS NULL THEN
    RAISE EXCEPTION 'Financial Services career not found.';
  END IF;

  -- 1. Update the Fraud Detector Challenge:
  -- We set it to order_index = 3, max_score = 50
  UPDATE challenges 
  SET max_score = 50, order_index = 3
  WHERE career_id = finance_career_id AND title = 'Fraud Detector';

  -- 2. Insert the new Bank Teller Simulation Challenge:
  -- We also set it to order_index = 3 so it unlocks simultaneously with Fraud Detector
  -- It is worth 50 points
  INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
  VALUES (
    finance_career_id,
    'Bank Teller Simulation',
    'Serve customers, handle deposits, and spot fake currency or expired IDs before the day ends!',
    3,
    50,
    'mini_game',
    '{"subType": "bank-teller", "difficulty": "intermediate"}'
  )
  ON CONFLICT DO NOTHING;
END $$;
