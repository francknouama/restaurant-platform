import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { 
    BASE_URL, 
    API_PREFIX, 
    defaultOptions, 
    generateMenuData,
    thresholds 
} from '../lib/config.js';

// Custom metrics
const errorRate = new Rate('errors');
const createMenuDuration = new Trend('create_menu_duration');
const getMenuDuration = new Trend('get_menu_duration');
const listMenusDuration = new Trend('list_menus_duration');
const updateMenuDuration = new Trend('update_menu_duration');

// Test options
export const options = {
    scenarios: {
        menu_operations: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 5 },   // Warm up
                { duration: '1m', target: 20 },   // Ramp to 20 users
                { duration: '2m', target: 20 },   // Stay at 20 users
                { duration: '30s', target: 0 },   // Ramp down
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
        http_req_failed: ['rate<0.1'],                   // Error rate under 10%
        errors: ['rate<0.1'],                            // Custom error rate under 10%
        create_menu_duration: ['p(95)<300'],             // 95% of creates under 300ms
        get_menu_duration: ['p(95)<100'],                // 95% of gets under 100ms
        list_menus_duration: ['p(95)<200'],              // 95% of lists under 200ms
        update_menu_duration: ['p(95)<200'],             // 95% of updates under 200ms
    },
};

// Test data storage
let createdMenuIds = [];

export function setup() {
    // Create initial test data
    const menuData = generateMenuData();
    const res = http.post(
        `${BASE_URL}${API_PREFIX}/menus`,
        JSON.stringify(menuData),
        defaultOptions
    );
    
    if (res.status === 201) {
        const menu = JSON.parse(res.body);
        return { initialMenuId: menu.menu_id };
    }
    
    console.error('Setup failed:', res.status, res.body);
    return {};
}

export default function(data) {
    // Scenario 1: Create Menu
    const createMenuTest = () => {
        const menuData = generateMenuData();
        const startTime = new Date();
        
        const res = http.post(
            `${BASE_URL}${API_PREFIX}/menus`,
            JSON.stringify(menuData),
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        createMenuDuration.add(duration);
        
        const success = check(res, {
            'create menu - status is 201': (r) => r.status === 201,
            'create menu - has menu_id': (r) => JSON.parse(r.body).menu_id !== undefined,
            'create menu - response time OK': (r) => duration < thresholds.acceptable,
        });
        
        errorRate.add(!success);
        
        if (res.status === 201) {
            const menu = JSON.parse(res.body);
            createdMenuIds.push(menu.menu_id);
            return menu.menu_id;
        }
        
        return null;
    };

    // Scenario 2: Get Menu by ID
    const getMenuTest = (menuId) => {
        const startTime = new Date();
        
        const res = http.get(
            `${BASE_URL}${API_PREFIX}/menus/${menuId}`,
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        getMenuDuration.add(duration);
        
        const success = check(res, {
            'get menu - status is 200': (r) => r.status === 200,
            'get menu - has correct structure': (r) => {
                const menu = JSON.parse(r.body);
                return menu.menu_id && menu.menu_name && menu.categories;
            },
            'get menu - response time OK': (r) => duration < thresholds.fast,
        });
        
        errorRate.add(!success);
    };

    // Scenario 3: List Menus
    const listMenusTest = () => {
        const startTime = new Date();
        
        const res = http.get(
            `${BASE_URL}${API_PREFIX}/menus`,
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        listMenusDuration.add(duration);
        
        const success = check(res, {
            'list menus - status is 200': (r) => r.status === 200,
            'list menus - returns array': (r) => Array.isArray(JSON.parse(r.body)),
            'list menus - response time OK': (r) => duration < thresholds.acceptable,
        });
        
        errorRate.add(!success);
    };

    // Scenario 4: Update Menu Status
    const updateMenuTest = (menuId) => {
        const startTime = new Date();
        
        const res = http.patch(
            `${BASE_URL}${API_PREFIX}/menus/${menuId}/status`,
            JSON.stringify({ is_active: false }),
            defaultOptions
        );
        
        const duration = new Date() - startTime;
        updateMenuDuration.add(duration);
        
        const success = check(res, {
            'update menu - status is 200': (r) => r.status === 200,
            'update menu - response time OK': (r) => duration < thresholds.acceptable,
        });
        
        errorRate.add(!success);
    };

    // Execute test scenarios with weighted distribution
    const random = Math.random();
    
    if (random < 0.2) {
        // 20% - Create new menu
        createMenuTest();
    } else if (random < 0.6) {
        // 40% - Get menu (most common operation)
        const menuId = data.initialMenuId || createdMenuIds[Math.floor(Math.random() * createdMenuIds.length)];
        if (menuId) {
            getMenuTest(menuId);
        }
    } else if (random < 0.9) {
        // 30% - List menus
        listMenusTest();
    } else {
        // 10% - Update menu
        const menuId = data.initialMenuId || createdMenuIds[Math.floor(Math.random() * createdMenuIds.length)];
        if (menuId) {
            updateMenuTest(menuId);
        }
    }
    
    // Think time between requests
    sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
    // Clean up created test data
    // Note: In a real scenario, you might want to delete created menus
    console.log(`Test completed. Created ${createdMenuIds.length} menus during the test.`);
}