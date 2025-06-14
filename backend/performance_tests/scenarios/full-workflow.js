import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { 
    BASE_URL, 
    API_PREFIX, 
    defaultOptions, 
    generateMenuData,
    generateOrderData,
    loadPatterns
} from '../lib/config.js';

// Custom metrics
const errorRate = new Rate('workflow_errors');
const workflowDuration = new Trend('workflow_duration');
const successfulWorkflows = new Counter('successful_workflows');

// Test scenarios
export const options = {
    scenarios: {
        smoke_test: {
            executor: 'constant-vus',
            vus: 1,
            duration: '1m',
            tags: { test_type: 'smoke' },
            exec: 'smokeTest',
        },
        load_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: loadPatterns.load.stages,
            gracefulRampDown: '30s',
            tags: { test_type: 'load' },
            exec: 'loadTest',
            startTime: '2m', // Start after smoke test
        },
        stress_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: loadPatterns.stress.stages,
            gracefulRampDown: '1m',
            tags: { test_type: 'stress' },
            exec: 'stressTest',
            startTime: '12m', // Start after load test
        },
    },
    thresholds: {
        http_req_duration: {
            'p(95)<1000': ['test_type:smoke'],
            'p(95)<1500': ['test_type:load'],
            'p(95)<2000': ['test_type:stress'],
        },
        workflow_errors: ['rate<0.1'],
        http_req_failed: ['rate<0.1'],
    },
};

// Complete restaurant workflow
function completeWorkflow() {
    const workflowStart = new Date();
    let success = true;
    
    group('Complete Restaurant Workflow', () => {
        let menuId, orderId;
        
        // Step 1: Create a new menu
        group('Create Menu', () => {
            const menuData = generateMenuData();
            const res = http.post(
                `${BASE_URL}${API_PREFIX}/menus`,
                JSON.stringify(menuData),
                defaultOptions
            );
            
            success = check(res, {
                'menu created': (r) => r.status === 201,
            });
            
            if (res.status === 201) {
                const menu = JSON.parse(res.body);
                menuId = menu.menu_id;
            }
        });
        
        if (!menuId) {
            errorRate.add(1);
            return;
        }
        
        sleep(1);
        
        // Step 2: Activate the menu
        group('Activate Menu', () => {
            const res = http.patch(
                `${BASE_URL}${API_PREFIX}/menus/${menuId}/status`,
                JSON.stringify({ is_active: true }),
                defaultOptions
            );
            
            success = success && check(res, {
                'menu activated': (r) => r.status === 200,
            });
        });
        
        sleep(1);
        
        // Step 3: Create an order
        group('Create Order', () => {
            const orderData = generateOrderData(menuId);
            const res = http.post(
                `${BASE_URL}${API_PREFIX}/orders`,
                JSON.stringify(orderData),
                defaultOptions
            );
            
            success = success && check(res, {
                'order created': (r) => r.status === 201,
            });
            
            if (res.status === 201) {
                const order = JSON.parse(res.body);
                orderId = order.order_id;
            }
        });
        
        if (!orderId) {
            errorRate.add(1);
            return;
        }
        
        sleep(2);
        
        // Step 4: Process order through status workflow
        const statusFlow = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];
        
        for (const status of statusFlow) {
            group(`Update Order Status to ${status}`, () => {
                const res = http.patch(
                    `${BASE_URL}${API_PREFIX}/orders/${orderId}/status`,
                    JSON.stringify({ status }),
                    defaultOptions
                );
                
                success = success && check(res, {
                    [`order status updated to ${status}`]: (r) => r.status === 200,
                });
            });
            
            // Simulate processing time between status changes
            sleep(Math.random() * 3 + 2); // 2-5 seconds
        }
        
        // Step 5: Verify final order state
        group('Verify Final Order', () => {
            const res = http.get(
                `${BASE_URL}${API_PREFIX}/orders/${orderId}`,
                defaultOptions
            );
            
            success = success && check(res, {
                'order retrieved': (r) => r.status === 200,
                'order completed': (r) => {
                    try {
                        const order = JSON.parse(r.body);
                        return order.status === 'COMPLETED';
                    } catch {
                        return false;
                    }
                },
            });
        });
    });
    
    const workflowEnd = new Date();
    workflowDuration.add(workflowEnd - workflowStart);
    
    if (success) {
        successfulWorkflows.add(1);
    }
    errorRate.add(!success ? 1 : 0);
}

// Test functions for different scenarios
export function smokeTest() {
    completeWorkflow();
    sleep(5);
}

export function loadTest() {
    completeWorkflow();
    sleep(Math.random() * 5 + 3); // 3-8 seconds between workflows
}

export function stressTest() {
    completeWorkflow();
    sleep(Math.random() * 2 + 1); // 1-3 seconds between workflows
}

export function handleSummary(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    return {
        [`results/summary-${timestamp}.json`]: JSON.stringify(data, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

// Helper function for text summary
function textSummary(data, options) {
    // Simple text summary implementation
    let summary = '\n=== Performance Test Summary ===\n\n';
    
    // Add scenario results
    if (data.root_group && data.root_group.groups) {
        summary += 'Scenarios:\n';
        for (const [name, scenario] of Object.entries(data.root_group.groups)) {
            summary += `  ${name}: ${scenario.checks ? scenario.checks.passes : 0} passed\n`;
        }
    }
    
    // Add custom metrics
    if (data.metrics) {
        summary += '\nCustom Metrics:\n';
        if (data.metrics.workflow_duration) {
            summary += `  Workflow Duration (p95): ${data.metrics.workflow_duration.values.p95}ms\n`;
        }
        if (data.metrics.successful_workflows) {
            summary += `  Successful Workflows: ${data.metrics.successful_workflows.values.count}\n`;
        }
        if (data.metrics.workflow_errors) {
            summary += `  Error Rate: ${(data.metrics.workflow_errors.values.rate * 100).toFixed(2)}%\n`;
        }
    }
    
    return summary;
}