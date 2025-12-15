-- Add position column to tasks table for custom ordering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(user_id, position);

-- Initialize position based on created_at for existing tasks
UPDATE public.tasks
SET position = subq.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM public.tasks
) AS subq
WHERE public.tasks.id = subq.id AND public.tasks.position = 0;

