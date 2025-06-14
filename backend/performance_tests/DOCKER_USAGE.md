# Running k6 Performance Tests with Docker

This guide explains how to run the performance tests using Docker Compose and view results in Grafana.

## Quick Start

### 1. Start the Performance Testing Stack

```bash
# From the backend directory
make perf-setup
```

This starts:
- PostgreSQL (database)
- Redis (cache)
- InfluxDB (metrics storage)
- Grafana (visualization)
- Backend service

### 2. Run Tests

Choose the type of test you want to run:

```bash
# Quick smoke test (1 VU, 30s)
make perf-smoke

# Normal load test
make perf-load

# Stress test (high load)
make perf-stress

# Spike test (sudden load)
make perf-spike

# Run all tests
make perf-all
```

### 3. View Results

Open Grafana dashboard:
```bash
make perf-dashboard
```

Or navigate to: http://localhost:3001
- Username: `admin`
- Password: `admin123`

### 4. Clean Up

```bash
make perf-clean
```

## Using Docker Compose Directly

If you prefer to use docker-compose directly:

```bash
cd performance_tests

# Start all services
docker-compose -f docker-compose.perf.yml up -d

# Run a specific test
docker-compose -f docker-compose.perf.yml run --rm \
  -e TEST_SCRIPT=scripts/menu-service.js \
  k6

# Run with custom options
docker-compose -f docker-compose.perf.yml run --rm \
  k6 run --vus 50 --duration 5m \
  --out influxdb=http://influxdb:8086/k6 \
  /tests/scripts/order-service.js

# View logs
docker-compose -f docker-compose.perf.yml logs -f k6

# Stop everything
docker-compose -f docker-compose.perf.yml down -v
```

## Environment Variables

You can customize the tests with environment variables:

```bash
# Use different base URL
BASE_URL=http://staging.example.com:8080 make perf-load

# Select specific test script
TEST_SCRIPT=scenarios/spike-test.js docker-compose -f docker-compose.perf.yml run k6
```

## Viewing Results in Grafana

1. Access Grafana at http://localhost:3001
2. The k6 dashboard is pre-configured and shows:
   - Request rate (requests/second)
   - Response time percentiles (p95, p99)
   - Error rate
   - Virtual users
   - Custom metrics (create_menu_duration, etc.)

## Running in CI/CD

The performance tests are integrated with GitHub Actions:

### Manual Trigger
1. Go to Actions tab in GitHub
2. Select "Performance Tests"
3. Click "Run workflow"
4. Choose test type: smoke, load, stress, spike, or all

### Automatic Triggers
- **Pull Requests**: Runs smoke tests
- **Main branch push**: Runs load tests
- **Daily schedule**: Runs stress tests at 2 AM UTC

## Troubleshooting

### Backend not accessible
```bash
# Check if backend is healthy
docker-compose -f docker-compose.perf.yml ps
docker-compose -f docker-compose.perf.yml logs backend
```

### InfluxDB connection issues
```bash
# Verify InfluxDB is running
curl -i http://localhost:8086/ping
```

### Grafana not loading
```bash
# Check Grafana logs
docker-compose -f docker-compose.perf.yml logs grafana
```

### No data in Grafana
- Ensure tests have completed
- Check time range in Grafana (top right)
- Verify InfluxDB datasource is configured

## Advanced Usage

### Custom Load Patterns

Edit `lib/config.js` to add custom load patterns:

```javascript
export const loadPatterns = {
  custom: {
    stages: [
      { duration: '1m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '1m', target: 0 },
    ],
  },
};
```

### Export Results

```bash
# Export metrics from InfluxDB
docker-compose -f docker-compose.perf.yml exec influxdb \
  influx -database k6 -execute "SELECT * FROM http_req_duration" -format csv \
  > results/metrics.csv
```

### Persistent Data

To keep metrics data between runs, comment out the volume cleanup in `docker-compose.perf.yml`:

```yaml
volumes:
  influxdb-data:  # Data persists between runs
  grafana-data:   # Dashboards and settings persist
```