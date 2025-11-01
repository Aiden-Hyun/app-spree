-- Seed data for SafePocket development
-- Note: This creates a test user with email: test@safepocket.com / password: testpassword123

-- Insert test user (password hash is for 'testpassword123')
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'test@safepocket.com',
  '$2a$10$PkZiQhoUakFste5WJLPGe.fDzV7iRTJH6rDWt7AtnMWZeZvWvjNNe',
  NOW(),
  NOW(),
  NOW()
);

-- Insert user profile
INSERT INTO users (id, email, full_name, master_password_hash, two_factor_enabled, biometric_enabled, auto_lock_minutes)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'test@safepocket.com',
  'Test User',
  NULL, -- Master password will be set on first login
  false,
  false,
  15
);

-- Insert default categories
INSERT INTO password_categories (id, user_id, name, color, icon) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Personal', '#0984e3', '👤'),
  ('c2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Work', '#00b894', '💼'),
  ('c3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Finance', '#fdcb6e', '💰'),
  ('c4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Social', '#e17055', '💬'),
  ('c5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Shopping', '#a29bfe', '🛍️');

-- Note: Actual passwords should be encrypted client-side before storage
-- These are placeholder encrypted values for demonstration

-- Insert sample passwords
INSERT INTO passwords (user_id, category_id, title, username, password_encrypted, website, notes, is_favorite) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1111111-1111-1111-1111-111111111111', 'Google Account', 'test@gmail.com', 'ENCRYPTED_PASSWORD_1', 'https://google.com', 'Primary Google account', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2222222-2222-2222-2222-222222222222', 'Work Email', 'test@company.com', 'ENCRYPTED_PASSWORD_2', 'https://outlook.office365.com', 'Company email account', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c3333333-3333-3333-3333-333333333333', 'Bank of America', 'testuser123', 'ENCRYPTED_PASSWORD_3', 'https://bankofamerica.com', 'Main checking account', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c4444444-4444-4444-4444-444444444444', 'Twitter', '@testuser', 'ENCRYPTED_PASSWORD_4', 'https://twitter.com', NULL, false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c4444444-4444-4444-4444-444444444444', 'LinkedIn', 'test@gmail.com', 'ENCRYPTED_PASSWORD_5', 'https://linkedin.com', 'Professional network', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c5555555-5555-5555-5555-555555555555', 'Amazon', 'test@gmail.com', 'ENCRYPTED_PASSWORD_6', 'https://amazon.com', 'Prime account', true);

-- Insert security events
INSERT INTO security_events (user_id, event_type, description) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'account_created', 'Account created'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'login', 'Successful login'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'password_created', 'Created password: Google Account');

-- Grant permissions for test user
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
