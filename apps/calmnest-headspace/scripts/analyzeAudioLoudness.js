/**
 * Analyze audio file loudness levels
 * Uses FFmpeg to measure integrated loudness (LUFS) of all audio files
 * 
 * Usage: node scripts/analyzeAudioLoudness.js [directory]
 * 
 * Prerequisites: FFmpeg must be installed (brew install ffmpeg)
 * 
 * Standard loudness targets:
 * - Podcasts/Voice: -16 LUFS
 * - Music streaming: -14 LUFS
 * - Meditation apps: -16 to -18 LUFS (slightly quieter is good)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGET_LUFS = -16; // Target loudness for meditation content
const TOLERANCE = 3; // Files within ±3 LUFS of target are considered "OK"

function findAllMp3Files(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAllMp3Files(fullPath, files);
    } else if (item.endsWith('.mp3')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeLoudness(filePath) {
  try {
    // Use FFmpeg's loudnorm filter to analyze loudness
    const cmd = `ffmpeg -i "${filePath}" -af loudnorm=print_format=json -f null - 2>&1`;
    const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    
    // Extract the JSON output from FFmpeg
    const jsonMatch = output.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
    if (jsonMatch) {
      const loudnessData = JSON.parse(jsonMatch[0]);
      return {
        integrated: parseFloat(loudnessData.input_i),
        truePeak: parseFloat(loudnessData.input_tp),
        lra: parseFloat(loudnessData.input_lra),
        threshold: parseFloat(loudnessData.input_thresh),
      };
    }
    return null;
  } catch (error) {
    console.error(`Error analyzing ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

async function main() {
  const audioDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'audio');
  
  console.log('🎵 Audio Loudness Analyzer\n');
  console.log(`📁 Scanning: ${audioDir}`);
  console.log(`🎯 Target loudness: ${TARGET_LUFS} LUFS (±${TOLERANCE} tolerance)\n`);
  
  // Check if FFmpeg is installed
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    console.error('❌ FFmpeg is not installed!');
    console.log('\nInstall with: brew install ffmpeg');
    process.exit(1);
  }
  
  const files = findAllMp3Files(audioDir);
  console.log(`📊 Found ${files.length} audio files\n`);
  console.log('Analyzing loudness levels...\n');
  console.log('='.repeat(80));
  
  const results = [];
  
  for (const file of files) {
    const relativePath = path.relative(audioDir, file);
    process.stdout.write(`Analyzing: ${relativePath.substring(0, 50).padEnd(50)}... `);
    
    const loudness = analyzeLoudness(file);
    if (loudness) {
      const diff = loudness.integrated - TARGET_LUFS;
      const status = Math.abs(diff) <= TOLERANCE ? '✅' : (diff > 0 ? '🔊 TOO LOUD' : '🔇 TOO QUIET');
      
      results.push({
        file: relativePath,
        ...loudness,
        diff,
        status,
        needsNormalization: Math.abs(diff) > TOLERANCE,
      });
      
      console.log(`${loudness.integrated.toFixed(1)} LUFS ${status}`);
    } else {
      console.log('❌ Failed');
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Sort by loudness difference
  results.sort((a, b) => a.integrated - b.integrated);
  
  // Summary
  const needsNormalization = results.filter(r => r.needsNormalization);
  const tooQuiet = results.filter(r => r.diff < -TOLERANCE);
  const tooLoud = results.filter(r => r.diff > TOLERANCE);
  const ok = results.filter(r => !r.needsNormalization);
  
  console.log('\n📊 SUMMARY\n');
  console.log(`   ✅ OK (within ±${TOLERANCE} LUFS): ${ok.length} files`);
  console.log(`   🔇 Too quiet: ${tooQuiet.length} files`);
  console.log(`   🔊 Too loud: ${tooLoud.length} files`);
  
  if (needsNormalization.length > 0) {
    console.log('\n⚠️  FILES NEEDING NORMALIZATION:\n');
    
    if (tooQuiet.length > 0) {
      console.log('🔇 Too Quiet (need volume boost):');
      tooQuiet.forEach(r => {
        console.log(`   ${r.integrated.toFixed(1)} LUFS (${r.diff.toFixed(1)}) - ${r.file}`);
      });
    }
    
    if (tooLoud.length > 0) {
      console.log('\n🔊 Too Loud (need volume reduction):');
      tooLoud.forEach(r => {
        console.log(`   ${r.integrated.toFixed(1)} LUFS (+${r.diff.toFixed(1)}) - ${r.file}`);
      });
    }
    
    console.log('\n💡 To normalize these files, run:');
    console.log('   node scripts/normalizeAudio.js');
  } else {
    console.log('\n🎉 All files are within acceptable loudness range!');
  }
  
  // Loudness range statistics
  if (results.length > 0) {
    const loudest = results[results.length - 1];
    const quietest = results[0];
    const range = loudest.integrated - quietest.integrated;
    
    console.log('\n📈 LOUDNESS RANGE:');
    console.log(`   Quietest: ${quietest.integrated.toFixed(1)} LUFS - ${quietest.file}`);
    console.log(`   Loudest:  ${loudest.integrated.toFixed(1)} LUFS - ${loudest.file}`);
    console.log(`   Range:    ${range.toFixed(1)} LUFS`);
    
    if (range > 6) {
      console.log('\n⚠️  Large loudness range detected! Consider normalizing all files for consistency.');
    }
  }
}

main().catch(console.error);

