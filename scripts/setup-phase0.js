#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 EasyApply Phase 0 Setup Script');
console.log('=====================================\n');

// Check if Node.js version is compatible
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    console.error('❌ Node.js 18+ is required. Current version:', nodeVersion);
    process.exit(1);
  }
  
  console.log('✅ Node.js version:', nodeVersion);
}

// Check if .env.local exists
function checkEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env.local not found. Please create it from .env.example');
    console.log('   Run: cp .env.example .env.local');
    console.log('   Then fill in your environment variables\n');
    return false;
  }
  
  console.log('✅ .env.local found');
  return true;
}

// Install dependencies
function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Generate Prisma client
function generatePrisma() {
  console.log('\n🗄️  Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    console.log('   Make sure DATABASE_URL is set in .env.local');
    process.exit(1);
  }
}

// Check database connection
function checkDatabase() {
  console.log('\n🔍 Checking database connection...');
  try {
    // This will be implemented when we have the database setup
    console.log('✅ Database connection check (implement when DB is ready)');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('   Make sure your DATABASE_URL is correct in .env.local');
  }
}

// Build the project
function buildProject() {
  console.log('\n🔨 Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Project builds successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run type check
function typeCheck() {
  console.log('\n🔍 Running TypeScript checks...');
  try {
    execSync('npm run typecheck', { stdio: 'inherit' });
    console.log('✅ TypeScript checks passed');
  } catch (error) {
    console.error('❌ TypeScript checks failed:', error.message);
    process.exit(1);
  }
}

// Check health endpoint
function checkHealthEndpoint() {
  console.log('\n🏥 Checking health endpoint...');
  try {
    const response = execSync('curl -s http://localhost:4000/api/health', { encoding: 'utf8' });
    const data = JSON.parse(response);
    
    if (data.ok) {
      console.log('✅ Health endpoint is working');
    } else {
      console.error('❌ Health endpoint returned error');
    }
  } catch (error) {
    console.log('⚠️  Health endpoint check skipped (server not running)');
    console.log('   Start the server with: npm run dev');
  }
}

// Main setup function
function main() {
  console.log('Starting Phase 0 setup...\n');
  
  checkNodeVersion();
  const envExists = checkEnvironment();
  installDependencies();
  generatePrisma();
  
  if (envExists) {
    checkDatabase();
  }
  
  typeCheck();
  buildProject();
  checkHealthEndpoint();
  
  console.log('\n🎉 Phase 0 setup completed!');
  console.log('\nNext steps:');
  console.log('1. Fill in your .env.local with real values');
  console.log('2. Set up your Supabase database');
  console.log('3. Run: npx prisma db push');
  console.log('4. Start development: npm run dev');
  console.log('5. Visit: http://localhost:4000');
  console.log('\nFor WordPress integration:');
  console.log('- Configure JWT authentication in WordPress');
  console.log('- Set up CORS origins in your .env.local');
  console.log('- Test the embed script on your WordPress site');
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { main };
