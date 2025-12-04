-- Function to increment post upvotes
CREATE OR REPLACE FUNCTION increment_upvotes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET upvotes = upvotes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post upvotes
CREATE OR REPLACE FUNCTION decrement_upvotes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment post downvotes
CREATE OR REPLACE FUNCTION increment_downvotes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET downvotes = downvotes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post downvotes
CREATE OR REPLACE FUNCTION decrement_downvotes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET downvotes = GREATEST(0, downvotes - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comment upvotes
CREATE OR REPLACE FUNCTION increment_comment_upvotes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments SET upvotes = upvotes + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comment upvotes
CREATE OR REPLACE FUNCTION decrement_comment_upvotes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comment downvotes
CREATE OR REPLACE FUNCTION increment_comment_downvotes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments SET downvotes = downvotes + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comment downvotes
CREATE OR REPLACE FUNCTION decrement_comment_downvotes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments SET downvotes = GREATEST(0, downvotes - 1) WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user karma
CREATE OR REPLACE FUNCTION calculate_user_karma(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  post_karma INTEGER;
  comment_karma INTEGER;
BEGIN
  -- Calculate karma from posts
  SELECT COALESCE(SUM(upvotes - downvotes), 0) INTO post_karma
  FROM posts
  WHERE posts.user_id = calculate_user_karma.user_id;
  
  -- Calculate karma from comments
  SELECT COALESCE(SUM(upvotes - downvotes), 0) INTO comment_karma
  FROM comments
  WHERE comments.user_id = calculate_user_karma.user_id;
  
  RETURN post_karma + comment_karma;
END;
$$ LANGUAGE plpgsql;

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating comment count
CREATE TRIGGER update_post_comment_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Function to update subreddit subscriber count
CREATE OR REPLACE FUNCTION update_subreddit_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE subreddits SET subscriber_count = subscriber_count + 1 WHERE id = NEW.subreddit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE subreddits SET subscriber_count = GREATEST(0, subscriber_count - 1) WHERE id = OLD.subreddit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating subscriber count
CREATE TRIGGER update_subreddit_subscriber_count_trigger
AFTER INSERT OR DELETE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subreddit_subscriber_count();


