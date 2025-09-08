#!/bin/bash

# Setup script for Money Tracker
# This script helps with first-time project setup

set -e

echo "🚀 Welcome to Money Tracker Setup!"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[SETUP]${NC} $1"
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

# Check Node.js version
check_node_version() {
    print_status "Checking Node.js version..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        print_success "Node.js version $NODE_VERSION is compatible"
    else
        print_error "Node.js version $NODE_VERSION is not compatible. Please install Node.js v16 or higher."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_success "Environment file created from template"
        print_warning "Please edit .env file with your configuration before running the application"
    else
        print_status "Environment file already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p backups
    
    print_success "Directories created"
}

# Check MongoDB connection
check_mongodb() {
    print_status "Checking MongoDB availability..."
    
    # Try to connect to default MongoDB
    if mongosh --eval "db.runCommand('ping').ok" --quiet &> /dev/null; then
        print_success "MongoDB is running and accessible"
    elif docker ps | grep -q mongo; then
        print_success "MongoDB Docker container is running"
    else
        print_warning "MongoDB is not running locally"
        print_status "You can:"
        print_status "  1. Install and start MongoDB locally"
        print_status "  2. Use Docker: docker run -d -p 27017:27017 mongo:7.0"
        print_status "  3. Use MongoDB Atlas (cloud)"
        print_status "  4. Update MONGO_URL in .env file with your connection string"
    fi
}

# Run initial tests
run_tests() {
    print_status "Running initial tests..."
    
    if npm test -- --watchAll=false --coverage=false; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, but setup can continue"
    fi
}

# Display next steps
show_next_steps() {
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit the .env file with your configuration:"
    echo "   - Set your MongoDB connection string (MONGO_URL)"
    echo "   - Configure other environment variables as needed"
    echo ""
    echo "2. Start the application:"
    echo "   - Development mode: npm run dev"
    echo "   - Production mode: npm run start:prod"
    echo "   - With Docker: npm run docker:up"
    echo ""
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:3000 (development)"
    echo "   - API: http://localhost:4040/api"
    echo "   - Health Check: http://localhost:4040/api/health"
    echo ""
    echo "4. Useful commands:"
    echo "   - View logs: npm run logs:view"
    echo "   - Deploy: ./scripts/deploy.sh"
    echo "   - Stop: ./scripts/stop.sh"
    echo ""
    echo "For more information, check the README.md file."
}

# Main setup function
main() {
    print_status "Starting Money Tracker setup..."
    
    check_node_version
    install_dependencies
    create_directories
    setup_environment
    check_mongodb
    run_tests
    
    show_next_steps
}

# Run setup
main "$@"
