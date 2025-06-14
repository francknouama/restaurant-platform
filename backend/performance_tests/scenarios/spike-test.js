import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { 
    BASE_URL, 
    API_PREFIX, 
    defaultOptions,
    loadPatterns
} from '../lib/config.js';

// Custom metrics for spike behavior
const errorRateDuringSpike = new Rate('errors_during_spike');
const responseTimeDuringSpike = new Trend('response_time_during_spike');
const responseTimeBaseline = new Trend('response_time_baseline');

// Spike test configuration
export const options = {
    scenarios: {
        spike_scenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: loadPatterns.spike.stages,
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000'], // Allow higher latency during spikes
        http_req_failed: ['rate<0.2'],     // Allow up to 20% errors during spike
        errors_during_spike: ['rate<0.3'], // Spike-specific error threshold
    },
};

// Track when we're in spike phase
let inSpikePeriod = false;

export default function() {
    // Determine if we're in the spike period (roughly between 40s and 1m40s)
    const currentTime = new Date().getTime();
    const testRuntime = (__VU === 1) ? 0 : (currentTime - __ENV.K6_START_TIME);
    inSpikePeriod = testRuntime > 40000 && testRuntime < 100000;
    
    // Mix of read and write operations
    const operations = [
        { weight: 0.4, fn: listMenus },
        { weight: 0.3, fn: getRandomMenu },
        { weight: 0.2, fn: listOrders },
        { weight: 0.1, fn: createOrder },
    ];
    
    // Select operation based on weights
    const random = Math.random();
    let cumWeight = 0;
    
    for (const op of operations) {
        cumWeight += op.weight;
        if (random < cumWeight) {
            op.fn();
            break;
        }
    }
    
    // Shorter think time during spike to maintain pressure
    const thinkTime = inSpikePeriod ? Math.random() * 0.5 : Math.random() * 2 + 1;
    sleep(thinkTime);
}

function listMenus() {
    const start = new Date();
    const res = http.get(`${BASE_URL}${API_PREFIX}/menus`, defaultOptions);
    const duration = new Date() - start;
    
    const success = check(res, {
        'list menus status 200': (r) => r.status === 200,
    });
    
    // Track metrics based on spike period
    if (inSpikePeriod) {
        responseTimeDuringSpike.add(duration);
        errorRateDuringSpike.add(!success);
    } else {
        responseTimeBaseline.add(duration);
    }
}

function getRandomMenu() {
    // First get list of menus
    const listRes = http.get(`${BASE_URL}${API_PREFIX}/menus`, defaultOptions);
    
    if (listRes.status === 200) {
        const menus = JSON.parse(listRes.body);
        if (menus.length > 0) {
            const randomMenu = menus[Math.floor(Math.random() * menus.length)];
            const start = new Date();
            const res = http.get(
                `${BASE_URL}${API_PREFIX}/menus/${randomMenu.menu_id}`,
                defaultOptions
            );
            const duration = new Date() - start;
            
            const success = check(res, {
                'get menu status 200': (r) => r.status === 200,
            });
            
            if (inSpikePeriod) {
                responseTimeDuringSpike.add(duration);
                errorRateDuringSpike.add(!success);
            } else {
                responseTimeBaseline.add(duration);
            }
        }
    }
}

function listOrders() {
    const start = new Date();
    const res = http.get(`${BASE_URL}${API_PREFIX}/orders?limit=10`, defaultOptions);
    const duration = new Date() - start;
    
    const success = check(res, {
        'list orders status 200': (r) => r.status === 200,
    });
    
    if (inSpikePeriod) {
        responseTimeDuringSpike.add(duration);
        errorRateDuringSpike.add(!success);
    } else {
        responseTimeBaseline.add(duration);
    }
}

function createOrder() {
    // Get an active menu first
    const menuRes = http.get(`${BASE_URL}${API_PREFIX}/menus`, defaultOptions);
    
    if (menuRes.status === 200) {
        const menus = JSON.parse(menuRes.body);
        const activeMenu = menus.find(m => m.is_active);
        
        if (activeMenu && activeMenu.categories && activeMenu.categories.length > 0) {
            // Find available items
            const availableItems = [];
            activeMenu.categories.forEach(cat => {
                if (cat.items) {
                    cat.items.filter(item => item.available).forEach(item => {
                        availableItems.push(item);
                    });
                }
            });
            
            if (availableItems.length > 0) {
                const orderData = {
                    customer_name: `Spike Test User ${__VU}`,
                    customer_email: `spike${__VU}@test.com`,
                    customer_phone: '555-0100',
                    order_type: 'TAKEOUT',
                    items: [
                        {
                            menu_item_id: availableItems[0].id,
                            quantity: 1,
                            special_requests: ''
                        }
                    ]
                };
                
                const start = new Date();
                const res = http.post(
                    `${BASE_URL}${API_PREFIX}/orders`,
                    JSON.stringify(orderData),
                    defaultOptions
                );
                const duration = new Date() - start;
                
                const success = check(res, {
                    'create order status 201': (r) => r.status === 201,
                });
                
                if (inSpikePeriod) {
                    responseTimeDuringSpike.add(duration);
                    errorRateDuringSpike.add(!success);
                } else {
                    responseTimeBaseline.add(duration);
                }
            }
        }
    }
}

export function handleSummary(data) {
    console.log('\n=== Spike Test Analysis ===\n');
    
    if (data.metrics.response_time_baseline && data.metrics.response_time_during_spike) {
        const baselineP95 = data.metrics.response_time_baseline.values['p(95)'];
        const spikeP95 = data.metrics.response_time_during_spike.values['p(95)'];
        const degradation = ((spikeP95 - baselineP95) / baselineP95 * 100).toFixed(2);
        
        console.log(`Baseline Response Time (p95): ${baselineP95.toFixed(2)}ms`);
        console.log(`Spike Response Time (p95): ${spikeP95.toFixed(2)}ms`);
        console.log(`Performance Degradation: ${degradation}%`);
    }
    
    if (data.metrics.errors_during_spike) {
        const errorRate = (data.metrics.errors_during_spike.values.rate * 100).toFixed(2);
        console.log(`Error Rate During Spike: ${errorRate}%`);
    }
    
    return {
        'stdout': '', // Return empty string to suppress default output
    };
}