-- Insert system templates
INSERT INTO templates (id, user_id, title, description, category, content, icon, is_system, is_public) VALUES
-- Journal Templates
('00000000-0000-0000-0000-000000000001', NULL, 'Daily Journal', 'Track your daily thoughts and reflections', 'journal', 
'<h1>{{date}}</h1>
<h2>Morning Thoughts</h2>
<p>How are you feeling today?</p>
<p></p>
<h2>Gratitude</h2>
<p>What are you grateful for today?</p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Today\'s Goals</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Evening Reflection</h2>
<p>How did your day go?</p>
<p></p>
<h2>Tomorrow\'s Priorities</h2>
<ul>
<li></li>
<li></li>
</ul>', 'today', true, true),

('00000000-0000-0000-0000-000000000002', NULL, 'Weekly Review', 'Reflect on your week and plan ahead', 'journal',
'<h1>Week {{week_number}} - {{week_start}}</h1>
<h2>This Week\'s Wins</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Challenges Faced</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Lessons Learned</h2>
<p></p>
<h2>Next Week\'s Focus</h2>
<ol>
<li></li>
<li></li>
<li></li>
</ol>', 'calendar', true, true),

-- Planner Templates
('00000000-0000-0000-0000-000000000003', NULL, 'Weekly Planner', 'Plan your week with goals and tasks', 'planner',
'<h1>Week of {{week_start}}</h1>
<h2>Weekly Goals</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Monday</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Tuesday</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Wednesday</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Thursday</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Friday</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Weekend</h2>
<ul>
<li></li>
<li></li>
</ul>', 'calendar', true, true),

('00000000-0000-0000-0000-000000000004', NULL, 'Project Planner', 'Organize and track your projects', 'planner',
'<h1>Project Name</h1>
<h2>Project Overview</h2>
<p>Description:</p>
<p>Start Date: {{date}}</p>
<p>Due Date:</p>
<h2>Goals</h2>
<ol>
<li></li>
<li></li>
<li></li>
</ol>
<h2>Tasks</h2>
<h3>High Priority</h3>
<ul>
<li></li>
<li></li>
</ul>
<h3>Medium Priority</h3>
<ul>
<li></li>
<li></li>
</ul>
<h3>Low Priority</h3>
<ul>
<li></li>
</ul>
<h2>Resources Needed</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Progress Notes</h2>
<p></p>', 'briefcase', true, true),

-- Notes Templates
('00000000-0000-0000-0000-000000000005', NULL, 'Meeting Notes', 'Organize your meeting agenda and action items', 'notes',
'<h1>Meeting Notes - {{date}}</h1>
<p><strong>Meeting:</strong></p>
<p><strong>Attendees:</strong></p>
<p><strong>Date/Time:</strong> {{date}} {{time}}</p>
<h2>Agenda</h2>
<ol>
<li></li>
<li></li>
<li></li>
</ol>
<h2>Discussion Points</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Decisions Made</h2>
<ul>
<li></li>
<li></li>
</ul>
<h2>Action Items</h2>
<ul>
<li>[ ] Task - Owner - Due Date</li>
<li>[ ] Task - Owner - Due Date</li>
<li>[ ] Task - Owner - Due Date</li>
</ul>
<h2>Next Steps</h2>
<p></p>', 'people', true, true),

('00000000-0000-0000-0000-000000000006', NULL, 'Blank Note', 'Start with a completely blank note', 'notes',
'', 'create', true, true),

-- Education Templates
('00000000-0000-0000-0000-000000000007', NULL, 'Cornell Notes', 'Cornell note-taking system for effective learning', 'education',
'<h1>Subject: </h1>
<p><strong>Date:</strong> {{date}}</p>
<p><strong>Topic:</strong></p>
<hr>
<h2>Cue Column</h2>
<p>(Key questions and main ideas)</p>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Note-Taking Area</h2>
<p>(Detailed notes during lecture/reading)</p>
<p></p>
<p></p>
<p></p>
<hr>
<h2>Summary</h2>
<p>(Brief summary of the page in your own words)</p>
<p></p>', 'school', true, true),

('00000000-0000-0000-0000-000000000008', NULL, 'Study Guide', 'Prepare for exams and review materials', 'education',
'<h1>Study Guide: </h1>
<p><strong>Subject:</strong></p>
<p><strong>Exam Date:</strong></p>
<h2>Key Concepts</h2>
<ol>
<li><strong>Concept:</strong> Definition/Explanation</li>
<li><strong>Concept:</strong> Definition/Explanation</li>
<li><strong>Concept:</strong> Definition/Explanation</li>
</ol>
<h2>Important Formulas/Facts</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Practice Questions</h2>
<ol>
<li>Q: <br>A: </li>
<li>Q: <br>A: </li>
<li>Q: <br>A: </li>
</ol>
<h2>Areas to Review</h2>
<ul>
<li>[ ] Topic 1</li>
<li>[ ] Topic 2</li>
<li>[ ] Topic 3</li>
</ul>', 'book', true, true),

-- Business Templates
('00000000-0000-0000-0000-000000000009', NULL, 'SWOT Analysis', 'Analyze strengths, weaknesses, opportunities, and threats', 'business',
'<h1>SWOT Analysis</h1>
<p><strong>Subject:</strong></p>
<p><strong>Date:</strong> {{date}}</p>
<h2>Strengths</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Weaknesses</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Opportunities</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Threats</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Action Plan</h2>
<ol>
<li></li>
<li></li>
<li></li>
</ol>', 'analytics', true, true),

('00000000-0000-0000-0000-000000000010', NULL, 'Business Plan', 'Outline your business strategy', 'business',
'<h1>Business Plan</h1>
<h2>Executive Summary</h2>
<p></p>
<h2>Business Description</h2>
<p><strong>Mission:</strong></p>
<p><strong>Vision:</strong></p>
<p><strong>Values:</strong></p>
<h2>Market Analysis</h2>
<h3>Target Market</h3>
<p></p>
<h3>Competition</h3>
<ul>
<li></li>
<li></li>
</ul>
<h2>Products/Services</h2>
<ol>
<li></li>
<li></li>
</ol>
<h2>Marketing Strategy</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Financial Projections</h2>
<p></p>
<h2>Next Steps</h2>
<ol>
<li></li>
<li></li>
<li></li>
</ol>', 'briefcase', true, true);

-- Update the sequence to ensure new templates get unique IDs
SELECT setval('templates_id_seq', (SELECT MAX(id) FROM templates WHERE id !~ '^00000000'), true);
