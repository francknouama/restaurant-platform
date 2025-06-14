# Performance Testing with k6

This directory contains performance tests for the Restaurant Platform backend services using [k6](https://k6.io/).

## Overview

The performance tests are designed to validate the system's behavior under various load conditions:
- **Smoke Tests**: Minimal load to verify system functionality
- **Load Tests**: Normal expected load
- **Stress Tests**: Beyond normal load to find breaking points
- **Spike Tests**: Sudden traffic increases

## Directory Structure

```
performance_tests/
├── lib/
│   └── config.js          # Common configuration and utilities
├── scripts/
│   ├── menu-service.js    # Menu service specific tests
│   └── order-service.js   # Order service specific tests
├── scenarios/
│   ├── full-workflow.js   # Complete user workflow tests
│   └── spike-test.js      # Spike load testing
└── results/               # Test results directory
```

## Prerequisites

1. Install k6:
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Windows (using Chocolatey)
   choco install k6
   ```

2. Ensure the backend services are running:
   ```bash
   cd ../
   go run cmd/server/main.go
   ```

## Running Tests

### Individual Service Tests

Test the Menu Service:
```bash
k6 run scripts/menu-service.js
```

Test the Order Service:
```bash
k6 run scripts/order-service.js
```

### Scenario Tests

Run complete workflow test (includes smoke, load, and stress tests):
```bash
k6 run scenarios/full-workflow.js
```

Run spike test:
```bash
k6 run scenarios/spike-test.js
```

### Custom Configuration

Override default settings:
```bash
# Use different base URL
k6 run -e BASE_URL=http://staging.example.com:8080 scripts/menu-service.js

# Run with specific VUs and duration
k6 run --vus 50 --duration 5m scripts/order-service.js

# Output results to JSON
k6 run --out json=results/test-results.json scripts/menu-service.js
```

## Test Scenarios

### Menu Service Tests
- Create Menu (20% of traffic)
- Get Menu by ID (40% of traffic)
- List Menus (30% of traffic)
- Update Menu Status (10% of traffic)

**Thresholds:**
- 95% of requests under 500ms
- 99% of requests under 1000ms
- Error rate under 10%

### Order Service Tests
- Create Order (40% of traffic)
- Get Order Details (30% of traffic)
- List Orders (20% of traffic)
- Update Order Status (10% of traffic)

**Thresholds:**
- 95% of requests under 600ms
- 99% of requests under 1200ms
- Error rate under 5%

### Full Workflow Test
Simulates a complete restaurant workflow:
1. Create a menu
2. Activate the menu
3. Create an order
4. Process order through status changes
5. Verify final order state

**Test Phases:**
- Smoke Test: 1 VU for 1 minute
- Load Test: Ramp to 10 VUs over 9 minutes
- Stress Test: Ramp to 100 VUs over 14 minutes

### Spike Test
Tests system behavior under sudden load increases:
- Baseline: 5 VUs
- Spike: 100 VUs
- Monitors performance degradation and error rates

## Understanding Results

k6 provides detailed metrics after each test run:

```
✓ http_req_duration..............: avg=123.45ms min=10ms med=100ms max=500ms p(90)=200ms p(95)=300ms
✓ http_req_failed................: 0.50% ✓ 25 ✗ 4975
✓ http_reqs......................: 5000 166.666667/s
```

Key metrics to monitor:
- **http_req_duration**: Response time percentiles
- **http_req_failed**: Percentage of failed requests
- **http_reqs**: Total requests and requests per second
- **errors**: Custom error rate metric
- **iterations**: Number of complete test iterations

## Advanced Usage

### Continuous Load Testing
Run tests continuously with results streaming:
```bash
k6 run --out influxdb=http://localhost:8086/k6 scripts/menu-service.js
```

### CI/CD Integration
Example GitHub Actions workflow:
```yaml
- name: Run k6 tests
  uses: grafana/k6-action@v0.3.1
  with:
    filename: performance_tests/scenarios/full-workflow.js
    cloud: false
```

### Custom Metrics
The tests include custom metrics for specific operations:
- `create_menu_duration`
- `get_menu_duration`
- `create_order_duration`
- `workflow_duration`
- `errors_during_spike`

## Best Practices

1. **Warm-up Period**: Tests include warm-up stages to avoid cold-start issues
2. **Think Time**: Realistic delays between requests (1-4 seconds)
3. **Data Cleanup**: Tests track created resources for potential cleanup
4. **Error Handling**: Graceful handling of failures with detailed checks
5. **Realistic Scenarios**: Traffic distribution based on expected user behavior

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure backend services are running
   - Check BASE_URL configuration

2. **High Error Rate**
   - Check database connections
   - Monitor system resources (CPU, memory)
   - Review service logs

3. **Slow Response Times**
   - Check for database query performance
   - Monitor network latency
   - Review service resource allocation

### Debug Mode
Run with verbose output:
```bash
k6 run --verbose scripts/menu-service.js
```

## Extending Tests

To add new test scenarios:

1. Create new script in `scripts/` or `scenarios/`
2. Import common configuration from `lib/config.js`
3. Define custom metrics and thresholds
4. Implement test logic with proper error handling
5. Add documentation for the new test

Example structure:
```javascript
import { BASE_URL, API_PREFIX, defaultOptions } from '../lib/config.js';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const customMetric = new Trend('custom_operation_duration');

export const options = {
    thresholds: {
        'errors': ['rate<0.1'],
        'custom_operation_duration': ['p(95)<500'],
    },
};

export default function() {
    // Test implementation
}
```