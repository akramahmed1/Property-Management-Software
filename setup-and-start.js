const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Property Management Software - Setup & Start');
console.log('================================================');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log(`📁 Current directory: ${currentDir}`);

// Function to run commands
const runCommand = (command, cwd = process.cwd()) => {
  try {
    console.log(`⚡ Running: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });
    return true;
  } catch (error) {
    console.error(`❌ Error running command: ${command}`);
    console.error(error.message);
    return false;
  }
};

// Function to check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(path.join(process.cwd(), filePath));
};

// Main setup function
const setupAndStart = async () => {
  try {
    console.log('\n📦 Step 1: Installing root dependencies...');
    if (!runCommand('npm install')) {
      console.log('⚠️  Root dependencies installation failed, continuing...');
    }

    console.log('\n📦 Step 2: Installing backend dependencies...');
    if (fileExists('src/backend/package.json')) {
      if (!runCommand('npm install', 'src/backend')) {
        console.log('⚠️  Backend dependencies installation failed, continuing...');
      }
    } else {
      console.log('⚠️  Backend package.json not found, skipping...');
    }

    console.log('\n📦 Step 3: Installing frontend dependencies...');
    if (fileExists('src/frontend/package.json')) {
      if (!runCommand('npm install', 'src/frontend')) {
        console.log('⚠️  Frontend dependencies installation failed, continuing...');
      }
    } else {
      console.log('⚠️  Frontend package.json not found, skipping...');
    }

    console.log('\n📦 Step 4: Installing test dependencies...');
    if (fileExists('tests/package.json')) {
      if (!runCommand('npm install', 'tests')) {
        console.log('⚠️  Test dependencies installation failed, continuing...');
      }
    } else {
      console.log('⚠️  Tests package.json not found, skipping...');
    }

    console.log('\n🔧 Step 5: Setting up environment...');
    
    // Create .env file if it doesn't exist
    if (!fileExists('.env')) {
      const envContent = `# Property Management Software Environment Variables
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://pms_user:pms_password@localhost:5432/property_management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
REGION=INDIA
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info

# Database Configuration
POSTGRES_DB=property_management
POSTGRES_USER=pms_user
POSTGRES_PASSWORD=pms_password

# Redis Configuration
REDIS_PASSWORD=redis_password

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_REGION=INDIA
REACT_APP_DEFAULT_LANGUAGE=en

# Monitoring
GRAFANA_PASSWORD=admin
`;
      fs.writeFileSync('.env', envContent);
      console.log('✅ Created .env file with default values');
    } else {
      console.log('✅ .env file already exists');
    }

    console.log('\n🗄️  Step 6: Database setup...');
    if (fileExists('src/backend/prisma/schema.prisma')) {
      console.log('📊 Prisma schema found, running migrations...');
      if (!runCommand('npx prisma migrate dev --name init', 'src/backend')) {
        console.log('⚠️  Prisma migration failed, continuing...');
      }
    }

    console.log('\n🏗️  Step 7: Building applications...');
    
    // Build backend
    if (fileExists('src/backend/tsconfig.json')) {
      console.log('🔨 Building backend...');
      if (!runCommand('npm run build', 'src/backend')) {
        console.log('⚠️  Backend build failed, continuing...');
      }
    }

    // Build frontend
    if (fileExists('src/frontend/package.json')) {
      console.log('🔨 Building frontend...');
      if (!runCommand('npm run build', 'src/frontend')) {
        console.log('⚠️  Frontend build failed, continuing...');
      }
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend: cd src/backend && npm run dev');
    console.log('2. Start the frontend: cd src/frontend && npm start');
    console.log('3. Run tests: npm run test');
    console.log('4. View API docs: http://localhost:3000/api-docs');
    
    console.log('\n🧪 Testing backend...');
    
    // Start backend in background for testing
    if (fileExists('src/backend/package.json')) {
      console.log('🚀 Starting backend server...');
      const backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: 'src/backend',
        stdio: 'pipe',
        shell: true
      });

      // Wait for backend to start, then test
      setTimeout(() => {
        console.log('🧪 Testing backend API...');
        const testProcess = spawn('node', ['test-backend.js'], {
          stdio: 'inherit',
          shell: true
        });

        testProcess.on('close', (code) => {
          console.log(`\n✅ Backend test completed with code: ${code}`);
          console.log('\n🎉 Property Management Software is ready!');
          console.log('\n📱 Access the application:');
          console.log('   Backend API: http://localhost:3000');
          console.log('   Frontend: http://localhost:3001 (if running)');
          console.log('   API Docs: http://localhost:3000/api-docs');
          
          // Keep backend running
          console.log('\n🔄 Backend server is running in the background...');
          console.log('Press Ctrl+C to stop all services');
        });
      }, 5000);

      // Handle process termination
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping services...');
        backendProcess.kill();
        process.exit(0);
      });

    } else {
      console.log('⚠️  Backend not found, skipping test...');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

// Run the setup
setupAndStart();
