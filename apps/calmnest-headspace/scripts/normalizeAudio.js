/**
 * Audio Volume Normalization Script
 * Uses ffmpeg's loudnorm filter (EBU R128 standard)
 * Target: -16 LUFS (streaming standard)
 *
 * Usage: node scripts/normalizeAudio.js
 *
 * Prerequisites:
 *   brew install ffmpeg
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'assets', 'audio');
const TEMP_DIR = '/tmp/calmnest_audio_normalize';

// Find all MP3 files recursively
function findMp3Files(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findMp3Files(fullPath, files);
    } else if (item.endsWith('.mp3')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  console.log('🎵 Audio Volume Normalization Script');
  console.log('=====================================\n');

  // Check if ffmpeg is installed
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    console.log('✓ ffmpeg found\n');
  } catch {
    console.error('Error: ffmpeg is not installed');
    console.log('Install with: brew install ffmpeg');
    process.exit(1);
  }

  // Create temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Find all MP3 files
  const files = findMp3Files(AUDIO_DIR);
  console.log(`📁 Found ${files.length} MP3 files to normalize`);
  console.log(`📍 Audio directory: ${AUDIO_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = path.relative(AUDIO_DIR, file);
    const tempFile = path.join(TEMP_DIR, `temp_${i}.mp3`);

    console.log(`[${i + 1}/${files.length}] Processing: ${relativePath}`);

    try {
      // Run ffmpeg loudnorm
      execSync(
        `ffmpeg -y -i "${file}" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -b:a 192k "${tempFile}"`,
        { stdio: 'ignore' }
      );

      // Replace original with normalized version
      fs.copyFileSync(tempFile, file);
      fs.unlinkSync(tempFile);
      console.log('    ✓ Normalized');
      success++;
    } catch (err) {
      console.log('    ✗ Failed');
      failed++;
      // Clean up temp file if it exists
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  // Cleanup
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log('\n=====================================');
  console.log('📊 Normalization Complete!');
  console.log(`   ✓ Successful: ${success}`);
  console.log(`   ✗ Failed: ${failed}`);
  console.log("\nRun 'node scripts/uploadAudioToStorage.js --force' to re-upload");
}

main().catch(console.error);

