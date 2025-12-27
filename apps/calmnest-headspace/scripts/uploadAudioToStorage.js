/**
 * Upload audio files to Firebase Storage
 * 
 * Usage:
 *   node scripts/uploadAudioToStorage.js          # Upload new files only
 *   node scripts/uploadAudioToStorage.js --force  # Re-upload all files
 * 
 * Prerequisites:
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
  { local: 'sleep/stories/the-shoemaker-and-the-elves.mp3', remote: 'audio/sleep/stories/the-shoemaker-and-the-elves.mp3' },

  // ========== MEDITATE ==========
  // Emergency meditations
  { local: 'meditate/emergency/panic-relief.mp3', remote: 'audio/meditate/emergency/panic-relief.mp3' },
  
  // Meditations
  { local: 'meditate/meditations/body-scan-delilah.mp3', remote: 'audio/meditate/meditations/body-scan-delilah.mp3' },

  // ========== ALBUMS ==========
  // Meditation Music album
  { local: 'music/albums/meditation-music/calm-reflection.mp3', remote: 'audio/music/albums/meditation-music/calm-reflection.mp3' },
  { local: 'music/albums/meditation-music/inner-peace.mp3', remote: 'audio/music/albums/meditation-music/inner-peace.mp3' },
  { local: 'music/albums/meditation-music/gentle-awakening.mp3', remote: 'audio/music/albums/meditation-music/gentle-awakening.mp3' },

  // ========== ASMR ==========
  { local: 'music/asmr/page-turning.mp3', remote: 'audio/music/asmr/page-turning.mp3' },
  { local: 'music/asmr/keyboard-typing.mp3', remote: 'audio/music/asmr/keyboard-typing.mp3' },
];

async function fileExistsInStorage(remotePath) {
  try {
    const [exists] = await bucket.file(remotePath).exists();
    return exists;
  } catch (error) {
    return false;
  }
}

async function uploadFile(localPath, remotePath, forceUpload = false) {
  const fullLocalPath = path.join(audioDir, localPath);
  
  if (!fs.existsSync(fullLocalPath)) {
    console.log(`⚠️  Skipping (not found locally): ${localPath}`);
    return 'not_found';
  }

  // Check if file already exists in storage
  if (!forceUpload) {
    const exists = await fileExistsInStorage(remotePath);
    if (exists) {
      console.log(`⏭️  Skipping (already exists): ${remotePath}`);
      return 'exists';
    }
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
    return 'uploaded';
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message);
    return 'failed';
  }
}

async function main() {
  const forceUpload = process.argv.includes('--force');
  
  console.log('🚀 Starting upload of audio files to Firebase Storage...\n');
  console.log(`📁 Source directory: ${audioDir}`);
  console.log(`📦 Total files: ${filesToUpload.length}`);
  console.log(`🔄 Mode: ${forceUpload ? 'Force re-upload all' : 'Upload new files only'}\n`);
  
  let uploadedCount = 0;
  let existsCount = 0;
  let notFoundCount = 0;
  let failCount = 0;

  for (const file of filesToUpload) {
    const result = await uploadFile(file.local, file.remote, forceUpload);
    switch (result) {
      case 'uploaded':
        uploadedCount++;
        break;
      case 'exists':
        existsCount++;
        break;
      case 'not_found':
        notFoundCount++;
        break;
      case 'failed':
        failCount++;
        break;
    }
  }

  console.log('\n========================================');
  console.log('📊 Upload Summary:');
  console.log(`   ✅ Uploaded: ${uploadedCount}`);
  console.log(`   ⏭️  Already exists: ${existsCount}`);
  console.log(`   ⚠️  Not found locally: ${notFoundCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('========================================');
  
  if (uploadedCount > 0) {
    console.log('\n🎉 New audio files uploaded!');
  } else if (existsCount > 0 && uploadedCount === 0) {
    console.log('\n✨ All files already exist in storage.');
  }
  
  console.log('\nTip: Use --force to re-upload all files');
}

main().catch(console.error);
