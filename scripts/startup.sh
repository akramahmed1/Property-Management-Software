#!/bin/bash

# Property Management Software - Complete Startup Script
# This script sets up and runs the entire application locally

set -e

echo "🚀 Property Management Software - Complete Startup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Database will need to be set up manually."
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. Database will need to be set up manually."
        return 1
    fi
    
    print_success "Docker and Docker Compose are installed"
    return 0
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        print_status "Installing root dependencies..."
        npm install
    fi
    
    # Install backend dependencies
    if [ -d "src/backend" ]; then
        print_status "Installing backend dependencies..."
        cd src/backend
        npm install
        cd ../..
    fi
    
    # Install frontend dependencies
    if [ -d "src/frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd src/frontend
        npm install
        cd ../..
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "src/backend/.env" ]; then
        print_status "Creating backend environment file..."
        cat > src/backend/.env << EOF
# Database
DATABASE_URL="postgresql://property_user:password@localhost:5432/property_management"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"

# Encryption
ENCRYPTION_KEY="your-encryption-key-32-chars-long"

# Payment Gateways
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# SMS
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Environment
NODE_ENV="development"
PORT="3000"
EOF
        print_success "Backend environment file created"
    else
        print_warning "Backend environment file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "src/frontend/.env" ]; then
        print_status "Creating frontend environment file..."
        cat > src/frontend/.env << EOF
REACT_APP_API_URL="http://localhost:3000/api"
REACT_APP_WS_URL="ws://localhost:3000"
REACT_APP_ENVIRONMENT="development"
EOF
        print_success "Frontend environment file created"
    else
        print_warning "Frontend environment file already exists"
    fi
}

# Start database services
start_database() {
    if check_docker; then
        print_status "Starting database services with Docker..."
        
        # Start PostgreSQL and Redis
        docker-compose up -d postgres redis
        
        # Wait for services to be ready
        print_status "Waiting for database services to be ready..."
        sleep 10
        
        # Check if services are running
        if docker-compose ps | grep -q "postgres.*Up"; then
            print_success "PostgreSQL is running"
        else
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        
        if docker-compose ps | grep -q "redis.*Up"; then
            print_success "Redis is running"
        else
            print_error "Redis failed to start"
            exit 1
        fi
    else
        print_warning "Docker not available. Please ensure PostgreSQL and Redis are running manually."
        print_status "PostgreSQL should be running on localhost:5432"
        print_status "Redis should be running on localhost:6379"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ -d "src/backend" ]; then
        cd src/backend
        
        # Generate Prisma client
        print_status "Generating Prisma client..."
        npx prisma generate
        
        # Run database migrations
        print_status "Running database migrations..."
        npx prisma migrate dev --name init
        
        # Seed the database
        print_status "Seeding the database..."
        node ../../scripts/test-setup.js
        
        cd ../..
        print_success "Database setup completed"
    else
        print_error "Backend directory not found"
        exit 1
    fi
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."
    
    if [ -d "src/backend" ]; then
        cd src/backend
        
        # Start backend in background
        npm run dev &
        BACKEND_PID=$!
        
        # Wait for backend to start
        print_status "Waiting for backend server to start..."
        sleep 10
        
        # Check if backend is running
        if curl -s http://localhost:3000/health > /dev/null; then
            print_success "Backend server is running on http://localhost:3000"
        else
            print_error "Backend server failed to start"
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
        
        cd ../..
    else
        print_error "Backend directory not found"
        exit 1
    fi
}

# Start frontend server
start_frontend() {
    print_status "Starting frontend server..."
    
    if [ -d "src/frontend" ]; then
        cd src/frontend
        
        # Start frontend in background
        npm start &
        FRONTEND_PID=$!
        
        # Wait for frontend to start
        print_status "Waiting for frontend server to start..."
        sleep 15
        
        # Check if frontend is running
        if curl -s http://localhost:3000 > /dev/null; then
            print_success "Frontend server is running on http://localhost:3000"
        else
            print_error "Frontend server failed to start"
            kill $FRONTEND_PID 2>/dev/null || true
            exit 1
        fi
        
        cd ../..
    else
        print_error "Frontend directory not found"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running comprehensive tests..."
    
    # Run local tests
    print_status "Running local tests..."
    node scripts/local-testing.js
    
    # Run E2E tests
    print_status "Running E2E tests..."
    node scripts/e2e-testing.js
    
    # Run demo scenarios
    print_status "Running demo scenarios..."
    node scripts/demo-scenarios.js
    
    print_success "All tests completed"
}

# Main function
main() {
    echo "Starting Property Management Software setup..."
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    check_docker
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_environment
    
    # Start database
    start_database
    
    # Setup database
    setup_database
    
    # Start backend
    start_backend
    
    # Start frontend
    start_frontend
    
    # Run tests
    run_tests
    
    echo ""
    echo "🎉 Property Management Software is now running!"
    echo "================================================"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:3000/api"
    echo "API Documentation: http://localhost:3000/api-docs"
    echo ""
    echo "Test Credentials:"
    echo "Admin: admin@property.com / password123"
    echo "Manager: manager@property.com / password123"
    echo "Agent: agent@property.com / password123"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for user to stop
    trap 'echo ""; print_status "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; docker-compose down 2>/dev/null || true; print_success "Services stopped"; exit 0' INT
    wait
}

# Run main function
main "$@"
