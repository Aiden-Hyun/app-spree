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

// Define files to upload
const filesToUpload = [
  // Meditation files
  { local: 'meditation/gratitude.mp3', remote: 'audio/meditation/gratitude.mp3' },
  { local: 'meditation/stress.mp3', remote: 'audio/meditation/stress.mp3' },
  { local: 'meditation/focus.mp3', remote: 'audio/meditation/focus.mp3' },
  { local: 'meditation/anxiety.mp3', remote: 'audio/meditation/anxiety.mp3' },
  { local: 'meditation/selfesteem.mp3', remote: 'audio/meditation/selfesteem.mp3' },
  { local: 'meditation/bodyscan.mp3', remote: 'audio/meditation/bodyscan.mp3' },
  { local: 'meditation/lovingkindness.mp3', remote: 'audio/meditation/lovingkindness.mp3' },
  
  // Sleep files
  { local: 'sleep/nature.mp3', remote: 'audio/sleep/nature.mp3' },
  { local: 'sleep/ocean.mp3', remote: 'audio/sleep/ocean.mp3' },
  { local: 'sleep/rain.mp3', remote: 'audio/sleep/rain.mp3' },
  { local: 'sleep/fantasy.mp3', remote: 'audio/sleep/fantasy.mp3' },
  
  // Breathing files
  { local: 'breathing/calm.mp3', remote: 'audio/breathing/calm.mp3' },
  { local: 'breathing/energy.mp3', remote: 'audio/breathing/energy.mp3' },
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

