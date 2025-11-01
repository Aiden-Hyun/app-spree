-- Insert system templates
INSERT INTO templates (title, description, category, content, icon, is_system, is_public) VALUES
  ('Daily Journal', 'Track your daily thoughts and reflections', 'journal', 
   '<h1>Daily Journal - {{date}}</h1><h2>Morning Reflection</h2><p></p><h2>Today''s Goals</h2><ul><li></li><li></li><li></li></ul><h2>Gratitude</h2><p></p><h2>Evening Reflection</h2><p></p>', 
   'today', true, true),
  
  ('Meeting Notes', 'Organize your meeting agenda and action items', 'business',
   '<h1>Meeting Notes</h1><p><strong>Date:</strong> {{date}}<br><strong>Attendees:</strong><br><strong>Purpose:</strong></p><h2>Agenda</h2><ol><li></li></ol><h2>Discussion</h2><p></p><h2>Action Items</h2><ul><li>[ ] </li></ul><h2>Next Steps</h2><p></p>',
   'people', true, true),
  
  ('Cornell Notes', 'Effective note-taking system for learning', 'education',
   '<div style="display: grid; grid-template-columns: 1fr 2fr;"><div><h3>Key Points</h3><p></p></div><div><h3>Notes</h3><p></p></div></div><hr><h3>Summary</h3><p></p>',
   'school', true, true),
  
  ('Weekly Planner', 'Plan your week with goals and tasks', 'planner',
   '<h1>Week of {{week_start}}</h1><h2>Weekly Goals</h2><ul><li></li><li></li><li></li></ul><h2>Monday</h2><p></p><h2>Tuesday</h2><p></p><h2>Wednesday</h2><p></p><h2>Thursday</h2><p></p><h2>Friday</h2><p></p><h2>Weekend</h2><p></p><h2>Review</h2><p></p>',
   'calendar', true, true),
  
  ('Project Plan', 'Organize and track project progress', 'business',
   '<h1>Project: {{project_name}}</h1><h2>Overview</h2><p></p><h2>Objectives</h2><ul><li></li></ul><h2>Timeline</h2><p></p><h2>Milestones</h2><ol><li></li></ol><h2>Resources</h2><p></p><h2>Risks</h2><p></p>',
   'briefcase', true, true),
  
  ('Lecture Notes', 'Structured template for class notes', 'education',
   '<h1>{{subject}} - Lecture {{number}}</h1><p><strong>Date:</strong> {{date}}<br><strong>Topic:</strong></p><h2>Key Concepts</h2><p></p><h2>Details</h2><p></p><h2>Examples</h2><p></p><h2>Questions</h2><ul><li></li></ul>',
   'book', true, true),
  
  ('Recipe', 'Save your favorite recipes', 'personal',
   '<h1>{{recipe_name}}</h1><p><strong>Prep Time:</strong><br><strong>Cook Time:</strong><br><strong>Servings:</strong></p><h2>Ingredients</h2><ul><li></li></ul><h2>Instructions</h2><ol><li></li></ol><h2>Notes</h2><p></p>',
   'restaurant', true, true),
  
  ('Travel Plan', 'Plan your trips and adventures', 'personal',
   '<h1>Trip to {{destination}}</h1><p><strong>Dates:</strong> {{start_date}} - {{end_date}}<br><strong>Budget:</strong></p><h2>Itinerary</h2><p></p><h2>Accommodation</h2><p></p><h2>Transportation</h2><p></p><h2>Activities</h2><ul><li></li></ul><h2>Packing List</h2><ul><li>[ ] </li></ul>',
   'airplane', true, true);

-- Insert canvas data for templates that support drawing
INSERT INTO templates (title, description, category, canvas_data, icon, is_system, is_public) VALUES
  ('Grid Paper', 'Perfect for diagrams and technical drawings', 'notes',
   '{"background_type": "grid", "background_color": "#ffffff", "width": 768, "height": 1024}',
   'grid', true, true),
  
  ('Lined Paper', 'Traditional lined paper for handwriting', 'notes',
   '{"background_type": "lined", "background_color": "#ffffff", "width": 768, "height": 1024}',
   'create', true, true),
  
  ('Dotted Paper', 'Dot grid for flexible layouts', 'notes',
   '{"background_type": "dotted", "background_color": "#ffffff", "width": 768, "height": 1024}',
   'radio-button-off', true, true),
  
  ('Blank Canvas', 'Start with a completely blank canvas', 'notes',
   '{"background_type": "blank", "background_color": "#ffffff", "width": 768, "height": 1024}',
   'square-outline', true, true);

-- Create some default tags
INSERT INTO tags (user_id, name, color) 
SELECT 
  id, 
  tag_name,
  tag_color
FROM users 
CROSS JOIN (
  VALUES 
    ('important', '#e74c3c'),
    ('work', '#3498db'),
    ('personal', '#9b59b6'),
    ('ideas', '#f39c12'),
    ('todo', '#e67e22')
) AS default_tags(tag_name, tag_color)
WHERE NOT EXISTS (
  SELECT 1 FROM tags 
  WHERE tags.user_id = users.id 
  AND tags.name = default_tags.tag_name
);
