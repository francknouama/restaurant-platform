// Configuration for k6 performance tests

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
export const API_PREFIX = '/api/v1';

// Authentication headers if needed
export const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        // Add auth headers here if needed
    };
};

// Common HTTP options
export const defaultOptions = {
    headers: getHeaders(),
    timeout: '30s',
};

// Test data generators
export function generateMenuData() {
    const timestamp = Date.now();
    return {
        menu_name: `Performance Test Menu ${timestamp}`,
        categories: [
            {
                id: `cat_${timestamp}_1`,
                name: 'Appetizers',
                description: 'Start your meal right',
                items: [
                    {
                        id: `item_${timestamp}_1`,
                        name: 'Spring Rolls',
                        description: 'Crispy vegetable spring rolls',
                        price: 8.99,
                        available: true,
                        preparation_time: 10
                    },
                    {
                        id: `item_${timestamp}_2`,
                        name: 'Soup of the Day',
                        description: 'Chef\'s special soup',
                        price: 6.99,
                        available: true,
                        preparation_time: 5
                    }
                ]
            },
            {
                id: `cat_${timestamp}_2`,
                name: 'Main Courses',
                description: 'Hearty main dishes',
                items: [
                    {
                        id: `item_${timestamp}_3`,
                        name: 'Grilled Salmon',
                        description: 'Fresh Atlantic salmon with herbs',
                        price: 24.99,
                        available: true,
                        preparation_time: 20
                    },
                    {
                        id: `item_${timestamp}_4`,
                        name: 'Ribeye Steak',
                        description: 'Prime cut ribeye with sides',
                        price: 32.99,
                        available: true,
                        preparation_time: 25
                    }
                ]
            }
        ]
    };
}

export function generateOrderData(menuId) {
    const timestamp = Date.now();
    return {
        customer_name: `PerfTest Customer ${timestamp}`,
        customer_email: `perftest${timestamp}@example.com`,
        customer_phone: '555-0100',
        order_type: 'DINE_IN',
        table_number: Math.floor(Math.random() * 20) + 1,
        items: [
            {
                menu_item_id: `item_${menuId}_1`,
                quantity: 2,
                special_requests: 'No peanuts'
            },
            {
                menu_item_id: `item_${menuId}_3`,
                quantity: 1,
                special_requests: ''
            }
        ]
    };
}

// Response time thresholds (in milliseconds)
export const thresholds = {
    fast: 100,      // Under 100ms is fast
    acceptable: 500, // Under 500ms is acceptable
    slow: 1000      // Over 1000ms is slow
};

// Common load patterns
export const loadPatterns = {
    smoke: {
        vus: 1,
        duration: '1m',
    },
    load: {
        stages: [
            { duration: '2m', target: 10 },  // Ramp up to 10 users
            { duration: '5m', target: 10 },  // Stay at 10 users
            { duration: '2m', target: 0 },   // Ramp down to 0 users
        ],
    },
    stress: {
        stages: [
            { duration: '2m', target: 50 },   // Ramp up to 50 users
            { duration: '5m', target: 50 },   // Stay at 50 users
            { duration: '2m', target: 100 },  // Ramp up to 100 users
            { duration: '5m', target: 100 },  // Stay at 100 users
            { duration: '2m', target: 0 },    // Ramp down to 0 users
        ],
    },
    spike: {
        stages: [
            { duration: '10s', target: 5 },    // Baseline load
            { duration: '30s', target: 5 },    // Stay at baseline
            { duration: '10s', target: 100 },  // Spike to 100 users
            { duration: '1m', target: 100 },   // Stay at spike
            { duration: '10s', target: 5 },    // Back to baseline
            { duration: '30s', target: 5 },    // Stay at baseline
            { duration: '10s', target: 0 },    // Ramp down
        ],
    },
};