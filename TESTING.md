# Restaurant Platform Testing Guide

This guide helps you quickly bootstrap and test the Restaurant Platform with both backend and frontend components.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Ports 3000, 5432, 6379, and 8080 available
- `curl` and `jq` (optional, for API testing)

### 1. Bootstrap the Platform

```bash
# Make scripts executable (if not already done)
chmod +x scripts/*.sh

# Start everything
./scripts/bootstrap.sh
```

This will:
- Start PostgreSQL database with migrations
- Start Redis cache
- Build and start the backend API server
- Build and start the frontend application
- Run health checks on all services

### 2. Test the API

```bash
# Run comprehensive API tests
./scripts/test-api.sh
```

This will create sample data and test all endpoints:
- Menu categories, menus, and menu items
- Orders and kitchen workflow
- Reservations
- Inventory management

### 3. Test the Frontend

Open your browser and navigate to:
- **Main Application**: http://localhost:3000
- **Menu Management**: http://localhost:3000/menus

## 🔧 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React micro-frontend shell app |
| Backend API | http://localhost:8080 | Combined REST API |
| Health Check | http://localhost:8080/health | Service status |
| API Documentation | http://localhost:8080/api | Available endpoints |
| PostgreSQL | localhost:5432 | Database (user: postgres, pass: postgres123) |
| Redis | localhost:6379 | Cache and message broker |

## 📋 Testing Scenarios

### Menu Management Testing

1. **Navigate to Menu Management**
   ```
   http://localhost:3000/menus
   ```

2. **Create Categories**
   - Go to "Manage Categories" 
   - Create: Appetizers, Main Courses, Desserts
   - Test drag & drop reordering

3. **Create a Menu**
   - Click "Create New Menu"
   - Name: "Dinner Menu"
   - Description: "Our evening selection"

4. **Add Menu Items**
   - Create items in each category
   - Test image upload functionality
   - Add allergen information
   - Test availability toggle

5. **Test Menu Organization**
   - Switch to "Menu Organization" tab
   - Drag categories to reorder
   - Toggle item availability in real-time

### API Testing Examples

#### Create Menu Category
```bash
curl -X POST http://localhost:8080/api/v1/menu-categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Appetizers",
    "description": "Start your meal right",
    "displayOrder": 1,
    "isActive": true
  }'
```

#### Create Menu Item
```bash
curl -X POST http://localhost:8080/api/v1/menu-items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Caesar Salad",
    "description": "Fresh romaine with Caesar dressing",
    "price": 12.99,
    "category": "Appetizers",
    "isAvailable": true,
    "allergens": ["Dairy", "Gluten"]
  }'
```

#### Create Order
```bash
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DINE_IN",
    "tableNumber": 5,
    "customerName": "John Doe",
    "items": [
      {
        "menuItemId": "menu_item_1",
        "quantity": 2,
        "notes": "Extra dressing"
      }
    ]
  }'
```

## 🧪 Feature Tests

### ✅ Completed Features (Phase 1 & 2.1)

- [x] **Shared UI Components** - Design system with Tailwind CSS
- [x] **Shared Utilities** - API clients, types, event bus
- [x] **Menu CRUD Operations** - Full create, read, update, delete
- [x] **Category Management** - With drag & drop ordering
- [x] **Menu Item Management** - With nutrition, allergens, images
- [x] **Drag & Drop Organization** - Visual menu organization
- [x] **Image Upload** - File upload + URL input
- [x] **Real-time Availability Toggle** - Instant updates
- [x] **Inventory Integration** - Auto-disable on low stock
- [x] **Module Federation** - Micro-frontend architecture

### 🔄 Real-time Features

Test these by opening multiple browser tabs:

1. **Availability Changes**: Toggle item availability in one tab, see updates in another
2. **Menu Updates**: Create/edit items and see real-time updates
3. **Inventory Integration**: Low stock items auto-disable menu items

### 📱 Mobile Responsiveness

Test the interface on different screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024) 
- Mobile (375x667)

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check service status
docker compose -f docker-compose.test.yml ps

# View logs
docker compose -f docker-compose.test.yml logs backend
docker compose -f docker-compose.test.yml logs frontend

# Restart services
docker compose -f docker-compose.test.yml restart
```

### Database Issues

```bash
# Connect to database
docker exec -it restaurant-postgres-test psql -U postgres -d restaurant_platform

# Check tables
\dt

# View sample data
SELECT * FROM menus LIMIT 5;
```

### API Not Responding

```bash
# Check backend health
curl http://localhost:8080/health

# Check if port is in use
lsof -i :8080

# Restart backend only
docker compose -f docker-compose.test.yml restart backend
```

### Frontend Build Issues

```bash
# Check frontend logs
docker compose -f docker-compose.test.yml logs frontend

# Rebuild frontend
docker compose -f docker-compose.test.yml up --build frontend
```

## 🧹 Cleanup

```bash
# Stop all services and optionally clean volumes/images
./scripts/cleanup.sh
```

## 📊 Performance Testing

### Load Testing with curl

```bash
# Test menu endpoint performance
for i in {1..100}; do
  curl -s http://localhost:8080/api/v1/menus > /dev/null &
done
wait
```

### Memory Usage

```bash
# Check container resource usage
docker stats
```

## 🔧 Development Mode

For development with hot reload, use the full compose file:

```bash
# Start with all micro-frontends
docker compose -f docker-compose.full.yml up

# Or start specific services
docker compose -f docker-compose.full.yml up postgres redis api-gateway shell-app menu-mfe
```

## 📝 Test Data

The `test-api.sh` script creates sample data including:
- 3 menu categories (Appetizers, Main Courses, Desserts)
- Sample menu items with various configurations
- Test orders and reservations
- Inventory items

## 🎯 Next Steps

After testing Phase 2.1 (Menu Management), you can:

1. **Phase 2.2**: Test Orders Management MFE (when implemented)
2. **Phase 3**: Test Kitchen Dashboard and Reservations
3. **Phase 4**: Test Inventory Management and Analytics
4. **Phase 5**: Performance optimization and production deployment

---

**Need Help?** Check the logs, API health endpoint, or restart services. The platform is designed to be resilient and self-healing.