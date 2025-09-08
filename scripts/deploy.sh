#!/bin/bash

# Production deployment script for Money Tracker
# Usage: ./scripts/deploy.sh [environment]

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
PROJECT_NAME="money-tracker"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Color codes for output
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed (optional for containerized deployment)"
    fi
    
    print_success "Dependencies check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --only=production
    print_success "Dependencies installed"
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build:prod
    print_success "Application built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if npm run test:coverage; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, continuing deployment..."
    fi
}

# Create necessary directories
setup_directories() {
    print_status "Setting up directories..."
    mkdir -p logs
    mkdir -p backups
    print_success "Directories created"
}

# Backup existing deployment (if exists)
backup_deployment() {
    if [ -d "build" ]; then
        print_status "Creating backup of existing deployment..."
        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p backups
        cp -r build "backups/$BACKUP_NAME"
        print_success "Backup created: backups/$BACKUP_NAME"
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for server to start
    sleep 5
    
    if curl -f http://localhost:4040/api/health > /dev/null 2>&1; then
        print_success "Health check passed"
        return 0
    else
        print_error "Health check failed"
        return 1
    fi
}

# Docker deployment
deploy_with_docker() {
    print_status "Deploying with Docker..."
    
    # Build Docker image
    npm run docker:build
    
    # Stop existing containers
    docker-compose down || true
    
    # Start new deployment
    npm run docker:up
    
    # Wait and perform health check
    print_status "Waiting for containers to start..."
    sleep 30
    
    if health_check; then
        print_success "Docker deployment successful"
    else
        print_error "Docker deployment failed"
        exit 1
    fi
}

# Native deployment (without Docker)
deploy_native() {
    print_status "Starting native deployment..."
    
    # Kill existing process if running
    if pgrep -f "node api/index.js" > /dev/null; then
        print_status "Stopping existing server..."
        pkill -f "node api/index.js" || true
        sleep 2
    fi
    
    # Start the server in background
    nohup npm run start:prod > logs/deployment.log 2>&1 &
    
    # Store PID
    echo $! > money-tracker.pid
    
    if health_check; then
        print_success "Native deployment successful"
    else
        print_error "Native deployment failed"
        exit 1
    fi
}

# Main deployment logic
main() {
    print_status "Starting deployment process..."
    
    check_dependencies
    setup_directories
    backup_deployment
    install_dependencies
    run_tests
    build_application
    
    case $ENVIRONMENT in
        "docker")
            deploy_with_docker
            ;;
        "production"|"staging")
            deploy_native
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            print_status "Available environments: production, staging, docker"
            exit 1
            ;;
    esac
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Application is running at: http://localhost:4040"
    print_status "API health check: http://localhost:4040/api/health"
    print_status ""
    print_status "Useful commands:"
    print_status "  - View logs: npm run logs:view"
    print_status "  - View error logs: npm run logs:error"
    print_status "  - Stop application: ./scripts/stop.sh"
    print_status "  - Health check: npm run health-check"
}

# Run main function
main "$@"
