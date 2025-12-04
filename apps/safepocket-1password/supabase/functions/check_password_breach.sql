-- Function to check if a password has been breached
-- In a real implementation, this would call an external API like HaveIBeenPwned
CREATE OR REPLACE FUNCTION check_password_breach(password_hash TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  common_passwords TEXT[] := ARRAY[
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', 'dragon', 'baseball',
    'iloveyou', 'trustno1', '1234567', 'sunshine', 'master',
    '123456789', 'welcome123', 'shadow', 'ashley', 'football'
  ];
BEGIN
  -- This is a simplified version for demo purposes
  -- In production, you would hash the password and check against a breach database
  IF password_hash = ANY(common_passwords) THEN
    result := jsonb_build_object(
      'breached', true,
      'breach_count', floor(random() * 1000000 + 10000)::int,
      'last_breach_date', (CURRENT_DATE - INTERVAL '1 year' * random())::date
    );
  ELSE
    result := jsonb_build_object(
      'breached', false,
      'breach_count', 0
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_password_breach(TEXT) TO authenticated;


