-- Seed data for categories
INSERT INTO categories (name, description, icon, is_active) VALUES
  ('Electronics', 'Phones, computers, tablets, and other electronic devices', 'laptop', true),
  ('Vehicles', 'Cars, trucks, motorcycles, boats, and other vehicles', 'car', true),
  ('Home & Garden', 'Furniture, appliances, tools, and garden equipment', 'home', true),
  ('Fashion', 'Clothing, shoes, accessories, and jewelry', 'tshirt-crew', true),
  ('Sports & Outdoors', 'Sports equipment, outdoor gear, and fitness items', 'basketball', true),
  ('Books & Media', 'Books, movies, music, and games', 'book-open-variant', true),
  ('Toys & Games', 'Toys, board games, video games, and collectibles', 'gamepad-variant', true),
  ('Services', 'Professional services, lessons, and labor', 'hammer', true),
  ('Baby & Kids', 'Baby gear, kids clothing, toys, and furniture', 'baby-carriage', true),
  ('Pets', 'Pet supplies, accessories, and services', 'paw', true),
  ('Free Stuff', 'Free items available for pickup', 'gift', true),
  ('Other', 'Everything else that doesn''t fit in other categories', 'dots-horizontal', true)
ON CONFLICT DO NOTHING;

-- Seed data for test user (optional, for development)
INSERT INTO users (id, email, full_name, location_name, location_lat, location_lng, rating, total_reviews) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User', 'Toronto, ON', 43.6532, -79.3832, 4.5, 10)
ON CONFLICT DO NOTHING;

-- Seed data for test listings (optional, for development)
INSERT INTO listings (
  user_id, 
  category_id, 
  title, 
  description, 
  price, 
  condition, 
  status, 
  location_name, 
  location_lat, 
  location_lng,
  images
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1),
    'iPhone 13 Pro - Excellent Condition',
    'Selling my iPhone 13 Pro in excellent condition. Always kept in a case with screen protector. Comes with original box and charger.',
    899.00,
    'like_new',
    'active',
    'Toronto, ON',
    43.6532,
    -79.3832,
    ARRAY['https://via.placeholder.com/400x300']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE name = 'Home & Garden' LIMIT 1),
    'Vintage Oak Desk',
    'Beautiful vintage oak desk in great condition. Perfect for home office. Dimensions: 60" x 30" x 30".',
    250.00,
    'good',
    'active',
    'Mississauga, ON',
    43.5890,
    -79.6441,
    ARRAY['https://via.placeholder.com/400x300']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE name = 'Sports & Outdoors' LIMIT 1),
    'Mountain Bike - Trek X-Caliber',
    'Trek X-Caliber mountain bike, 29" wheels, medium frame. Great for trails and commuting. Recently serviced.',
    650.00,
    'good',
    'active',
    'Scarborough, ON',
    43.7731,
    -79.2319,
    ARRAY['https://via.placeholder.com/400x300']
  )
ON CONFLICT DO NOTHING;


