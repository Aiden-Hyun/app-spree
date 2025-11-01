-- Seed data for testing NearNow app
-- Note: These are test users with fake data

-- Test users with various locations around San Francisco
INSERT INTO users (id, email, full_name, avatar_url, bio, age, location_lat, location_lng, is_online, last_seen) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alex@test.com', 'Alex Chen', 'https://i.pravatar.cc/150?img=1', 'Love hiking and coffee. Looking for good conversations.', 28, 37.7749, -122.4194, true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'jordan@test.com', 'Jordan Smith', 'https://i.pravatar.cc/150?img=2', 'Gym enthusiast and foodie. Let''s grab tacos!', 25, 37.7751, -122.4180, false, NOW() - INTERVAL '30 minutes'),
  ('33333333-3333-3333-3333-333333333333', 'sam@test.com', 'Sam Johnson', 'https://i.pravatar.cc/150?img=3', 'Artist and musician. Into indie films.', 31, 37.7730, -122.4200, true, NOW()),
  ('44444444-4444-4444-4444-444444444444', 'taylor@test.com', 'Taylor Davis', 'https://i.pravatar.cc/150?img=4', 'Tech professional by day, dancer by night.', 29, 37.7760, -122.4170, false, NOW() - INTERVAL '2 hours'),
  ('55555555-5555-5555-5555-555555555555', 'casey@test.com', 'Casey Wilson', 'https://i.pravatar.cc/150?img=5', 'Dog lover, beach walks, and good vibes only.', 26, 37.7740, -122.4210, true, NOW());

-- User profiles
INSERT INTO user_profiles (user_id, display_name, bio, age, photos, interests, looking_for, distance_preference) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alex', 'Love hiking and coffee. Looking for good conversations.', 28, 
   ARRAY['https://i.pravatar.cc/300?img=1', 'https://i.pravatar.cc/300?img=11'], 
   ARRAY['hiking', 'coffee', 'photography', 'travel'], 
   ARRAY['friends', 'dates', 'relationship'], 10),
  
  ('22222222-2222-2222-2222-222222222222', 'Jordan', 'Gym enthusiast and foodie. Let''s grab tacos!', 25,
   ARRAY['https://i.pravatar.cc/300?img=2', 'https://i.pravatar.cc/300?img=12', 'https://i.pravatar.cc/300?img=22'], 
   ARRAY['fitness', 'food', 'movies', 'gaming'], 
   ARRAY['friends', 'right_now', 'dates'], 15),
  
  ('33333333-3333-3333-3333-333333333333', 'Sam', 'Artist and musician. Into indie films.', 31,
   ARRAY['https://i.pravatar.cc/300?img=3'], 
   ARRAY['art', 'music', 'films', 'reading'], 
   ARRAY['friends', 'networking', 'relationship'], 20),
  
  ('44444444-4444-4444-4444-444444444444', 'Taylor', 'Tech professional by day, dancer by night.', 29,
   ARRAY['https://i.pravatar.cc/300?img=4', 'https://i.pravatar.cc/300?img=14'], 
   ARRAY['tech', 'dancing', 'wine', 'travel'], 
   ARRAY['dates', 'friends', 'chat'], 25),
  
  ('55555555-5555-5555-5555-555555555555', 'Casey', 'Dog lover, beach walks, and good vibes only.', 26,
   ARRAY['https://i.pravatar.cc/300?img=5', 'https://i.pravatar.cc/300?img=15', 'https://i.pravatar.cc/300?img=25'], 
   ARRAY['dogs', 'beach', 'yoga', 'cooking'], 
   ARRAY['friends', 'dates', 'relationship'], 30);

-- Some sample swipes
INSERT INTO swipes (swiper_id, swiped_id, swipe_type) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'like'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'like'), -- This creates a match!
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'like'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'super_like');

-- Create a match between Alex and Jordan
INSERT INTO matches (user1_id, user2_id) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Some sample messages
INSERT INTO messages (match_id, sender_id, content, sent_at) VALUES
  ((SELECT id FROM matches WHERE (user1_id = '11111111-1111-1111-1111-111111111111' AND user2_id = '22222222-2222-2222-2222-222222222222') OR (user1_id = '22222222-2222-2222-2222-222222222222' AND user2_id = '11111111-1111-1111-1111-111111111111')), 
   '11111111-1111-1111-1111-111111111111', 'Hey! Nice to match with you 😊', NOW() - INTERVAL '1 hour'),
  ((SELECT id FROM matches WHERE (user1_id = '11111111-1111-1111-1111-111111111111' AND user2_id = '22222222-2222-2222-2222-222222222222') OR (user1_id = '22222222-2222-2222-2222-222222222222' AND user2_id = '11111111-1111-1111-1111-111111111111')), 
   '22222222-2222-2222-2222-222222222222', 'Hey! Thanks for the tap! How''s your day going?', NOW() - INTERVAL '50 minutes'),
  ((SELECT id FROM matches WHERE (user1_id = '11111111-1111-1111-1111-111111111111' AND user2_id = '22222222-2222-2222-2222-222222222222') OR (user1_id = '22222222-2222-2222-2222-222222222222' AND user2_id = '11111111-1111-1111-1111-111111111111')), 
   '11111111-1111-1111-1111-111111111111', 'Pretty good! Just finished a hike. You mentioned you like tacos - know any good spots nearby?', NOW() - INTERVAL '45 minutes');
