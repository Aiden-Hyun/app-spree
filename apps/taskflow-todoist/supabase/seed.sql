-- Seed data for TaskFlow

-- First, create a test user (you'll need to manually create auth users through Supabase dashboard)
-- This assumes you have a user with email 'test@example.com'

-- Insert sample projects
INSERT INTO projects (user_id, name, description, color)
SELECT 
  auth.uid(),
  name,
  description,
  color
FROM (
  VALUES 
    ('Work', 'Work-related tasks and projects', '#e74c3c'),
    ('Personal', 'Personal tasks and errands', '#3498db'),
    ('Side Project', 'Building the next big thing', '#2ecc71'),
    ('Learning', 'Courses and skill development', '#f39c12'),
    ('Home', 'Household tasks and chores', '#9b59b6')
) AS data(name, description, color)
WHERE auth.uid() IS NOT NULL;

-- Insert sample tasks
WITH project_ids AS (
  SELECT 
    id,
    name,
    row_number() OVER (ORDER BY created_at) as rn
  FROM projects 
  WHERE user_id = auth.uid()
)
INSERT INTO tasks (user_id, project_id, title, description, priority, status, due_date)
SELECT 
  auth.uid(),
  CASE 
    WHEN random() < 0.3 THEN NULL -- 30% go to inbox
    ELSE (SELECT id FROM project_ids WHERE rn = (floor(random() * 5) + 1)::int LIMIT 1)
  END,
  title,
  description,
  priority,
  status,
  due_date
FROM (
  VALUES
    -- Today's tasks
    ('Complete quarterly report', 'Compile Q4 sales data and create presentation', 'high', 'todo', CURRENT_DATE),
    ('Team standup meeting', 'Daily sync with the development team', 'medium', 'todo', CURRENT_DATE),
    ('Reply to client emails', NULL, 'medium', 'completed', CURRENT_DATE),
    ('Review pull requests', 'Check pending PRs on GitHub', 'high', 'todo', CURRENT_DATE),
    
    -- Tomorrow's tasks
    ('Dentist appointment', 'Annual checkup at 2 PM', 'high', 'todo', CURRENT_DATE + INTERVAL '1 day'),
    ('Submit expense report', 'Include receipts from business trip', 'medium', 'todo', CURRENT_DATE + INTERVAL '1 day'),
    
    -- This week's tasks
    ('Prepare presentation', 'Product demo for stakeholders', 'urgent', 'todo', CURRENT_DATE + INTERVAL '3 days'),
    ('Update documentation', 'Add new API endpoints to docs', 'low', 'todo', CURRENT_DATE + INTERVAL '4 days'),
    ('Code review session', 'Review junior dev code', 'medium', 'todo', CURRENT_DATE + INTERVAL '5 days'),
    
    -- Next week's tasks
    ('Annual performance review', 'Self-evaluation and goals', 'high', 'todo', CURRENT_DATE + INTERVAL '8 days'),
    ('Plan team outing', 'Research venues and activities', 'low', 'todo', CURRENT_DATE + INTERVAL '10 days'),
    
    -- Overdue tasks
    ('File taxes', 'Submit personal tax returns', 'urgent', 'todo', CURRENT_DATE - INTERVAL '2 days'),
    ('Renew gym membership', NULL, 'low', 'todo', CURRENT_DATE - INTERVAL '5 days'),
    
    -- No due date tasks
    ('Learn Rust', 'Complete the Rust programming book', 'low', 'todo', NULL),
    ('Organize garage', 'Clean and sort storage boxes', 'low', 'todo', NULL),
    ('Read "Atomic Habits"', NULL, 'medium', 'todo', NULL),
    
    -- Completed tasks
    ('Fix login bug', 'Users unable to reset password', 'urgent', 'completed', CURRENT_DATE - INTERVAL '1 day'),
    ('Grocery shopping', 'Weekly groceries', 'medium', 'completed', CURRENT_DATE - INTERVAL '1 day'),
    ('Workout', '45 min cardio session', 'medium', 'completed', CURRENT_DATE)
) AS data(title, description, priority, status, due_date)
WHERE auth.uid() IS NOT NULL;

-- Add some subtasks to random tasks
WITH parent_tasks AS (
  SELECT id, title
  FROM tasks
  WHERE user_id = auth.uid()
    AND status = 'todo'
  ORDER BY RANDOM()
  LIMIT 5
)
INSERT INTO subtasks (task_id, title, is_completed)
SELECT 
  pt.id,
  st.title,
  false
FROM parent_tasks pt
CROSS JOIN LATERAL (
  VALUES 
    ('Research phase'),
    ('Implementation'),
    ('Testing'),
    ('Documentation')
) AS st(title)
WHERE pt.title LIKE '%report%' 
   OR pt.title LIKE '%presentation%'
   OR pt.title LIKE '%review%'
LIMIT 10;

-- Create some task labels
INSERT INTO task_labels (user_id, name, color)
SELECT 
  auth.uid(),
  name,
  color
FROM (
  VALUES
    ('Important', '#e74c3c'),
    ('Urgent', '#f39c12'),
    ('Quick Win', '#2ecc71'),
    ('Blocked', '#95a5a6'),
    ('In Review', '#3498db')
) AS data(name, color)
WHERE auth.uid() IS NOT NULL;

-- Assign labels to some tasks
WITH task_sample AS (
  SELECT id
  FROM tasks
  WHERE user_id = auth.uid()
  ORDER BY RANDOM()
  LIMIT 10
),
label_sample AS (
  SELECT id
  FROM task_labels
  WHERE user_id = auth.uid()
  ORDER BY RANDOM()
  LIMIT 3
)
INSERT INTO task_label_assignments (task_id, label_id)
SELECT DISTINCT
  t.id,
  l.id
FROM task_sample t
CROSS JOIN label_sample l
WHERE RANDOM() < 0.5 -- 50% chance of assignment
ON CONFLICT (task_id, label_id) DO NOTHING;

-- Update user stats
UPDATE users
SET 
  total_tasks_completed = (
    SELECT COUNT(*) 
    FROM tasks 
    WHERE user_id = users.id AND status = 'completed'
  ),
  current_streak = CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM tasks 
      WHERE user_id = users.id 
        AND status = 'completed' 
        AND completed_at::date = CURRENT_DATE
    ) THEN 1 
    ELSE 0 
  END
WHERE id = auth.uid();


