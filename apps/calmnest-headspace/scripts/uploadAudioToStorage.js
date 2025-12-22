/**
 * Upload audio files to Firebase Storage
 * 
 * Run with: node scripts/uploadAudioToStorage.js
 * 
 * Prerequisites:
 * - Firebase CLI installed and logged in
 * - Firebase project configured
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with service account
// You'll need to download your service account key from Firebase Console
// and save it as serviceAccountKey.json in the project root
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

// Define files to upload - all sleep sounds from Pixabay
const filesToUpload = [
  // Sleep ambient sounds
  { local: 'sleep/ambient_dreamer.mp3', remote: 'audio/sleep/ambient_dreamer.mp3' },
  { local: 'sleep/autumn_fire_water.mp3', remote: 'audio/sleep/autumn_fire_water.mp3' },
  { local: 'sleep/brook_stream.mp3', remote: 'audio/sleep/brook_stream.mp3' },
  { local: 'sleep/cat_purring.mp3', remote: 'audio/sleep/cat_purring.mp3' },
  { local: 'sleep/cat_purring_2.mp3', remote: 'audio/sleep/cat_purring_2.mp3' },
  { local: 'sleep/cave_ambience.mp3', remote: 'audio/sleep/cave_ambience.mp3' },
  { local: 'sleep/fireplace_burning.mp3', remote: 'audio/sleep/fireplace_burning.mp3' },
  { local: 'sleep/fireplace_living_room.mp3', remote: 'audio/sleep/fireplace_living_room.mp3' },
  { local: 'sleep/forest_fire_river.mp3', remote: 'audio/sleep/forest_fire_river.mp3' },
  { local: 'sleep/forest_fire_river_2.mp3', remote: 'audio/sleep/forest_fire_river_2.mp3' },
  { local: 'sleep/frogs_crickets_birds.mp3', remote: 'audio/sleep/frogs_crickets_birds.mp3' },
  { local: 'sleep/ocean_seagulls.mp3', remote: 'audio/sleep/ocean_seagulls.mp3' },
  { local: 'sleep/ocean_waves.mp3', remote: 'audio/sleep/ocean_waves.mp3' },
  { local: 'sleep/rain_city_london.mp3', remote: 'audio/sleep/rain_city_london.mp3' },
  { local: 'sleep/rain_fireplace.mp3', remote: 'audio/sleep/rain_fireplace.mp3' },
  { local: 'sleep/rain_forest.mp3', remote: 'audio/sleep/rain_forest.mp3' },
  { local: 'sleep/rain_window.mp3', remote: 'audio/sleep/rain_window.mp3' },
  { local: 'sleep/snow_crunch.mp3', remote: 'audio/sleep/snow_crunch.mp3' },
  { local: 'sleep/thunder_lightning.mp3', remote: 'audio/sleep/thunder_lightning.mp3' },
  { local: 'sleep/train_locomotive.mp3', remote: 'audio/sleep/train_locomotive.mp3' },
  { local: 'sleep/water_drops.mp3', remote: 'audio/sleep/water_drops.mp3' },
  { local: 'sleep/water_wisdom.mp3', remote: 'audio/sleep/water_wisdom.mp3' },
  { local: 'sleep/wind_desert.mp3', remote: 'audio/sleep/wind_desert.mp3' },
  { local: 'sleep/wind_mountains.mp3', remote: 'audio/sleep/wind_mountains.mp3' },
];

async function uploadFiles() {
  console.log('Starting upload to Firebase Storage...\n');
  
  const uploadedUrls = {};
  
  for (const file of filesToUpload) {
    const localPath = path.join(audioDir, file.local);
    
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Skipping ${file.local} (file not found)`);
      continue;
    }
    
    try {
      console.log(`📤 Uploading ${file.local}...`);
      
      await bucket.upload(localPath, {
        destination: file.remote,
        metadata: {
          contentType: 'audio/mpeg',
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
      });
      
      // Make the file publicly accessible
      await bucket.file(file.remote).makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.remote}`;
      
      // Generate key from filename
      const key = file.remote.replace('audio/', '').replace('/', '_').replace('.mp3', '');
      uploadedUrls[key] = publicUrl;
      
      console.log(`✅ Uploaded: ${file.remote}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file.local}:`, error.message);
    }
  }
  
  console.log('\n=== Upload Complete ===\n');
  console.log('Add these URLs to your audioFiles.ts:\n');
  console.log('export const audioFiles: Record<string, string> = {');
  for (const [key, url] of Object.entries(uploadedUrls)) {
    console.log(`  ${key}: '${url}',`);
  }
  console.log('};');
}

uploadFiles().catch(console.error);

