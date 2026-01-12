/**
 * Script to update CBT101 course with proper codes and session titles
 * 
 * Run with: node scripts/updateCBT101Course.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const COURSE_CODE = 'CBT101';

// Session data with codes and titles (9 sessions total)
const SESSIONS = [
  {
    code: 'CBT101INT',
    title: 'Course Intro',
    order: 1,
    dayNumber: 1,
  },
  {
    code: 'CBT101M1L',
    title: 'External Events, Internal Experience: The Core CBT Distinction',
    order: 2,
    dayNumber: 2,
  },
  {
    code: 'CBT101M1P',
    title: 'Camera vs. Internal Experience: A Two-Column Practice',
    order: 3,
    dayNumber: 3,
  },
  {
    code: 'CBT101M2L',
    title: 'The Trigger Chain: From Signal to Urge',
    order: 4,
    dayNumber: 4,
  },
  {
    code: 'CBT101M2P',
    title: 'Slow-Motion Trigger Replay: Mapping the Reaction Chain',
    order: 5,
    dayNumber: 5,
  },
  {
    code: 'CBT101M3L',
    title: 'Pause, Notice, Name, Choose: The 10-Second Space',
    order: 6,
    dayNumber: 6,
  },
  {
    code: 'CBT101M3P',
    title: 'Micro-Skill Practice: Creating Space Before You Act',
    order: 7,
    dayNumber: 7,
  },
  {
    code: 'CBT101M4L',
    title: 'The CBT Cycle: How Thoughts Shape Feelings and Actions',
    order: 8,
    dayNumber: 8,
  },
  {
    code: 'CBT101M4P',
    title: 'Event–Thought–Feeling–Action: A Guided Pattern Mapping',
    order: 9,
    dayNumber: 9,
  },
];

async function updateCBT101() {
  console.log('Updating CBT101 course...\n');

  try {
    // Step 1: Find the CBT101 course
    console.log('Step 1: Finding CBT101 course...');
    const coursesSnapshot = await db.collection('courses').get();
    let cbtCourse = null;

    coursesSnapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toLowerCase();
      const code = (data.code || '').toUpperCase();
      if (code === COURSE_CODE || title.includes('cbt') || title.includes('cognitive')) {
        cbtCourse = { id: doc.id, ...data };
      }
    });

    if (!cbtCourse) {
      console.log('CBT course not found! Please check Firebase.');
      process.exit(1);
    }

    console.log(`  Found course: "${cbtCourse.title}" (ID: ${cbtCourse.id})`);

    // Step 2: Update course metadata
    console.log('\nStep 2: Updating course metadata...');
    await db.collection('courses').doc(cbtCourse.id).update({
      code: COURSE_CODE,
      title: 'Foundations of Cognitive Behavioral Therapy',
      subtitle: '',
      sessionCount: SESSIONS.length,
    });
    console.log('  ✓ Updated course metadata');

    // Step 3: Get existing sessions and update them
    console.log('\nStep 3: Updating sessions...');
    const sessionsSnapshot = await db.collection('course_sessions')
      .where('courseId', '==', cbtCourse.id)
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
          courseId: cbtCourse.id,
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

    console.log('\n✅ CBT101 course updated successfully!');
    console.log('\nFinal state:');
    console.log(`- Course ID: ${cbtCourse.id}`);
    console.log(`- Course code: ${COURSE_CODE}`);
    console.log(`- Title: Foundations of Cognitive Behavioral Therapy`);
    console.log(`- Sessions: ${SESSIONS.length}`);
    console.log('\nSession codes:');
    SESSIONS.forEach(s => {
      console.log(`  ${s.code}: ${s.title}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updateCBT101();
