/**
 * Script to fix the duplicate ACT101 course issue
 * - Delete the accidentally created new course
 * - Update the original act_101 course with correct data
 * 
 * Run with: node scripts/fixACT101Duplicate.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const CORRECT_COURSE_ID = 'act_101';
const COURSE_CODE = 'ACT101';

// Session data with codes and titles (9 sessions total)
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

async function fixACT101() {
  console.log('Fixing ACT101 course...\n');

  try {
    // Step 1: Delete any duplicate courses (not act_101)
    console.log('Step 1: Finding and deleting duplicate courses...');
    const allCoursesSnapshot = await db.collection('courses').get();
    
    for (const doc of allCoursesSnapshot.docs) {
      const data = doc.data();
      // Delete if it's an ACT course but not the original one
      if (doc.id !== CORRECT_COURSE_ID && 
          (data.code === COURSE_CODE || 
           (data.title || '').toLowerCase().includes('flexibility'))) {
        console.log(`  Deleting duplicate course: ${doc.id} - "${data.title}"`);
        
        // Delete associated sessions first
        const sessionsToDelete = await db.collection('course_sessions')
          .where('courseId', '==', doc.id)
          .get();
        
        for (const sessionDoc of sessionsToDelete.docs) {
          await sessionDoc.ref.delete();
          console.log(`    Deleted session: ${sessionDoc.id}`);
        }
        
        await doc.ref.delete();
        console.log(`  ✓ Deleted duplicate course`);
      }
    }

    // Step 2: Update the correct course
    console.log('\nStep 2: Updating the correct course (act_101)...');
    const courseRef = db.collection('courses').doc(CORRECT_COURSE_ID);
    const courseDoc = await courseRef.get();
    
    if (!courseDoc.exists) {
      console.log('ERROR: Original course act_101 not found!');
      process.exit(1);
    }
    
    await courseRef.update({
      code: COURSE_CODE,
      title: 'Foundations of Psychological Flexibility',
      subtitle: '',
      sessionCount: SESSIONS.length,
    });
    console.log('  ✓ Updated course metadata');

    // Step 3: Get existing sessions and update them
    console.log('\nStep 3: Updating sessions...');
    const sessionsSnapshot = await db.collection('course_sessions')
      .where('courseId', '==', CORRECT_COURSE_ID)
      .get();

    const existingSessions = [];
    sessionsSnapshot.forEach(doc => {
      existingSessions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by order
    existingSessions.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log(`  Found ${existingSessions.length} existing sessions`);

    // Update each session
    for (let i = 0; i < SESSIONS.length; i++) {
      const sessionData = SESSIONS[i];
      const existingSession = existingSessions[i];

      if (existingSession) {
        await db.collection('course_sessions').doc(existingSession.id).update({
          code: sessionData.code,
          title: sessionData.title,
          order: sessionData.order,
          dayNumber: sessionData.dayNumber,
        });
        console.log(`  ✓ Updated session ${i + 1}: ${sessionData.code} - "${sessionData.title}"`);
      } else {
        // Create if missing
        await db.collection('course_sessions').add({
          courseId: CORRECT_COURSE_ID,
          code: sessionData.code,
          title: sessionData.title,
          description: '',
          duration_minutes: 15,
          audioPath: '',
          order: sessionData.order,
          dayNumber: sessionData.dayNumber,
        });
        console.log(`  + Created session ${i + 1}: ${sessionData.code} - "${sessionData.title}"`);
      }
    }

    console.log('\n✅ ACT101 course fixed successfully!');
    console.log('\nFinal state:');
    console.log(`- Course ID: ${CORRECT_COURSE_ID}`);
    console.log(`- Course code: ${COURSE_CODE}`);
    console.log(`- Title: Foundations of Psychological Flexibility`);
    console.log(`- Sessions: ${SESSIONS.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixACT101();
