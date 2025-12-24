/**
 * Firestore Seeding Script
 * 
 * Run with: node scripts/seedFirestore.js
 * 
 * This script uploads all seed content to Firestore collections:
 * - guided_meditations (40)
 * - breathing_exercises (20)
 * - bedtime_stories (1)
 * - daily_quotes (35)
 * - meditation_programs (10)
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  deleteDoc,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase config (same as in src/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDkCd6LiHEhvn_i10bvLwM11kotU3Gpbb0",
  authDomain: "calmnest-e910e.firebaseapp.com",
  projectId: "calmnest-e910e",
  storageBucket: "calmnest-e910e.firebasestorage.app",
  messagingSenderId: "1012641376582",
  appId: "1:1012641376582:android:9ed0b2e187aeb9cb375d47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== IMAGE URL MAPPING ====================

const imageFiles = {
  // Meditation images
  meditation_morning_sunrise: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80',
  meditation_golden_light: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80',
  meditation_flower_bloom: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80',
  meditation_sunset_glow: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80',
  meditation_abundance: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80',
  meditation_calm_water: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
  meditation_zen_stones: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  meditation_peaceful_lake: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
  meditation_soft_clouds: 'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&q=80',
  meditation_deep_relax: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  meditation_sharp_mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  meditation_clear_sky: 'https://images.unsplash.com/photo-1505533542167-8c89838bb19e?w=800&q=80',
  meditation_morning_dew: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
  meditation_study_focus: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80',
  meditation_creative_flow: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
  meditation_safe_harbor: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',
  meditation_grounding: 'https://images.unsplash.com/photo-1518173946687-a4c036bc6f19?w=800&q=80',
  meditation_gentle_waves: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80',
  meditation_calm_presence: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80',
  meditation_inner_peace: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  meditation_night_sky: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&q=80',
  meditation_moonlit: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80',
  meditation_twilight: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
  meditation_cozy_rest: 'https://images.unsplash.com/photo-1515894203077-3b2e0f1e9c89?w=800&q=80',
  meditation_dream: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=800&q=80',
  meditation_body_awareness: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  meditation_relaxed_body: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  meditation_quick_scan: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  meditation_healing: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80',
  meditation_recovery: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  meditation_self_love: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
  meditation_confidence: 'https://images.unsplash.com/photo-1494178270175-e96de2971df9?w=800&q=80',
  meditation_worthy: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80',
  meditation_inner_child: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
  meditation_positive: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  meditation_heart_open: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80',
  meditation_metta: 'https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?w=800&q=80',
  meditation_forgiveness: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  meditation_compassion: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
  meditation_universal_love: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  
  // Breathing images
  breathing_box: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  breathing_478: 'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&q=80',
  breathing_belly: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  breathing_energy: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80',
  breathing_calm: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
  breathing_alternate: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  breathing_ocean: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80',
  breathing_morning: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
  breathing_sos: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
  breathing_focus: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  breathing_sleep: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&q=80',
  breathing_anxiety: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',
  breathing_power: 'https://images.unsplash.com/photo-1505533542167-8c89838bb19e?w=800&q=80',
  breathing_mindful: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  breathing_coherent: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80',
  breathing_cooling: 'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=800&q=80',
  breathing_grounding: 'https://images.unsplash.com/photo-1518173946687-a4c036bc6f19?w=800&q=80',
  breathing_heart: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80',
  breathing_counting: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80',
  breathing_victory: 'https://images.unsplash.com/photo-1494178270175-e96de2971df9?w=800&q=80',
  
  // Bedtime story images
  story_thriller_midnight: 'https://images.unsplash.com/photo-1509248961725-aec71c87a22c?w=800&q=80',
  
  // Program images
  program_basics: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  program_stress: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
  program_sleep: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&q=80',
  program_anxiety: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',
  program_focus: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  program_self_compassion: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
  program_morning: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80',
  program_breathing: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  program_mindful: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  program_advanced: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
};

// Helper to get image URL
const getImageUrl = (key) => imageFiles[key] || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80';

// ==================== GUIDED MEDITATIONS (40) ====================

const seedMeditations = [
  // GRATITUDE (5)
  { title: 'Morning Calm', description: 'Start your day with peace and gratitude. This gentle meditation helps you set positive intentions for the day ahead.', category: 'gratitude', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_gratitude', thumbnail_url: getImageUrl('meditation_morning_sunrise'), is_premium: false, tags: ['morning', 'gratitude', 'intentions', 'peaceful'] },
  { title: 'Gratitude Awakening', description: 'Open your eyes to the blessings around you. A practice to cultivate deep appreciation for life.', category: 'gratitude', duration_minutes: 15, difficulty_level: 'beginner', instructor: 'Emma', audio_file: 'meditation_gratitude', thumbnail_url: getImageUrl('meditation_golden_light'), is_premium: false, tags: ['gratitude', 'appreciation', 'blessings', 'mindful'] },
  { title: 'Thankful Heart', description: 'Connect with feelings of genuine thankfulness. Let appreciation fill every breath.', category: 'gratitude', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_gratitude', thumbnail_url: getImageUrl('meditation_flower_bloom'), is_premium: false, tags: ['thankful', 'heart', 'appreciation', 'warmth'] },
  { title: 'Evening Gratitude', description: 'Reflect on the gifts of your day. End each evening with a grateful heart.', category: 'gratitude', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Michael', audio_file: 'meditation_gratitude', thumbnail_url: getImageUrl('meditation_sunset_glow'), is_premium: false, tags: ['evening', 'reflection', 'gratitude', 'peace'] },
  { title: 'Abundance Meditation', description: 'Shift your perspective to see the abundance in your life. Cultivate a mindset of plenty.', category: 'gratitude', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'Emma', audio_file: 'meditation_gratitude', thumbnail_url: getImageUrl('meditation_abundance'), is_premium: true, tags: ['abundance', 'prosperity', 'mindset', 'positive'] },
  
  // STRESS (5)
  { title: 'Stress Relief', description: 'Release tension and find your center. A soothing practice to help you let go of stress and anxiety.', category: 'stress', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_stress', thumbnail_url: getImageUrl('meditation_calm_water'), is_premium: false, tags: ['stress', 'relaxation', 'calm', 'relief'] },
  { title: 'Tension Release', description: 'Systematically release physical and mental tension. Feel the stress melt away.', category: 'stress', duration_minutes: 15, difficulty_level: 'beginner', instructor: 'Michael', audio_file: 'meditation_stress', thumbnail_url: getImageUrl('meditation_zen_stones'), is_premium: false, tags: ['tension', 'release', 'body', 'relaxation'] },
  { title: 'Calm in Chaos', description: 'Find your peaceful center even when life feels overwhelming. Your sanctuary is within.', category: 'stress', duration_minutes: 10, difficulty_level: 'intermediate', instructor: 'Sarah', audio_file: 'meditation_stress', thumbnail_url: getImageUrl('meditation_peaceful_lake'), is_premium: false, tags: ['chaos', 'calm', 'center', 'peace'] },
  { title: 'Workplace Stress', description: 'Quick reset for work-related tension. Perfect for a lunch break or after meetings.', category: 'stress', duration_minutes: 8, difficulty_level: 'beginner', instructor: 'James', audio_file: 'meditation_stress', thumbnail_url: getImageUrl('meditation_soft_clouds'), is_premium: false, tags: ['work', 'office', 'quick', 'reset'] },
  { title: 'Deep Relaxation', description: 'Journey into profound relaxation. Let every muscle soften and every thought quiet.', category: 'stress', duration_minutes: 20, difficulty_level: 'intermediate', instructor: 'Emma', audio_file: 'meditation_stress', thumbnail_url: getImageUrl('meditation_deep_relax'), is_premium: true, tags: ['deep', 'relaxation', 'calm', 'peaceful'] },
  
  // FOCUS (5)
  { title: 'Deep Focus', description: 'Sharpen your concentration and boost productivity. Perfect before important work or study sessions.', category: 'focus', duration_minutes: 10, difficulty_level: 'intermediate', instructor: 'Michael', audio_file: 'meditation_focus', thumbnail_url: getImageUrl('meditation_sharp_mountain'), is_premium: false, tags: ['focus', 'concentration', 'productivity', 'clarity'] },
  { title: 'Laser Focus', description: 'Train your mind to stay on target. Develop unwavering concentration.', category: 'focus', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'James', audio_file: 'meditation_focus', thumbnail_url: getImageUrl('meditation_clear_sky'), is_premium: false, tags: ['laser', 'concentration', 'training', 'mind'] },
  { title: 'Morning Clarity', description: 'Start your day with a clear, focused mind. Set the tone for productive hours ahead.', category: 'focus', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_focus', thumbnail_url: getImageUrl('meditation_morning_dew'), is_premium: false, tags: ['morning', 'clarity', 'productive', 'fresh'] },
  { title: 'Study Session', description: 'Prepare your mind for learning and retention. Optimal focus for students.', category: 'focus', duration_minutes: 8, difficulty_level: 'beginner', instructor: 'Michael', audio_file: 'meditation_focus', thumbnail_url: getImageUrl('meditation_study_focus'), is_premium: false, tags: ['study', 'learning', 'students', 'memory'] },
  { title: 'Creative Flow', description: 'Enter a state of creative focus. Let ideas flow freely while maintaining direction.', category: 'focus', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'Emma', audio_file: 'meditation_focus', thumbnail_url: getImageUrl('meditation_creative_flow'), is_premium: true, tags: ['creative', 'flow', 'ideas', 'inspiration'] },
  
  // ANXIETY (5)
  { title: 'Anxiety Ease', description: 'Calm racing thoughts and find stillness. Gentle guidance to help you navigate anxious moments.', category: 'anxiety', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_anxiety', thumbnail_url: getImageUrl('meditation_safe_harbor'), is_premium: false, tags: ['anxiety', 'calm', 'peace', 'grounding'] },
  { title: 'Panic Relief', description: 'Emergency support for overwhelming moments. Ground yourself and find stability.', category: 'anxiety', duration_minutes: 5, difficulty_level: 'beginner', instructor: 'Emma', audio_file: 'meditation_anxiety', thumbnail_url: getImageUrl('meditation_grounding'), is_premium: false, tags: ['panic', 'emergency', 'grounding', 'support'] },
  { title: 'Worry Release', description: 'Let go of worries about the future. Return to the safety of the present moment.', category: 'anxiety', duration_minutes: 12, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_anxiety', thumbnail_url: getImageUrl('meditation_gentle_waves'), is_premium: false, tags: ['worry', 'future', 'present', 'release'] },
  { title: 'Social Calm', description: 'Prepare for social situations with confidence. Ease social anxiety naturally.', category: 'anxiety', duration_minutes: 10, difficulty_level: 'intermediate', instructor: 'Michael', audio_file: 'meditation_anxiety', thumbnail_url: getImageUrl('meditation_calm_presence'), is_premium: false, tags: ['social', 'confidence', 'calm', 'preparation'] },
  { title: 'Anxious Thoughts', description: 'Learn to observe anxious thoughts without being controlled by them. Find freedom.', category: 'anxiety', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'Emma', audio_file: 'meditation_anxiety', thumbnail_url: getImageUrl('meditation_inner_peace'), is_premium: true, tags: ['thoughts', 'observation', 'freedom', 'mindful'] },
  
  // SLEEP (5)
  { title: 'Evening Wind Down', description: 'Prepare your mind for restful sleep. Let go of the day and ease into peaceful relaxation.', category: 'sleep', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Michael', audio_file: 'meditation_sleep', thumbnail_url: getImageUrl('meditation_night_sky'), is_premium: false, tags: ['evening', 'sleep', 'relaxation', 'wind-down'] },
  { title: 'Deep Sleep', description: 'Drift into restorative, deep sleep. Wake refreshed and renewed.', category: 'sleep', duration_minutes: 20, difficulty_level: 'beginner', instructor: 'Emma', audio_file: 'meditation_sleep', thumbnail_url: getImageUrl('meditation_moonlit'), is_premium: false, tags: ['deep', 'sleep', 'restorative', 'rest'] },
  { title: 'Insomnia Relief', description: 'Gentle support for sleepless nights. Quiet the mind and invite rest.', category: 'sleep', duration_minutes: 25, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_sleep', thumbnail_url: getImageUrl('meditation_twilight'), is_premium: false, tags: ['insomnia', 'sleepless', 'relief', 'rest'] },
  { title: 'Bedtime Reset', description: 'Release the day completely. Transition from wakefulness to peaceful slumber.', category: 'sleep', duration_minutes: 15, difficulty_level: 'beginner', instructor: 'James', audio_file: 'meditation_sleep', thumbnail_url: getImageUrl('meditation_cozy_rest'), is_premium: false, tags: ['bedtime', 'reset', 'transition', 'peaceful'] },
  { title: 'Dream Journey', description: 'Visualization to guide you into pleasant dreams. Sleep with a smile.', category: 'sleep', duration_minutes: 20, difficulty_level: 'intermediate', instructor: 'Emma', audio_file: 'meditation_sleep', thumbnail_url: getImageUrl('meditation_dream'), is_premium: true, tags: ['dreams', 'visualization', 'pleasant', 'journey'] },
  
  // BODY-SCAN (5)
  { title: 'Body Scan', description: 'Connect with your body through mindful awareness. Systematically release tension from head to toe.', category: 'body-scan', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Michael', audio_file: 'meditation_bodyscan', thumbnail_url: getImageUrl('meditation_body_awareness'), is_premium: false, tags: ['body', 'awareness', 'relaxation', 'tension'] },
  { title: 'Full Body Relaxation', description: 'Complete body scan for total relaxation. Feel every muscle let go.', category: 'body-scan', duration_minutes: 20, difficulty_level: 'beginner', instructor: 'Emma', audio_file: 'meditation_bodyscan', thumbnail_url: getImageUrl('meditation_relaxed_body'), is_premium: false, tags: ['full', 'body', 'relaxation', 'complete'] },
  { title: 'Quick Body Check', description: 'Brief body awareness practice. Perfect for busy days.', category: 'body-scan', duration_minutes: 5, difficulty_level: 'beginner', instructor: 'Sarah', audio_file: 'meditation_bodyscan', thumbnail_url: getImageUrl('meditation_quick_scan'), is_premium: false, tags: ['quick', 'check', 'busy', 'awareness'] },
  { title: 'Pain Relief Scan', description: 'Gentle awareness for areas of discomfort. Breathe ease into tension.', category: 'body-scan', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'Michael', audio_file: 'meditation_bodyscan', thumbnail_url: getImageUrl('meditation_healing'), is_premium: false, tags: ['pain', 'relief', 'discomfort', 'healing'] },
  { title: 'Athletic Recovery', description: 'Body scan designed for post-workout recovery. Help muscles restore and heal.', category: 'body-scan', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'James', audio_file: 'meditation_bodyscan', thumbnail_url: getImageUrl('meditation_recovery'), is_premium: true, tags: ['athletic', 'recovery', 'muscles', 'healing'] },
  
  // SELF-ESTEEM (5)
  { title: 'Self Compassion', description: 'Cultivate kindness toward yourself. Learn to embrace your imperfections with love and understanding.', category: 'self-esteem', duration_minutes: 10, difficulty_level: 'intermediate', instructor: 'Sarah', audio_file: 'meditation_selfesteem', thumbnail_url: getImageUrl('meditation_self_love'), is_premium: false, tags: ['self-love', 'compassion', 'kindness', 'acceptance'] },
  { title: 'Inner Confidence', description: 'Build unshakeable self-belief from within. You are worthy and capable.', category: 'self-esteem', duration_minutes: 12, difficulty_level: 'intermediate', instructor: 'Emma', audio_file: 'meditation_selfesteem', thumbnail_url: getImageUrl('meditation_confidence'), is_premium: false, tags: ['confidence', 'belief', 'worthy', 'capable'] },
  { title: 'Self-Worth', description: 'Reconnect with your inherent value. You deserve love and respect.', category: 'self-esteem', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'Sarah', audio_file: 'meditation_selfesteem', thumbnail_url: getImageUrl('meditation_worthy'), is_premium: false, tags: ['worth', 'value', 'love', 'respect'] },
  { title: 'Healing Inner Child', description: 'Nurture the child within you. Offer comfort to past hurts with present kindness.', category: 'self-esteem', duration_minutes: 20, difficulty_level: 'advanced', instructor: 'Emma', audio_file: 'meditation_selfesteem', thumbnail_url: getImageUrl('meditation_inner_child'), is_premium: true, tags: ['inner-child', 'healing', 'nurture', 'comfort'] },
  { title: 'Positive Self-Talk', description: 'Transform your inner dialogue. Replace criticism with encouragement.', category: 'self-esteem', duration_minutes: 10, difficulty_level: 'beginner', instructor: 'Michael', audio_file: 'meditation_selfesteem', thumbnail_url: getImageUrl('meditation_positive'), is_premium: false, tags: ['positive', 'self-talk', 'dialogue', 'encouragement'] },
  
  // LOVING-KINDNESS (5)
  { title: 'Loving Kindness', description: 'Open your heart with metta meditation. Send love and compassion to yourself and others.', category: 'loving-kindness', duration_minutes: 10, difficulty_level: 'intermediate', instructor: 'Sarah', audio_file: 'meditation_lovingkindness', thumbnail_url: getImageUrl('meditation_heart_open'), is_premium: false, tags: ['love', 'kindness', 'compassion', 'metta'] },
  { title: 'Heart Opening', description: 'Expand your capacity for love. Feel your heart soften and open.', category: 'loving-kindness', duration_minutes: 15, difficulty_level: 'intermediate', instructor: 'Emma', audio_file: 'meditation_lovingkindness', thumbnail_url: getImageUrl('meditation_metta'), is_premium: false, tags: ['heart', 'opening', 'love', 'expand'] },
  { title: 'Forgiveness Practice', description: 'Release resentment and find peace. Forgiveness is freedom for yourself.', category: 'loving-kindness', duration_minutes: 15, difficulty_level: 'advanced', instructor: 'Sarah', audio_file: 'meditation_lovingkindness', thumbnail_url: getImageUrl('meditation_forgiveness'), is_premium: false, tags: ['forgiveness', 'release', 'peace', 'freedom'] },
  { title: 'Compassion for Others', description: 'Extend loving-kindness to all beings. Connect with our shared humanity.', category: 'loving-kindness', duration_minutes: 12, difficulty_level: 'intermediate', instructor: 'Michael', audio_file: 'meditation_lovingkindness', thumbnail_url: getImageUrl('meditation_compassion'), is_premium: false, tags: ['compassion', 'others', 'humanity', 'connection'] },
  { title: 'Universal Love', description: 'Experience boundless love for all existence. Dissolve the boundaries between self and other.', category: 'loving-kindness', duration_minutes: 20, difficulty_level: 'advanced', instructor: 'Emma', audio_file: 'meditation_lovingkindness', thumbnail_url: getImageUrl('meditation_universal_love'), is_premium: true, tags: ['universal', 'boundless', 'existence', 'oneness'] },
];

// ==================== BREATHING EXERCISES (20) ====================

const seedBreathingExercises = [
  { title: 'Box Breathing', description: 'A powerful technique used by Navy SEALs to stay calm under pressure.', duration_minutes: 5, pattern: '4-4-4-4', inhale_seconds: 4, hold_seconds: 4, exhale_seconds: 4, hold_after_exhale_seconds: 4, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_box'), benefits: ['Reduces stress', 'Improves focus', 'Calms nervous system'] },
  { title: '4-7-8 Relaxation', description: "Dr. Andrew Weil's natural tranquilizer for the nervous system.", duration_minutes: 5, pattern: '4-7-8', inhale_seconds: 4, hold_seconds: 7, exhale_seconds: 8, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_478'), benefits: ['Promotes sleep', 'Reduces anxiety', 'Slows heart rate'] },
  { title: 'Deep Belly Breath', description: 'Activate your diaphragm for deep, restorative breathing.', duration_minutes: 5, pattern: '6-2-7', inhale_seconds: 6, hold_seconds: 2, exhale_seconds: 7, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_belly'), benefits: ['Activates parasympathetic', 'Reduces tension', 'Improves oxygen flow'] },
  { title: 'Energizing Breath', description: 'Quick breathing to boost energy and alertness.', duration_minutes: 3, pattern: '3-3-3', inhale_seconds: 3, hold_seconds: 3, exhale_seconds: 3, hold_after_exhale_seconds: 0, audio_file: 'breathing_energy', thumbnail_url: getImageUrl('breathing_energy'), benefits: ['Increases energy', 'Improves alertness', 'Clears mind'] },
  { title: 'Calming Breath', description: 'Longer exhales activate your relaxation response.', duration_minutes: 5, pattern: '4-0-6', inhale_seconds: 4, hold_seconds: 0, exhale_seconds: 6, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_calm'), benefits: ['Calms nerves', 'Easy to learn', 'Instant relaxation'] },
  { title: 'Alternate Nostril', description: 'Balance left and right brain hemispheres.', duration_minutes: 7, pattern: '4-4-4', inhale_seconds: 4, hold_seconds: 4, exhale_seconds: 4, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_alternate'), benefits: ['Balances energy', 'Clears mind', 'Reduces anxiety'] },
  { title: 'Ocean Breath', description: 'Ujjayi breathing creates a soothing ocean sound.', duration_minutes: 8, pattern: '5-0-5', inhale_seconds: 5, hold_seconds: 0, exhale_seconds: 5, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_ocean'), benefits: ['Builds focus', 'Creates warmth', 'Meditative'] },
  { title: 'Morning Wake-Up', description: 'Invigorating breath to start your day with energy.', duration_minutes: 4, pattern: '4-2-4', inhale_seconds: 4, hold_seconds: 2, exhale_seconds: 4, hold_after_exhale_seconds: 0, audio_file: 'breathing_energy', thumbnail_url: getImageUrl('breathing_morning'), benefits: ['Increases alertness', 'Oxygenates blood', 'Energizes'] },
  { title: 'Stress SOS', description: 'Emergency breathing for acute stress moments.', duration_minutes: 3, pattern: '3-3-6', inhale_seconds: 3, hold_seconds: 3, exhale_seconds: 6, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_sos'), benefits: ['Immediate calm', 'Stops panic', 'Portable technique'] },
  { title: 'Focus Breath', description: 'Prepare your mind for concentrated work.', duration_minutes: 5, pattern: '4-4-4', inhale_seconds: 4, hold_seconds: 4, exhale_seconds: 4, hold_after_exhale_seconds: 0, audio_file: 'breathing_energy', thumbnail_url: getImageUrl('breathing_focus'), benefits: ['Enhances focus', 'Clears distractions', 'Prepares mind'] },
  { title: 'Sleep Prep', description: 'Slow, deep breathing to prepare for sleep.', duration_minutes: 6, pattern: '4-7-8', inhale_seconds: 4, hold_seconds: 7, exhale_seconds: 8, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_sleep'), benefits: ['Induces drowsiness', 'Quiets mind', 'Relaxes body'] },
  { title: 'Anxiety Relief', description: 'Extended exhale breathing for anxious moments.', duration_minutes: 5, pattern: '4-0-8', inhale_seconds: 4, hold_seconds: 0, exhale_seconds: 8, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_anxiety'), benefits: ['Reduces anxiety', 'Slows heart rate', 'Calms mind'] },
  { title: 'Power Breath', description: 'Short, powerful breaths for energy and clarity.', duration_minutes: 3, pattern: '2-0-2', inhale_seconds: 2, hold_seconds: 0, exhale_seconds: 2, hold_after_exhale_seconds: 0, audio_file: 'breathing_energy', thumbnail_url: getImageUrl('breathing_power'), benefits: ['Quick energy boost', 'Sharpens mind', 'Increases oxygen'] },
  { title: 'Mindful Breathing', description: 'Simple awareness of natural breath.', duration_minutes: 10, pattern: 'natural', inhale_seconds: 0, hold_seconds: 0, exhale_seconds: 0, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_mindful'), benefits: ['Develops awareness', 'Calms mind', 'Present moment focus'] },
  { title: 'Coherent Breathing', description: 'Five breaths per minute for heart-brain coherence.', duration_minutes: 5, pattern: '6-0-6', inhale_seconds: 6, hold_seconds: 0, exhale_seconds: 6, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_coherent'), benefits: ['Heart coherence', 'Reduces stress', 'Balances emotions'] },
  { title: 'Cooling Breath', description: 'Sitali pranayama to cool body and mind.', duration_minutes: 5, pattern: '4-0-4', inhale_seconds: 4, hold_seconds: 0, exhale_seconds: 4, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_cooling'), benefits: ['Cools body', 'Reduces anger', 'Calms mind'] },
  { title: 'Grounding Breath', description: 'Connect with the earth through breath.', duration_minutes: 5, pattern: '5-3-5', inhale_seconds: 5, hold_seconds: 3, exhale_seconds: 5, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_grounding'), benefits: ['Grounding', 'Stability', 'Security'] },
  { title: 'Heart Breath', description: 'Breathe into and from your heart center.', duration_minutes: 7, pattern: '5-2-5', inhale_seconds: 5, hold_seconds: 2, exhale_seconds: 5, hold_after_exhale_seconds: 0, audio_file: 'breathing_calm', thumbnail_url: getImageUrl('breathing_heart'), benefits: ['Opens heart', 'Cultivates love', 'Emotional healing'] },
  { title: 'Counting Breath', description: 'Count your breaths to anchor attention.', duration_minutes: 5, pattern: '4-0-4', inhale_seconds: 4, hold_seconds: 0, exhale_seconds: 4, hold_after_exhale_seconds: 0, audio_file: 'breathing_energy', thumbnail_url: getImageUrl('breathing_counting'), benefits: ['Builds focus', 'Simple technique', 'Anchors attention'] },
  { title: 'Victory Breath', description: 'Build confidence through powerful breathing.', duration_minutes: 5, pattern: '4-4-4-4', inhale_seconds: 4, hold_seconds: 4, exhale_seconds: 4, hold_after_exhale_seconds: 4, audio_file: 'breathing_energy', thumbnail_url: getImageUrl('breathing_victory'), benefits: ['Builds confidence', 'Inner strength', 'Empowering'] },
];

// ==================== BEDTIME STORIES (1) ====================

const seedBedtimeStories = [
  { title: 'The Midnight Crossing', description: 'A suspenseful journey through shadows and mystery. The night holds secrets waiting to be discovered.', duration_minutes: 6, category: 'thriller', narrator: 'Rachel', audio_file: 'story_midnight_crossing', thumbnail_url: getImageUrl('story_thriller_midnight'), is_premium: false },
];

// ==================== DAILY QUOTES (35) ====================

const seedQuotes = [
  { text: "Take a breath. You're exactly where you need to be.", author: 'CalmNest', category: 'mindfulness' },
  { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha', category: 'peace' },
  { text: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.', author: 'Thich Nhat Hanh', category: 'presence' },
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott', category: 'rest' },
  { text: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.', author: 'Thich Nhat Hanh', category: 'breathing' },
  { text: 'You are the sky. Everything else is just the weather.', author: 'Pema Chödrön', category: 'perspective' },
  { text: 'In the midst of movement and chaos, keep stillness inside of you.', author: 'Deepak Chopra', category: 'stillness' },
  { text: 'The quieter you become, the more you can hear.', author: 'Ram Dass', category: 'silence' },
  { text: 'Smile, breathe, and go slowly.', author: 'Thich Nhat Hanh', category: 'mindfulness' },
  { text: 'Within you, there is a stillness and a sanctuary to which you can retreat at any time.', author: 'Hermann Hesse', category: 'peace' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha', category: 'mind' },
  { text: 'Be where you are, not where you think you should be.', author: 'Unknown', category: 'presence' },
  { text: 'Breathe in calm, breathe out chaos.', author: 'CalmNest', category: 'breathing' },
  { text: 'Rest when you need to. The world can wait.', author: 'CalmNest', category: 'rest' },
  { text: 'Every moment is a fresh beginning.', author: 'T.S. Eliot', category: 'new beginnings' },
  { text: 'The greatest weapon against stress is our ability to choose one thought over another.', author: 'William James', category: 'stress' },
  { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu', category: 'patience' },
  { text: 'Surrender to what is. Let go of what was. Have faith in what will be.', author: 'Sonia Ricotti', category: 'acceptance' },
  { text: 'The only way to live is by accepting each minute as an unrepeatable miracle.', author: 'Tara Brach', category: 'presence' },
  { text: 'Your calm mind is the ultimate weapon against your challenges.', author: 'Bryant McGill', category: 'calm' },
  { text: 'Do not let the behavior of others destroy your inner peace.', author: 'Dalai Lama', category: 'peace' },
  { text: 'Between stimulus and response there is a space. In that space is our power to choose.', author: 'Viktor Frankl', category: 'choice' },
  { text: 'Happiness is not something ready-made. It comes from your own actions.', author: 'Dalai Lama', category: 'happiness' },
  { text: 'The present moment is the only moment available to us, and it is the door to all moments.', author: 'Thich Nhat Hanh', category: 'presence' },
  { text: "Let go of the thoughts that don't make you strong.", author: 'Karen Salmansohn', category: 'letting go' },
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: 'Dan Millman', category: 'thoughts' },
  { text: 'Be patient with yourself. Self-growth is tender.', author: 'CalmNest', category: 'self-compassion' },
  { text: "The best time to relax is when you don't have time for it.", author: 'Sydney J. Harris', category: 'rest' },
  { text: 'Inhale the future, exhale the past.', author: 'Unknown', category: 'breathing' },
  { text: 'Your mind is a garden, your thoughts are the seeds.', author: 'Unknown', category: 'mind' },
  { text: "Slow down. Calm down. Don't worry. Don't hurry. Trust the process.", author: 'Alexandra Stoddard', category: 'trust' },
  { text: 'Nothing can bring you peace but yourself.', author: 'Ralph Waldo Emerson', category: 'peace' },
  { text: 'The only Zen you find on the tops of mountains is the Zen you bring up there.', author: 'Robert M. Pirsig', category: 'mindfulness' },
  { text: 'Life is available only in the present moment.', author: 'Thich Nhat Hanh', category: 'presence' },
  { text: 'Set peace of mind as your highest goal, and organize your life around it.', author: 'Brian Tracy', category: 'peace' },
];

// ==================== MEDITATION PROGRAMS (10) ====================

const seedPrograms = [
  { title: 'Meditation Basics', description: 'A 7-day introduction to meditation.', duration_days: 7, difficulty_level: 'beginner', category: 'basics', thumbnail_url: getImageUrl('program_basics'), is_active: true },
  { title: 'Stress Less', description: 'A 14-day journey to reduce stress and anxiety.', duration_days: 14, difficulty_level: 'beginner', category: 'stress', thumbnail_url: getImageUrl('program_stress'), is_active: true },
  { title: 'Better Sleep', description: 'A 7-day program to improve your sleep quality.', duration_days: 7, difficulty_level: 'beginner', category: 'sleep', thumbnail_url: getImageUrl('program_sleep'), is_active: true },
  { title: 'Anxiety Relief', description: 'A 21-day program to understand and manage anxiety.', duration_days: 21, difficulty_level: 'intermediate', category: 'anxiety', thumbnail_url: getImageUrl('program_anxiety'), is_active: true },
  { title: 'Focus Mastery', description: 'A 14-day intensive to sharpen concentration.', duration_days: 14, difficulty_level: 'intermediate', category: 'focus', thumbnail_url: getImageUrl('program_focus'), is_active: true },
  { title: 'Self-Compassion Journey', description: 'A 30-day path to loving yourself.', duration_days: 30, difficulty_level: 'intermediate', category: 'self-esteem', thumbnail_url: getImageUrl('program_self_compassion'), is_active: true },
  { title: 'Morning Routine', description: 'A 7-day program for perfect morning meditation.', duration_days: 7, difficulty_level: 'beginner', category: 'morning', thumbnail_url: getImageUrl('program_morning'), is_active: true },
  { title: 'Breathing Fundamentals', description: 'A 10-day exploration of breathing techniques.', duration_days: 10, difficulty_level: 'beginner', category: 'breathing', thumbnail_url: getImageUrl('program_breathing'), is_active: true },
  { title: 'Mindful Living', description: 'A 21-day program for daily mindfulness.', duration_days: 21, difficulty_level: 'intermediate', category: 'mindfulness', thumbnail_url: getImageUrl('program_mindful'), is_active: true },
  { title: 'Advanced Meditation', description: 'A 30-day deep dive for experienced practitioners.', duration_days: 30, difficulty_level: 'advanced', category: 'advanced', thumbnail_url: getImageUrl('program_advanced'), is_active: true },
];

// ==================== HELPER FUNCTIONS ====================

async function clearCollection(collectionName) {
  console.log(`  Clearing ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  console.log(`  Cleared ${snapshot.size} documents`);
}

async function seedCollection(collectionName, data) {
  console.log(`  Seeding ${collectionName}...`);
  const collectionRef = collection(db, collectionName);
  
  for (const item of data) {
    await addDoc(collectionRef, {
      ...item,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
  
  console.log(`  Added ${data.length} documents to ${collectionName}`);
}

// ==================== MAIN FUNCTION ====================

async function main() {
  console.log('\n🌿 CalmNest Firestore Seeding Script\n');
  console.log('========================================\n');
  
  try {
    // Clear existing data
    console.log('Step 1: Clearing existing data...\n');
    await clearCollection('guided_meditations');
    await clearCollection('breathing_exercises');
    await clearCollection('bedtime_stories');
    await clearCollection('daily_quotes');
    await clearCollection('meditation_programs');
    
    console.log('\nStep 2: Seeding new data...\n');
    
    // Seed new data
    await seedCollection('guided_meditations', seedMeditations);
    await seedCollection('breathing_exercises', seedBreathingExercises);
    await seedCollection('bedtime_stories', seedBedtimeStories);
    await seedCollection('daily_quotes', seedQuotes);
    await seedCollection('meditation_programs', seedPrograms);
    
    console.log('\n========================================');
    console.log('✅ Seeding complete!\n');
    console.log('Summary:');
    console.log(`  - ${seedMeditations.length} guided meditations`);
    console.log(`  - ${seedBreathingExercises.length} breathing exercises`);
    console.log(`  - ${seedBedtimeStories.length} bedtime stories`);
    console.log(`  - ${seedQuotes.length} daily quotes`);
    console.log(`  - ${seedPrograms.length} meditation programs`);
    console.log(`\n  TOTAL: ${seedMeditations.length + seedBreathingExercises.length + seedBedtimeStories.length + seedQuotes.length + seedPrograms.length} content items`);
    console.log('\n🧘 Your content is ready with images!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding Firestore:', error);
    process.exit(1);
  }
}

main();
