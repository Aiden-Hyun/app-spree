/**
 * Upload all audio files to Firebase Storage
 * 
 * Run with: node scripts/uploadAudioToStorage.js
 * 
 * Prerequisites:
 * - Firebase CLI installed and logged in
 * - Firebase project configured
 * - serviceAccountKey.json in the calmnest-headspace folder
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found!');
  console.log('\nTo get your service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file as "serviceAccountKey.json" in the calmnest-headspace folder');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'calmnest-e910e.firebasestorage.app'
});

const bucket = getStorage().bucket();
const audioDir = path.join(__dirname, '..', 'assets', 'audio');

// All audio files to upload - mapped from local path to Firebase Storage path
const filesToUpload = [
  // ========== MEDITATE ==========
  // Guided meditations
  { local: 'meditate/meditations/anxiety-relief.mp3', remote: 'audio/meditate/meditations/anxiety-relief.mp3' },
  { local: 'meditate/meditations/body-scan.mp3', remote: 'audio/meditate/meditations/body-scan.mp3' },
  { local: 'meditate/meditations/breathing-calm.mp3', remote: 'audio/meditate/meditations/breathing-calm.mp3' },
  { local: 'meditate/meditations/breathing-energy.mp3', remote: 'audio/meditate/meditations/breathing-energy.mp3' },
  { local: 'meditate/meditations/focus-clarity.mp3', remote: 'audio/meditate/meditations/focus-clarity.mp3' },
  { local: 'meditate/meditations/gratitude.mp3', remote: 'audio/meditate/meditations/gratitude.mp3' },
  { local: 'meditate/meditations/loving-kindness.mp3', remote: 'audio/meditate/meditations/loving-kindness.mp3' },
  { local: 'meditate/meditations/self-esteem.mp3', remote: 'audio/meditate/meditations/self-esteem.mp3' },
  { local: 'meditate/meditations/stress-relief.mp3', remote: 'audio/meditate/meditations/stress-relief.mp3' },

  // ========== MUSIC ==========
  // Nature sounds
  { local: 'music/nature-sounds/ambient-dreams.mp3', remote: 'audio/music/nature-sounds/ambient-dreams.mp3' },
  { local: 'music/nature-sounds/autumn-ambience.mp3', remote: 'audio/music/nature-sounds/autumn-ambience.mp3' },
  { local: 'music/nature-sounds/cat-purring-soft.mp3', remote: 'audio/music/nature-sounds/cat-purring-soft.mp3' },
  { local: 'music/nature-sounds/cat-purring.mp3', remote: 'audio/music/nature-sounds/cat-purring.mp3' },
  { local: 'music/nature-sounds/cave-echoes.mp3', remote: 'audio/music/nature-sounds/cave-echoes.mp3' },
  { local: 'music/nature-sounds/city-rain.mp3', remote: 'audio/music/nature-sounds/city-rain.mp3' },
  { local: 'music/nature-sounds/cozy-fireplace.mp3', remote: 'audio/music/nature-sounds/cozy-fireplace.mp3' },
  { local: 'music/nature-sounds/crackling-fireplace.mp3', remote: 'audio/music/nature-sounds/crackling-fireplace.mp3' },
  { local: 'music/nature-sounds/desert-wind.mp3', remote: 'audio/music/nature-sounds/desert-wind.mp3' },
  { local: 'music/nature-sounds/flowing-stream.mp3', remote: 'audio/music/nature-sounds/flowing-stream.mp3' },
  { local: 'music/nature-sounds/forest-campfire.mp3', remote: 'audio/music/nature-sounds/forest-campfire.mp3' },
  { local: 'music/nature-sounds/gentle-water.mp3', remote: 'audio/music/nature-sounds/gentle-water.mp3' },
  { local: 'music/nature-sounds/mountain-wind.mp3', remote: 'audio/music/nature-sounds/mountain-wind.mp3' },
  { local: 'music/nature-sounds/night-wildlife.mp3', remote: 'audio/music/nature-sounds/night-wildlife.mp3' },
  { local: 'music/nature-sounds/ocean-seagulls.mp3', remote: 'audio/music/nature-sounds/ocean-seagulls.mp3' },
  { local: 'music/nature-sounds/ocean-waves.mp3', remote: 'audio/music/nature-sounds/ocean-waves.mp3' },
  { local: 'music/nature-sounds/rain-in-forest.mp3', remote: 'audio/music/nature-sounds/rain-in-forest.mp3' },
  { local: 'music/nature-sounds/rain-on-window.mp3', remote: 'audio/music/nature-sounds/rain-on-window.mp3' },
  { local: 'music/nature-sounds/rain-with-fireplace.mp3', remote: 'audio/music/nature-sounds/rain-with-fireplace.mp3' },
  { local: 'music/nature-sounds/riverside-campfire.mp3', remote: 'audio/music/nature-sounds/riverside-campfire.mp3' },
  { local: 'music/nature-sounds/snow-footsteps.mp3', remote: 'audio/music/nature-sounds/snow-footsteps.mp3' },
  { local: 'music/nature-sounds/thunderstorm.mp3', remote: 'audio/music/nature-sounds/thunderstorm.mp3' },
  { local: 'music/nature-sounds/train-journey.mp3', remote: 'audio/music/nature-sounds/train-journey.mp3' },
  { local: 'music/nature-sounds/water-drops.mp3', remote: 'audio/music/nature-sounds/water-drops.mp3' },

  // White noise
  { local: 'music/white-noise/air-conditioner.mp3', remote: 'audio/music/white-noise/air-conditioner.mp3' },
  { local: 'music/white-noise/airplane-cabin.mp3', remote: 'audio/music/white-noise/airplane-cabin.mp3' },
  { local: 'music/white-noise/brown-noise.mp3', remote: 'audio/music/white-noise/brown-noise.mp3' },
  { local: 'music/white-noise/electric-fan.mp3', remote: 'audio/music/white-noise/electric-fan.mp3' },
  { local: 'music/white-noise/grey-noise.mp3', remote: 'audio/music/white-noise/grey-noise.mp3' },
  { local: 'music/white-noise/pink-noise.mp3', remote: 'audio/music/white-noise/pink-noise.mp3' },
  { local: 'music/white-noise/white-noise.mp3', remote: 'audio/music/white-noise/white-noise.mp3' },

  // ========== SLEEP ==========
  // Bedtime stories
  { local: 'sleep/stories/midnight-crossing-chapter-1.mp3', remote: 'audio/sleep/stories/midnight-crossing-chapter-1.mp3' },
];

async function uploadFile(localPath, remotePath) {
  const fullLocalPath = path.join(audioDir, localPath);
  
  if (!fs.existsSync(fullLocalPath)) {
    console.log(`⚠️  Skipping (not found): ${localPath}`);
    return false;
  }

  try {
    await bucket.upload(fullLocalPath, {
      destination: remotePath,
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });
    console.log(`✅ Uploaded: ${remotePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting upload of all audio files to Firebase Storage...\n');
  console.log(`📁 Source directory: ${audioDir}`);
  console.log(`📦 Total files to upload: ${filesToUpload.length}\n`);
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const file of filesToUpload) {
    const result = await uploadFile(file.local, file.remote);
    if (result === true) {
      successCount++;
    } else if (result === false) {
      const fullPath = path.join(audioDir, file.local);
      if (!fs.existsSync(fullPath)) {
        skipCount++;
      } else {
        failCount++;
      }
    }
  }

  console.log('\n========================================');
  console.log('📊 Upload Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('========================================');
  
  if (successCount > 0) {
    console.log('\n🎉 Audio files are now available at:');
    console.log('   https://storage.googleapis.com/calmnest-e910e.firebasestorage.app/audio/...');
  }
}

main().catch(console.error);
