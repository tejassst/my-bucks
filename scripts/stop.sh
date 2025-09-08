#!/bin/bash

# Stop script for Money Tracker
# Usage: ./scripts/stop.sh [method]

METHOD=${1:-auto}

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Stop Docker containers
stop_docker() {
    print_status "Stopping Docker containers..."
    
    if docker-compose down; then
        print_success "Docker containers stopped successfully"
    else
        print_warning "Failed to stop Docker containers or no containers running"
    fi
}

# Stop native process
stop_native() {
    print_status "Stopping native process..."
    
    # Try to stop using PID file first
    if [ -f "mybucks.pid" ]; then
        PID=$(cat mybucks.pid)
        if kill -0 $PID 2>/dev/null; then
            print_status "Stopping process with PID: $PID"
            kill -TERM $PID
            sleep 5
            
            # Check if process is still running
            if kill -0 $PID 2>/dev/null; then
                print_warning "Process still running, forcing termination..."
                kill -KILL $PID
            fi
            
            rm -f mybucks.pid
            print_success "Process stopped successfully"
        else
            print_warning "PID file exists but process not running"
            rm -f mybucks.pid
        fi
    fi
    
    # Fallback: kill by process name
    if pgrep -f "node api/index.js" > /dev/null; then
        print_status "Stopping remaining node processes..."
        pkill -f "node api/index.js"
        sleep 2
        
        if pgrep -f "node api/index.js" > /dev/null; then
            print_warning "Force killing remaining processes..."
            pkill -9 -f "node api/index.js"
        fi
        
        print_success "All processes stopped"
    else
        print_status "No running processes found"
    fi
}

# Auto-detect and stop
stop_auto() {
    print_status "Auto-detecting deployment method..."
    
    # Check if Docker containers are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Docker containers detected"
        stop_docker
    fi
    
    # Check for native processes
    if pgrep -f "node api/index.js" > /dev/null || [ -f "mybucks.pid" ]; then
        print_status "Native process detected"
        stop_native
    fi
    
    if ! docker-compose ps | grep -q "Up" && ! pgrep -f "node api/index.js" > /dev/null; then
        print_success "No running instances found"
    fi
}

# Show status
show_status() {
    print_status "Checking application status..."
    
    # Check Docker containers
    if docker-compose ps | grep -q "Up"; then
        print_status "Docker containers are running:"
        docker-compose ps
    else
        print_status "No Docker containers running"
    fi
    
    # Check native processes
    if pgrep -f "node api/index.js" > /dev/null; then
        print_status "Native processes running:"
        pgrep -f "node api/index.js" | while read pid; do
            echo "  PID: $pid"
        done
    else
        print_status "No native processes running"
    fi
    
    # Check PID file
    if [ -f "mybucks.pid" ]; then
        PID=$(cat mybucks.pid)
        if kill -0 $PID 2>/dev/null; then
            print_status "PID file exists with active process: $PID"
        else
            print_warning "Stale PID file found (process not running)"
        fi
    fi
}

# Main function
main() {
    case $METHOD in
        "docker")
            stop_docker
            ;;
        "native")
            stop_native
            ;;
        "auto")
            stop_auto
            ;;
        "status")
            show_status
            ;;
        *)
            print_error "Unknown method: $METHOD"
            print_status "Available methods: auto, docker, native, status"
            exit 1
            ;;
    esac
    
    print_success "Stop operation completed"
}

# Run main function
main "$@"
