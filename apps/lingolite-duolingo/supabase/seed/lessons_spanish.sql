-- Spanish lessons seed data

-- Get Spanish language ID
WITH spanish_lang AS (
  SELECT id FROM languages WHERE code = 'es' LIMIT 1
)

-- Vocabulary Lessons
INSERT INTO lessons (language_id, title, description, lesson_type, difficulty_level, xp_reward, is_active)
SELECT 
  (SELECT id FROM spanish_lang),
  title,
  description,
  lesson_type,
  difficulty_level,
  xp_reward,
  true
FROM (VALUES
  -- Level 1 Vocabulary Lessons
  ('Basic Greetings', 'Learn essential Spanish greetings and polite expressions', 'vocabulary', 1, 10),
  ('Common Words', 'Master everyday Spanish words for daily communication', 'vocabulary', 1, 10),
  ('Numbers 1-20', 'Count from 1 to 20 in Spanish', 'vocabulary', 1, 10),
  ('Colors', 'Learn the names of colors in Spanish', 'vocabulary', 1, 10),
  ('Days of the Week', 'Master the days of the week in Spanish', 'vocabulary', 1, 10),
  
  -- Level 2 Vocabulary Lessons
  ('Essential Verbs', 'Learn the most common Spanish verbs', 'vocabulary', 2, 15),
  ('Family Members', 'Vocabulary for talking about family', 'vocabulary', 2, 15),
  ('Food & Drinks', 'Common food and beverage vocabulary', 'vocabulary', 2, 15),
  ('Time Expressions', 'Tell time and discuss schedules', 'vocabulary', 2, 15),
  ('Places in the City', 'Navigate Spanish-speaking cities', 'vocabulary', 2, 15),
  
  -- Level 3 Vocabulary Lessons
  ('Business Terms', 'Professional and business vocabulary', 'vocabulary', 3, 20),
  ('Travel Essentials', 'Words and phrases for traveling', 'vocabulary', 3, 20),
  ('Technology', 'Modern technology vocabulary', 'vocabulary', 3, 20),
  ('Health & Body', 'Medical and body-related vocabulary', 'vocabulary', 3, 20),
  ('Academic Terms', 'Educational and academic vocabulary', 'vocabulary', 3, 20)
) AS t(title, description, lesson_type, difficulty_level, xp_reward)
ON CONFLICT DO NOTHING;

-- Grammar Lessons
INSERT INTO lessons (language_id, title, description, lesson_type, difficulty_level, xp_reward, is_active)
SELECT 
  (SELECT id FROM spanish_lang),
  title,
  description,
  lesson_type,
  difficulty_level,
  xp_reward,
  true
FROM (VALUES
  -- Level 1 Grammar
  ('Subject Pronouns', 'Learn yo, tú, él, ella, and more', 'grammar', 1, 15),
  ('Present Tense - Regular AR Verbs', 'Conjugate regular -ar verbs in present tense', 'grammar', 1, 15),
  ('Definite Articles', 'Master el, la, los, las', 'grammar', 1, 15),
  ('Gender & Number', 'Understand masculine/feminine and singular/plural', 'grammar', 1, 15),
  ('Basic Questions', 'Form simple questions in Spanish', 'grammar', 1, 15),
  
  -- Level 2 Grammar
  ('Present Tense - ER/IR Verbs', 'Conjugate -er and -ir verbs', 'grammar', 2, 20),
  ('Ser vs Estar', 'Master the two forms of "to be"', 'grammar', 2, 20),
  ('Direct Object Pronouns', 'Use lo, la, los, las correctly', 'grammar', 2, 20),
  ('Preterite Tense Basics', 'Talk about the past', 'grammar', 2, 20),
  ('Reflexive Verbs', 'Learn daily routine verbs', 'grammar', 2, 20),
  
  -- Level 3 Grammar
  ('Subjunctive Mood', 'Express wishes, emotions, and doubts', 'grammar', 3, 25),
  ('Conditional Tense', 'Talk about hypothetical situations', 'grammar', 3, 25),
  ('Future Tense', 'Discuss future plans and predictions', 'grammar', 3, 25),
  ('Past Perfect', 'Describe completed past actions', 'grammar', 3, 25),
  ('Passive Voice', 'Form passive constructions', 'grammar', 3, 25)
) AS t(title, description, lesson_type, difficulty_level, xp_reward)
ON CONFLICT DO NOTHING;

-- Conversation Lessons
INSERT INTO lessons (language_id, title, description, lesson_type, difficulty_level, xp_reward, is_active)
SELECT 
  (SELECT id FROM spanish_lang),
  title,
  description,
  lesson_type,
  difficulty_level,
  xp_reward,
  true
FROM (VALUES
  -- Level 1 Conversations
  ('Introducing Yourself', 'Learn to introduce yourself and meet new people', 'conversation', 1, 20),
  ('At the Restaurant', 'Order food and drinks like a local', 'conversation', 1, 20),
  ('Shopping Basics', 'Ask for prices and make purchases', 'conversation', 1, 20),
  ('Asking for Directions', 'Navigate new places confidently', 'conversation', 1, 20),
  ('Making Friends', 'Start casual conversations', 'conversation', 1, 20),
  
  -- Level 2 Conversations
  ('Phone Conversations', 'Handle phone calls in Spanish', 'conversation', 2, 25),
  ('Making Appointments', 'Schedule meetings and appointments', 'conversation', 2, 25),
  ('Discussing Hobbies', 'Talk about interests and activities', 'conversation', 2, 25),
  ('At the Doctor', 'Describe symptoms and understand advice', 'conversation', 2, 25),
  ('Job Interview', 'Basic professional conversations', 'conversation', 2, 25),
  
  -- Level 3 Conversations
  ('Debating Topics', 'Express opinions and argue points', 'conversation', 3, 30),
  ('Business Meetings', 'Professional discussions and presentations', 'conversation', 3, 30),
  ('Cultural Exchange', 'Discuss cultural differences', 'conversation', 3, 30),
  ('News & Current Events', 'Talk about current affairs', 'conversation', 3, 30),
  ('Academic Discussions', 'Participate in academic conversations', 'conversation', 3, 30)
) AS t(title, description, lesson_type, difficulty_level, xp_reward)
ON CONFLICT DO NOTHING;
