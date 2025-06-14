#!/bin/bash

# Performance Testing Runner Script
# This script helps run various k6 performance tests with proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${BASE_URL:-http://localhost:8080}"
RESULTS_DIR="results"

# Create results directory if it doesn't exist
mkdir -p "$RESULTS_DIR"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first."
        echo "Visit https://k6.io/docs/getting-started/installation/ for installation instructions."
        exit 1
    fi
    print_status "k6 is installed: $(k6 version)"
}

# Function to check if backend is running
check_backend() {
    print_status "Checking if backend is accessible at $BASE_URL..."
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/menus" | grep -q "200\|404"; then
        print_status "Backend is accessible"
    else
        print_error "Backend is not accessible at $BASE_URL"
        print_error "Please ensure the backend services are running"
        exit 1
    fi
}

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local result_file="$RESULTS_DIR/${test_name}_${timestamp}.json"
    
    print_status "Running $test_name..."
    print_status "Results will be saved to: $result_file"
    
    # Run k6 with JSON output
    if k6 run \
        -e BASE_URL="$BASE_URL" \
        --out json="$result_file" \
        "$test_file"; then
        print_status "$test_name completed successfully"
        
        # Generate HTML report if k6-reporter is available
        if command -v k6-reporter &> /dev/null; then
            k6-reporter "$result_file" -o "$RESULTS_DIR/${test_name}_${timestamp}.html"
            print_status "HTML report generated"
        fi
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Restaurant Platform - Performance Testing Suite"
    echo "=============================================="
    echo "Base URL: $BASE_URL"
    echo ""
    echo "Select a test to run:"
    echo "1) Menu Service Test"
    echo "2) Order Service Test"
    echo "3) Full Workflow Test (Smoke + Load + Stress)"
    echo "4) Spike Test"
    echo "5) Quick Smoke Test (1 VU, 30s)"
    echo "6) Custom Test"
    echo "7) Run All Tests"
    echo "0) Exit"
    echo ""
}

# Custom test configuration
run_custom_test() {
    local test_file
    local vus
    local duration
    
    echo "Available test files:"
    ls -1 scripts/*.js scenarios/*.js 2>/dev/null | cat -n
    echo ""
    read -p "Select test file number: " file_num
    test_file=$(ls -1 scripts/*.js scenarios/*.js 2>/dev/null | sed -n "${file_num}p")
    
    if [ -z "$test_file" ]; then
        print_error "Invalid selection"
        return 1
    fi
    
    read -p "Number of VUs (default: 10): " vus
    vus=${vus:-10}
    
    read -p "Duration (default: 1m): " duration
    duration=${duration:-1m}
    
    print_status "Running custom test: $test_file with $vus VUs for $duration"
    
    k6 run \
        -e BASE_URL="$BASE_URL" \
        --vus "$vus" \
        --duration "$duration" \
        "$test_file"
}

# Quick smoke test
run_smoke_test() {
    print_status "Running quick smoke test..."
    
    # Create a simple smoke test
    cat > /tmp/smoke_test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 1,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.1'],
    },
};

export default function() {
    const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';
    
    // Test menu endpoint
    let res = http.get(`${baseUrl}/api/v1/menus`);
    check(res, {
        'menus endpoint status is 200': (r) => r.status === 200,
    });
    
    // Test orders endpoint
    res = http.get(`${baseUrl}/api/v1/orders`);
    check(res, {
        'orders endpoint status is 200': (r) => r.status === 200,
    });
}
EOF
    
    k6 run -e BASE_URL="$BASE_URL" /tmp/smoke_test.js
    rm /tmp/smoke_test.js
}

# Main script
main() {
    check_k6
    check_backend
    
    while true; do
        show_menu
        read -p "Enter your choice: " choice
        
        case $choice in
            1)
                run_test "menu_service" "scripts/menu-service.js"
                ;;
            2)
                run_test "order_service" "scripts/order-service.js"
                ;;
            3)
                run_test "full_workflow" "scenarios/full-workflow.js"
                ;;
            4)
                run_test "spike_test" "scenarios/spike-test.js"
                ;;
            5)
                run_smoke_test
                ;;
            6)
                run_custom_test
                ;;
            7)
                print_status "Running all tests..."
                run_test "menu_service" "scripts/menu-service.js"
                run_test "order_service" "scripts/order-service.js"
                run_test "full_workflow" "scenarios/full-workflow.js"
                run_test "spike_test" "scenarios/spike-test.js"
                print_status "All tests completed"
                ;;
            0)
                print_status "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main