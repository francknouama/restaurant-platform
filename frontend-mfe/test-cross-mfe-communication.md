# Cross-MFE Communication Test Plan

## Overview
This document outlines how to test the cross-MFE communication system in the restaurant platform.

## Event Flow Architecture

### 1. Order Creation Flow
- **Orders MFE** → emits `ORDER_CREATED` → **Kitchen MFE** (receives and displays new order)
- **Orders MFE** → emits `ORDER_CREATED` → **Inventory MFE** (tracks consumption)

### 2. Kitchen Updates Flow
- **Kitchen MFE** → emits `KITCHEN_ORDER_UPDATE` → **Orders MFE** (updates order status)
- **Kitchen MFE** → emits `ORDER_STATUS_UPDATED` → **Dashboard** (shows real-time updates)

### 3. Inventory Alerts Flow
- **Inventory MFE** → emits `INVENTORY_LOW_STOCK` → **Dashboard** (shows notifications)
- **Inventory MFE** → emits `INVENTORY_STOCK_UPDATED` → **Kitchen MFE** (aware of stock levels)

### 4. Reservation Flow
- **Reservations MFE** → emits `RESERVATION_CREATED` → **Dashboard** (shows notification)
- **Reservations MFE** → emits `RESERVATION_UPDATED` → **Orders MFE** (table availability)

## Test Scenarios

### Test 1: Order to Kitchen Communication
1. Navigate to Orders MFE (`/orders/new`)
2. Create a new order
3. Navigate to Kitchen MFE (`/kitchen`)
4. Verify the new order appears in the kitchen queue
5. Check browser console for event logs

### Test 2: Kitchen to Orders Communication
1. Navigate to Kitchen MFE (`/kitchen`)
2. Update an order status (e.g., mark as "Preparing")
3. Navigate to Orders MFE (`/orders`)
4. Verify the order status is updated
5. Check browser console for event logs

### Test 3: Inventory Low Stock Alerts
1. Navigate to Inventory MFE (`/inventory`)
2. The dashboard will automatically emit low stock events for urgent items
3. Navigate to Dashboard (`/`)
4. Verify low stock notifications appear
5. Check the "Low Stock Items" metric updates

### Test 4: Reservation Notifications
1. Navigate to Reservations MFE (`/reservations/new`)
2. Create a new reservation
3. Navigate to Dashboard (`/`)
4. Verify reservation notification appears
5. Check "Recent Activity" section for the new reservation

## Console Logging

Each MFE logs events to the console with specific prefixes:
- `[EventBus]` - Event emission and registration
- `[Dashboard]` - Dashboard event handling
- `[Inventory MFE]` - Inventory event handling
- `[Kitchen MFE]` - Kitchen event handling
- `[Orders MFE]` - Orders event handling

## Event History

You can check the event history in the browser console:
```javascript
// In browser console
window.__RESTAURANT_EVENT_BUS__.getHistory()
```

## Verification Checklist

- [ ] Orders MFE emits ORDER_CREATED events
- [ ] Kitchen MFE receives ORDER_CREATED events
- [ ] Kitchen MFE emits ORDER_STATUS_UPDATED events
- [ ] Orders MFE receives ORDER_STATUS_UPDATED events
- [ ] Inventory MFE emits INVENTORY_LOW_STOCK events
- [ ] Dashboard receives and displays inventory alerts
- [ ] Reservations MFE emits RESERVATION_CREATED events
- [ ] Dashboard receives and displays reservation notifications
- [ ] All events appear in browser console with proper logging
- [ ] Event history is maintained and accessible

## Known Integration Points

1. **Menu Updates**: Menu MFE updates item availability → Orders MFE reflects changes
2. **Stock Consumption**: Order creation → Inventory tracks usage → Low stock alerts
3. **Table Management**: Reservations → Orders knows table availability
4. **Kitchen Capacity**: Kitchen queue status → Orders can limit new orders