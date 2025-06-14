import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { 
    BASE_URL, 
    API_PREFIX, 
    defaultOptions, 
    generateOrderData,
    thresholds 
} from '../lib/config.js';

// Custom metrics
const errorRate = new Rate('errors');
const createOrderDuration = new Trend('create_order_duration');
const getOrderDuration = new Trend('get_order_duration');
const listOrdersDuration = new Trend('list_orders_duration');
const updateOrderStatusDuration = new Trend('update_order_status_duration');
const ordersCreated = new Counter('orders_created');
const ordersCompleted = new Counter('orders_completed');

// Test options
export const options = {
    scenarios: {
        order_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },  // Warm up
                { duration: '2m', target: 30 },   // Ramp to 30 users
                { duration: '3m', target: 30 },   // Stay at 30 users
                { duration: '1m', target: 50 },   // Spike to 50 users
                { duration: '2m', target: 50 },   // Stay at 50 users
                { duration: '1m', target: 0 },    // Ramp down
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<600', 'p(99)<1200'],  // 95% under 600ms
        http_req_failed: ['rate<0.05'],                   // Error rate under 5%
        errors: ['rate<0.05'],                            // Custom error rate under 5%
        create_order_duration: ['p(95)<400'],             // 95% of creates under 400ms
        get_order_duration: ['p(95)<150'],                // 95% of gets under 150ms
        list_orders_duration: ['p(95)<300'],              // 95% of lists under 300ms
        update_order_status_duration: ['p(95)<200'],      // 95% of updates under 200ms
    },
};

// Test data storage
let activeOrders = [];
const orderStatuses = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

export function setup() {
    // First, ensure we have an active menu
    const res = http.get(`${BASE_URL}${API_PREFIX}/menus`, defaultOptions);
    
    if (res.status === 200) {
        const menus = JSON.parse(res.body);
        if (menus.length > 0) {
            // Find an active menu
            const activeMenu = menus.find(m => m.is_active) || menus[0];
            return { menuId: activeMenu.menu_id };
        }
    }
    
    console.error('No menus available for order testing');
    return {};
}

export default function(data) {
    if (!data.menuId) {
        console.error('No menu available for testing');
        return;
    }

    // Scenario 1: Create Order (40% of traffic)
    const createOrderTest = () => {
        const orderData = generateOrderData(data.menuId);
        const startTime = new Date();
        
        const res = http.post(
            `${BASE_URL}${API_PREFIX}/orders`,
            JSON.stringify(orderData),
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        createOrderDuration.add(duration);
        
        const success = check(res, {
            'create order - status is 201': (r) => r.status === 201,
            'create order - has order_id': (r) => {
                try {
                    const order = JSON.parse(r.body);
                    return order.order_id !== undefined;
                } catch {
                    return false;
                }
            },
            'create order - has correct total': (r) => {
                try {
                    const order = JSON.parse(r.body);
                    return order.total_amount > 0;
                } catch {
                    return false;
                }
            },
            'create order - response time OK': (r) => duration < thresholds.acceptable,
        });
        
        errorRate.add(!success);
        
        if (res.status === 201) {
            const order = JSON.parse(res.body);
            activeOrders.push({
                id: order.order_id,
                status: order.status,
                createdAt: new Date()
            });
            ordersCreated.add(1);
            return order.order_id;
        }
        
        return null;
    };

    // Scenario 2: Get Order Details (30% of traffic)
    const getOrderTest = (orderId) => {
        const startTime = new Date();
        
        const res = http.get(
            `${BASE_URL}${API_PREFIX}/orders/${orderId}`,
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        getOrderDuration.add(duration);
        
        const success = check(res, {
            'get order - status is 200': (r) => r.status === 200,
            'get order - has complete data': (r) => {
                try {
                    const order = JSON.parse(r.body);
                    return order.order_id && order.status && order.items && order.total_amount;
                } catch {
                    return false;
                }
            },
            'get order - response time OK': (r) => duration < thresholds.fast,
        });
        
        errorRate.add(!success);
        
        return res.status === 200 ? JSON.parse(res.body) : null;
    };

    // Scenario 3: List Orders (20% of traffic)
    const listOrdersTest = () => {
        const startTime = new Date();
        
        // Test with different filters
        const filters = [
            '',  // No filter
            '?status=PREPARING',
            '?order_type=DINE_IN',
            '?limit=10'
        ];
        
        const filter = filters[Math.floor(Math.random() * filters.length)];
        const res = http.get(
            `${BASE_URL}${API_PREFIX}/orders${filter}`,
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        listOrdersDuration.add(duration);
        
        const success = check(res, {
            'list orders - status is 200': (r) => r.status === 200,
            'list orders - returns array': (r) => {
                try {
                    return Array.isArray(JSON.parse(r.body));
                } catch {
                    return false;
                }
            },
            'list orders - response time OK': (r) => duration < thresholds.acceptable,
        });
        
        errorRate.add(!success);
    };

    // Scenario 4: Update Order Status (10% of traffic)
    const updateOrderStatusTest = (orderId, currentStatus) => {
        // Determine next status in workflow
        let nextStatus;
        switch (currentStatus) {
            case 'CREATED':
                nextStatus = 'PAID';
                break;
            case 'PAID':
                nextStatus = 'PREPARING';
                break;
            case 'PREPARING':
                nextStatus = 'READY';
                break;
            case 'READY':
                nextStatus = 'COMPLETED';
                break;
            default:
                return; // Can't update further
        }
        
        const startTime = new Date();
        
        const res = http.patch(
            `${BASE_URL}${API_PREFIX}/orders/${orderId}/status`,
            JSON.stringify({ status: nextStatus }),
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        updateOrderStatusDuration.add(duration);
        
        const success = check(res, {
            'update status - status is 200': (r) => r.status === 200,
            'update status - response time OK': (r) => duration < thresholds.acceptable,
        });
        
        errorRate.add(!success);
        
        if (res.status === 200 && nextStatus === 'COMPLETED') {
            ordersCompleted.add(1);
            // Remove from active orders
            activeOrders = activeOrders.filter(o => o.id !== orderId);
        } else if (res.status === 200) {
            // Update status in active orders
            const order = activeOrders.find(o => o.id === orderId);
            if (order) {
                order.status = nextStatus;
            }
        }
    };

    // Execute test scenarios with realistic distribution
    const random = Math.random();
    
    if (random < 0.4) {
        // 40% - Create new order
        createOrderTest();
    } else if (random < 0.7) {
        // 30% - Get order details
        if (activeOrders.length > 0) {
            const order = activeOrders[Math.floor(Math.random() * activeOrders.length)];
            getOrderTest(order.id);
        }
    } else if (random < 0.9) {
        // 20% - List orders
        listOrdersTest();
    } else {
        // 10% - Update order status
        if (activeOrders.length > 0) {
            // Prefer older orders for status updates
            const eligibleOrders = activeOrders.filter(o => o.status !== 'COMPLETED');
            if (eligibleOrders.length > 0) {
                const order = eligibleOrders[0]; // Take oldest
                const currentOrder = getOrderTest(order.id);
                if (currentOrder) {
                    updateOrderStatusTest(order.id, currentOrder.status);
                }
            }
        }
    }
    
    // Simulate realistic user behavior with variable think time
    const thinkTime = Math.random() * 3 + 1; // 1-4 seconds
    sleep(thinkTime);
}

export function teardown(data) {
    console.log(`
Performance Test Summary:
- Orders Created: ${ordersCreated}
- Orders Completed: ${ordersCompleted}
- Active Orders Remaining: ${activeOrders.length}
    `);
}