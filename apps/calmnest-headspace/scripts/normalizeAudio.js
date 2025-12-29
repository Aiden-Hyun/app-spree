/**
 * Normalize audio files to consistent loudness
 * Uses FFmpeg's loudnorm filter (EBU R128) for professional-quality normalization
 *
 * Usage: node scripts/normalizeAudio.js [--all] [--no-backup]
 * 
 * Options:
 *   --all       Normalize all files (not just those outside tolerance)
 *   --no-backup Skip creating backups
 *
 * Prerequisites: FFmpeg must be installed (brew install ffmpeg)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGET_LUFS = -16; // Target loudness for meditation content
const TOLERANCE = 3; // Files within ±3 LUFS of target are considered "OK"

// Files that need normalization (from analysis)
const filesToNormalize = [
  'music/asmr/keyboard-typing.mp3',
  'music/asmr/page-turning.mp3',
  'meditate/emergency/panic-relief.mp3',
  'music/nature-sounds/cozy-fireplace.mp3',
  'music/nature-sounds/forest-campfire.mp3',
  'music/nature-sounds/riverside-campfire.mp3',
  'music/nature-sounds/water-drops.mp3',
  'meditate/courses/10-minute-reset-session2.mp3',
  'meditate/courses/10-minute-reset-session1.mp3',
  'meditate/courses/foundational-series/a-place-to-rest.mp3',
  'meditate/courses/foundational-series/when-your-mind-wont-stop.mp3',
  'meditate/courses/foundational-series/youre-safe-right-now.mp3',
  'music/nature-sounds/night-wildlife.mp3',
  'meditate/emergency/478-breathing.mp3',
  'music/nature-sounds/cat-purring-soft.mp3',
  'music/nature-sounds/cat-purring.mp3',
  'music/white-noise/grey-noise.mp3',
];

function analyzeLoudness(filePath) {
  try {
    const cmd = `ffmpeg -i "${filePath}" -af loudnorm=print_format=json -f null - 2>&1`;
    const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    
    const jsonMatch = output.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        input_i: data.input_i,
        input_tp: data.input_tp,
        input_lra: data.input_lra,
        input_thresh: data.input_thresh,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error analyzing ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

function normalizeFile(inputPath, outputPath, loudnessData) {
  try {
    // Two-pass loudnorm for best quality
    const cmd = `ffmpeg -y -i "${inputPath}" -af loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:measured_I=${loudnessData.input_i}:measured_TP=${loudnessData.input_tp}:measured_LRA=${loudnessData.input_lra}:measured_thresh=${loudnessData.input_thresh}:offset=0:linear=true:print_format=summary -ar 44100 -b:a 192k "${outputPath}" 2>&1`;
    
    execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return true;
  } catch (error) {
    console.error(`Error normalizing:`, error.message);
    return false;
  }
}

async function main() {
  const audioDir = path.join(__dirname, '..', 'assets', 'audio');
  const backupDir = path.join(__dirname, '..', 'assets', 'audio-backup');
  const skipBackup = process.argv.includes('--no-backup');
  
  console.log('🎵 Audio Normalizer\n');
  console.log(`🎯 Target: ${TARGET_LUFS} LUFS`);
  console.log(`📁 Audio directory: ${audioDir}`);
  console.log(`📦 Files to process: ${filesToNormalize.length}\n`);

  // Check if FFmpeg is installed
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    console.error('❌ FFmpeg is not installed!');
    console.log('\nInstall with: brew install ffmpeg');
    process.exit(1);
  }

  // Create backup directory
  if (!skipBackup) {
    console.log('📂 Creating backup directory...');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
  }
  }
  
  let successCount = 0;
  let failCount = 0;
  
  console.log('\n' + '='.repeat(70));
  
  for (const relativePath of filesToNormalize) {
    const inputPath = path.join(audioDir, relativePath);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping (not found): ${relativePath}`);
      continue;
    }
    
    console.log(`\n📄 Processing: ${relativePath}`);
    
    // Step 1: Analyze current loudness
    process.stdout.write('   Analyzing... ');
    const loudnessData = analyzeLoudness(inputPath);
    if (!loudnessData) {
      console.log('❌ Failed');
      failCount++;
      continue;
    }
    console.log(`${loudnessData.input_i} LUFS`);
    
    // Step 2: Backup original
    if (!skipBackup) {
      const backupPath = path.join(backupDir, relativePath);
      const backupSubDir = path.dirname(backupPath);
      if (!fs.existsSync(backupSubDir)) {
        fs.mkdirSync(backupSubDir, { recursive: true });
      }
      fs.copyFileSync(inputPath, backupPath);
      console.log('   ✅ Backed up original');
    }
    
    // Step 3: Normalize to temp file
    const tempPath = inputPath + '.normalized.mp3';
    process.stdout.write(`   Normalizing to ${TARGET_LUFS} LUFS... `);
    
    const success = normalizeFile(inputPath, tempPath, loudnessData);
    
    if (success && fs.existsSync(tempPath)) {
      // Replace original with normalized version
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, inputPath);
      
      // Verify new loudness
      const newLoudness = analyzeLoudness(inputPath);
      if (newLoudness) {
        console.log(`✅ Done (now ${newLoudness.input_i} LUFS)`);
        successCount++;
      } else {
        console.log('✅ Done');
        successCount++;
      }
    } else {
      console.log('❌ Failed');
      failCount++;
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   ✅ Normalized: ${successCount} files`);
  console.log(`   ❌ Failed: ${failCount} files`);
  
  if (!skipBackup) {
    console.log(`\n💾 Backups saved to: ${backupDir}`);
  }
  
  if (successCount > 0) {
    console.log('\n🚀 Next step: Re-upload normalized files to Firebase Storage:');
    console.log('   node scripts/uploadAudioToStorage.js --force');
  }
}

main().catch(console.error);
