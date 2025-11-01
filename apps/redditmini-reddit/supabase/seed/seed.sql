-- Seed data for RedditMini

-- Insert test users
INSERT INTO users (id, email, username, full_name, bio, karma, cake_day) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john@example.com', 'johndoe', 'John Doe', 'Just a regular redditor', 42, '2024-01-01'),
  ('22222222-2222-2222-2222-222222222222', 'jane@example.com', 'janedoe', 'Jane Doe', 'Love tech and gaming!', 128, '2024-02-15'),
  ('33333333-3333-3333-3333-333333333333', 'bob@example.com', 'bobsmith', 'Bob Smith', 'Sports enthusiast', 15, '2024-03-20');

-- Insert test subreddits
INSERT INTO subreddits (id, name, display_name, description, created_by, subscriber_count) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'programming', 'Programming', 'Computer programming discussions', '11111111-1111-1111-1111-111111111111', 100),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gaming', 'Gaming', 'Everything about video games', '22222222-2222-2222-2222-222222222222', 150),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'technology', 'Technology', 'Latest tech news and discussions', '11111111-1111-1111-1111-111111111111', 200),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'sports', 'Sports', 'All sports discussions', '33333333-3333-3333-3333-333333333333', 80);

-- Insert test posts
INSERT INTO posts (id, user_id, subreddit_id, title, content, post_type, upvotes, downvotes, comment_count, created_at) VALUES
  ('post1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   'What''s your favorite programming language and why?', 
   'I''ve been programming for a few years now and I''m curious what everyone''s favorite language is. Mine is TypeScript because of the type safety and great tooling.',
   'text', 25, 2, 12, NOW() - INTERVAL '2 days'),
  
  ('post2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Just finished Baldur''s Gate 3 - What a masterpiece!',
   'After 120 hours, I finally finished BG3. The story, characters, and gameplay are absolutely incredible. No spoilers, but the ending was perfect for my playthrough.',
   'text', 142, 5, 28, NOW() - INTERVAL '1 day'),
  
  ('post3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Apple Vision Pro Reviews Are In - Mixed Reality Revolution?',
   'The first reviews of Apple''s Vision Pro are starting to come in. Most reviewers are impressed by the technology but concerned about the price and battery life. What are your thoughts?',
   'text', 89, 12, 45, NOW() - INTERVAL '5 hours'),
  
  ('post4444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'That comeback in the 4th quarter was insane!',
   'Did anyone else watch the game last night? Down by 20 points with 8 minutes left and they managed to win in OT. Absolutely incredible!',
   'text', 67, 3, 19, NOW() - INTERVAL '12 hours'),
  
  ('post5555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'GitHub Copilot vs ChatGPT for coding - which do you prefer?',
   'I''ve been using both tools for a while now. Copilot is great for autocomplete and boilerplate, while ChatGPT is better for explaining concepts and debugging. What''s your experience?',
   'text', 156, 8, 63, NOW() - INTERVAL '3 hours');

-- Insert test comments
INSERT INTO comments (id, user_id, post_id, content, upvotes, downvotes, created_at) VALUES
  ('comm1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'post1111-1111-1111-1111-111111111111',
   'TypeScript is great! I love how it catches errors at compile time.', 8, 1, NOW() - INTERVAL '1 day'),
  
  ('comm2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'post1111-1111-1111-1111-111111111111',
   'Python for me. Simple syntax and great for data science.', 12, 2, NOW() - INTERVAL '20 hours'),
  
  ('comm3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'post2222-2222-2222-2222-222222222222',
   'I''m 80 hours in and still in Act 2! This game is massive.', 24, 0, NOW() - INTERVAL '18 hours');

-- Insert test votes
INSERT INTO votes (user_id, post_id, vote_type) VALUES
  ('11111111-1111-1111-1111-111111111111', 'post2222-2222-2222-2222-222222222222', 'upvote'),
  ('11111111-1111-1111-1111-111111111111', 'post3333-3333-3333-3333-333333333333', 'upvote'),
  ('22222222-2222-2222-2222-222222222222', 'post1111-1111-1111-1111-111111111111', 'upvote'),
  ('22222222-2222-2222-2222-222222222222', 'post4444-4444-4444-4444-444444444444', 'downvote'),
  ('33333333-3333-3333-3333-333333333333', 'post5555-5555-5555-5555-555555555555', 'upvote');

-- Insert test subscriptions
INSERT INTO subscriptions (user_id, subreddit_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
