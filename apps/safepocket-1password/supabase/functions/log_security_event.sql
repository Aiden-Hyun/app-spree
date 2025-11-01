-- Function to log security events with automatic user context
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  description TEXT,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  -- Insert security event with current user context
  INSERT INTO security_events (
    user_id,
    event_type,
    description,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    event_type,
    description,
    COALESCE(ip_address, inet_client_addr()),
    user_agent,
    NOW()
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, TEXT, INET, TEXT) TO authenticated;

-- Create a trigger to automatically log password access
CREATE OR REPLACE FUNCTION log_password_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when a password is accessed (on SELECT)
  IF TG_OP = 'SELECT' THEN
    PERFORM log_security_event(
      'password_accessed',
      'Password accessed: ' || NEW.title
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Row-level SELECT triggers are not supported in PostgreSQL
-- Instead, use application-level logging for password access

-- Create triggers for password modifications
CREATE OR REPLACE FUNCTION log_password_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      'password_created',
      'Password created: ' || NEW.title
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_security_event(
      'password_updated',
      'Password updated: ' || NEW.title
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      'password_deleted',
      'Password deleted: ' || OLD.title
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS password_insert_trigger ON passwords;
CREATE TRIGGER password_insert_trigger
  AFTER INSERT ON passwords
  FOR EACH ROW
  EXECUTE FUNCTION log_password_changes();

DROP TRIGGER IF EXISTS password_update_trigger ON passwords;
CREATE TRIGGER password_update_trigger
  AFTER UPDATE ON passwords
  FOR EACH ROW
  EXECUTE FUNCTION log_password_changes();

DROP TRIGGER IF EXISTS password_delete_trigger ON passwords;
CREATE TRIGGER password_delete_trigger
  AFTER DELETE ON passwords
  FOR EACH ROW
  EXECUTE FUNCTION log_password_changes();
