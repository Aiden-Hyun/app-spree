#!/usr/bin/env node

/**
 * TaskFlow Setup Checker
 * 
 * Run this to verify your environment is configured correctly
 * Usage: node check-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TaskFlow Setup Checker\n');
console.log('========================================\n');

let errors = 0;
let warnings = 0;

// Check 1: app.json exists
console.log('📱 Checking app.json...');
if (fs.existsSync('./app.json')) {
  try {
    const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
    if (appJson.expo?.name && appJson.expo?.slug) {
      console.log('   ✅ app.json is valid\n');
    } else {
      console.log('   ⚠️  app.json missing required fields\n');
      warnings++;
    }
  } catch (e) {
    console.log('   ❌ app.json has invalid JSON\n');
    errors++;
  }
} else {
  console.log('   ❌ app.json not found\n');
  errors++;
}

// Check 2: .env file exists
console.log('🔐 Checking .env file...');
if (fs.existsSync('./.env')) {
  const envContent = fs.readFileSync('./.env', 'utf8');
  
  // Check for required variables
  const hasUrl = envContent.includes('EXPO_PUBLIC_SUPABASE_URL=');
  const hasKey = envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=');
  
  // Check if they're filled in (not just present)
  const urlFilled = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=https:\/\//);
  const keyFilled = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ/);
  
  if (hasUrl && hasKey) {
    if (urlFilled && keyFilled) {
      console.log('   ✅ .env file configured\n');
    } else {
      console.log('   ⚠️  .env file exists but credentials look incomplete');
      console.log('      Make sure to add your real Supabase URL and key\n');
      warnings++;
    }
  } else {
    console.log('   ⚠️  .env file missing required variables');
    console.log('      Need: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY\n');
    warnings++;
  }
} else {
  console.log('   ❌ .env file not found');
  console.log('      Run: cp .env.example .env\n');
  errors++;
}

// Check 3: node_modules exists
console.log('📦 Checking dependencies...');
if (fs.existsSync('./node_modules')) {
  console.log('   ✅ Dependencies installed\n');
} else {
  console.log('   ❌ node_modules not found');
  console.log('      Run: pnpm install\n');
  errors++;
}

// Check 4: Critical dependencies in package.json
console.log('🔧 Checking package.json...');
if (fs.existsSync('./package.json')) {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const requiredDeps = ['expo', 'expo-router', 'react-native', '@supabase/supabase-js'];
  const missing = requiredDeps.filter(dep => !pkg.dependencies?.[dep]);
  
  if (missing.length === 0) {
    console.log('   ✅ All required dependencies present\n');
  } else {
    console.log(`   ⚠️  Missing dependencies: ${missing.join(', ')}`);
    console.log('      Run: pnpm install\n');
    warnings++;
  }
} else {
  console.log('   ❌ package.json not found\n');
  errors++;
}

// Check 5: Assets folder
console.log('🎨 Checking assets...');
if (fs.existsSync('./assets')) {
  const requiredAssets = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
  const existingAssets = fs.readdirSync('./assets').filter(f => f.endsWith('.png'));
  const missingAssets = requiredAssets.filter(a => !existingAssets.includes(a));
  
  if (missingAssets.length === 0) {
    console.log('   ✅ All required assets present\n');
  } else {
    console.log(`   ⚠️  Missing assets: ${missingAssets.join(', ')}`);
    console.log('      See: assets/ASSETS_README.md for instructions\n');
    warnings++;
  }
} else {
  console.log('   ⚠️  Assets folder not found (will be created automatically)\n');
  warnings++;
}

// Check 6: Supabase files
console.log('🗄️  Checking Supabase setup...');
if (fs.existsSync('./supabase/schema-complete.sql')) {
  console.log('   ✅ Database schema ready\n');
} else if (fs.existsSync('./supabase/schema.sql')) {
  console.log('   ⚠️  Using old schema.sql - recommend using schema-complete.sql instead\n');
  warnings++;
} else {
  console.log('   ❌ No database schema found\n');
  errors++;
}

// Check 7: TypeScript config
console.log('📘 Checking TypeScript...');
if (fs.existsSync('./tsconfig.json')) {
  console.log('   ✅ TypeScript configured\n');
} else {
  console.log('   ⚠️  tsconfig.json not found\n');
  warnings++;
}

// Summary
console.log('========================================\n');
console.log('📊 Summary:\n');

if (errors === 0 && warnings === 0) {
  console.log('🎉 Perfect! Your setup looks great!\n');
  console.log('Next steps:');
  console.log('  1. Create Supabase project: see supabase/SUPABASE_SETUP.md');
  console.log('  2. Add credentials to .env file');
  console.log('  3. Run: pnpm expo start');
  console.log('  4. Test the app!\n');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} critical issue${errors > 1 ? 's' : ''} found`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning${warnings > 1 ? 's' : ''} found`);
  }
  console.log('\nFix the issues above, then run this script again.\n');
  console.log('📖 For detailed setup instructions, see:');
  console.log('   - SETUP_GUIDE.md (complete guide)');
  console.log('   - supabase/SUPABASE_SETUP.md (Supabase setup)\n');
}

process.exit(errors > 0 ? 1 : 0);

