/**
 * Script to update ACT101 course with proper codes and session titles
 * 
 * Run with: node scripts/updateACT101Course.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Course code
const COURSE_CODE = 'ACT101';

// Session data with codes and titles (9 sessions total, starting with intro)
const SESSIONS = [
  {
    code: 'ACT101INT',
    title: 'Course Intro',
    order: 1,
    dayNumber: 1,
  },
  {
    code: 'ACT101M1L',
    title: 'Psychological Flexibility: The Core Idea of ACT',
    order: 2,
    dayNumber: 2,
  },
  {
    code: 'ACT101M1P',
    title: 'Notice, Name, Allow: Making Space for What You Feel',
    order: 3,
    dayNumber: 3,
  },
  {
    code: 'ACT101M2L',
    title: 'The Mind as Storyteller: An Introduction to Cognitive Defusion',
    order: 4,
    dayNumber: 4,
  },
  {
    code: 'ACT101M2P',
    title: 'Camera vs. Story: A Cognitive Defusion Practice',
    order: 5,
    dayNumber: 5,
  },
  {
    code: 'ACT101M3L',
    title: 'Waves, Not Storms: Working With Emotions in ACT',
    order: 6,
    dayNumber: 6,
  },
  {
    code: 'ACT101M3P',
    title: 'Name, Locate, Make Space: An Acceptance Practice',
    order: 7,
    dayNumber: 7,
  },
  {
    code: 'ACT101M4L',
    title: 'Values: The Compass That Guides Your Life',
    order: 8,
    dayNumber: 8,
  },
  {
    code: 'ACT101M4P',
    title: 'Compass Practice: Choose a Value, Choose One Small Step',
    order: 9,
    dayNumber: 9,
  },
];

async function updateACT101Course() {
  console.log('Starting ACT101 course update...\n');

  try {
    // Step 1: Find the ACT101 course by ID or code
    const EXISTING_COURSE_ID = 'act_101'; // The known ID of the ACT course
    
    let actCourse = null;
    
    // First try to get by known ID
    const existingDoc = await db.collection('courses').doc(EXISTING_COURSE_ID).get();
    if (existingDoc.exists) {
      actCourse = { id: existingDoc.id, ...existingDoc.data() };
    } else {
      // Fallback: search by code or title
      const coursesSnapshot = await db.collection('courses').get();
      coursesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.code === COURSE_CODE || 
            (data.title || '').toLowerCase().includes('act') || 
            (data.title || '').toLowerCase().includes('acceptance') ||
            (data.title || '').toLowerCase().includes('flexibility')) {
          actCourse = { id: doc.id, ...data };
        }
      });
    }

    if (!actCourse) {
      console.log('ACT course not found. Creating new course...');
      
      // Create new course
      const newCourseRef = await db.collection('courses').add({
        code: COURSE_CODE,
        title: 'Acceptance and Commitment Therapy',
        subtitle: 'A Practical Guide to Psychological Flexibility',
        description: 'Learn the six core processes of ACT to develop psychological flexibility and live a values-driven life.',
        instructor: 'Dr. Sarah Chen',
        color: '#6B8E7B',
        icon: 'leaf',
        sessionCount: SESSIONS.length,
        duration_minutes: SESSIONS.length * 15,
      });
      
      actCourse = { id: newCourseRef.id };
      console.log(`Created new course with ID: ${newCourseRef.id}`);
    } else {
      console.log(`Found existing course: "${actCourse.title}" (ID: ${actCourse.id})`);
      
      // Update course with code and title
      await db.collection('courses').doc(actCourse.id).update({
        code: COURSE_CODE,
        title: 'Foundations of Psychological Flexibility',
        subtitle: '', // Remove subtitle - course code badge shows ACT101 separately
      });
      console.log(`Updated course code to: ${COURSE_CODE}`);
      console.log(`Updated course title to: Foundations of Psychological Flexibility`);
    }

    // Step 2: Get existing sessions for this course (without orderBy to avoid index requirement)
    const sessionsSnapshot = await db.collection('course_sessions')
      .where('courseId', '==', actCourse.id)
      .get();

    const existingSessions = [];
    sessionsSnapshot.forEach(doc => {
      existingSessions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by order in code
    existingSessions.sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log(`\nFound ${existingSessions.length} existing sessions`);

    // Step 3: Update existing sessions or create new ones
    for (let i = 0; i < SESSIONS.length; i++) {
      const sessionData = SESSIONS[i];
      const existingSession = existingSessions[i];

      if (existingSession) {
        // Update existing session
        await db.collection('course_sessions').doc(existingSession.id).update({
          code: sessionData.code,
          title: sessionData.title,
          order: sessionData.order,
          dayNumber: sessionData.dayNumber,
        });
        console.log(`Updated session ${i + 1}: ${sessionData.code} - "${sessionData.title}"`);
      } else {
        // Create new session
        await db.collection('course_sessions').add({
          courseId: actCourse.id,
          code: sessionData.code,
          title: sessionData.title,
          description: `${sessionData.code.includes('L') ? 'Lesson' : 'Practice'} session for ${sessionData.title}`,
          duration_minutes: 15,
          audioPath: '', // Will need to be updated with actual audio
          order: sessionData.order,
          dayNumber: sessionData.dayNumber,
        });
        console.log(`Created session ${i + 1}: ${sessionData.code} - "${sessionData.title}"`);
      }
    }

    console.log('\n✅ ACT101 course update complete!');
    console.log(`\nSummary:`);
    console.log(`- Course code: ${COURSE_CODE}`);
    console.log(`- Sessions updated/created: ${SESSIONS.length}`);
    console.log(`\nSession codes:`);
    SESSIONS.forEach(s => {
      console.log(`  ${s.code}: ${s.title}`);
    });

  } catch (error) {
    console.error('Error updating course:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the update
updateACT101Course();
