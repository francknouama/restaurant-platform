# Restaurant Platform

A modern restaurant management platform built with micro-frontend architecture and microservices.

## 🏗️ Architecture Overview

### Frontend - Micro-Frontend Architecture (MFE)
- **Shell App** - Main container application with authentication and navigation
- **Menu MFE** - Menu management and item configuration
- **Orders MFE** - Order processing and management
- **Kitchen MFE** - Kitchen operations and order preparation
- **Inventory MFE** - Stock management and supplier operations
- **Reservations MFE** - Table booking and customer management

### Backend - Microservices
- **User Service** - Authentication and user management
- **Menu Service** - Menu versioning and item management
- **Order Service** - Order processing and status tracking
- **Kitchen Service** - Kitchen operations and queue management
- **Reservation Service** - Table booking and availability
- **Inventory Service** - Stock tracking and alerts

## 🚀 Quick Start

### Frontend Development
```bash
cd frontend-mfe
pnpm install
pnpm run dev
```

### Backend Development
```bash
cd backend
go mod download
go run cmd/server/main.go
```

## 📁 Project Structure

```
restaurant-platform/
├── frontend-mfe/           # Micro-frontend applications
│   ├── apps/
│   │   ├── shell-app/      # Main container app
│   │   ├── menu-mfe/       # Menu management
│   │   ├── orders-mfe/     # Order processing
│   │   ├── kitchen-mfe/    # Kitchen operations
│   │   ├── inventory-mfe/  # Inventory management
│   │   └── reservations-mfe/ # Reservation system
│   └── packages/           # Shared packages
│       ├── shared-ui/      # UI component library
│       ├── shared-state/   # Cross-MFE communication
│       └── shared-utils/   # Utility functions
├── backend/                # Go microservices
│   ├── user-service/       # Authentication service
│   ├── shared/pkg/         # Shared Go packages
│   └── migrations/         # Database migrations
├── docs/                   # Project documentation
└── scripts/               # Automation scripts
```

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ and **pnpm** 8+
- **Go** 1.24.4+
- **PostgreSQL** 13+
- **Redis** 6+

### Environment Setup
```bash
# Database
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export DB_NAME=restaurant_platform

# Redis
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

### Running the Platform
1. **Start databases** (PostgreSQL & Redis)
2. **Run backend services**:
   ```bash
   cd backend && go run cmd/server/main.go
   ```
3. **Start frontend**:
   ```bash
   cd frontend-mfe && pnpm run dev
   ```

## 📊 Project Management

**GitHub Project**: [Restaurant Platform Development](https://github.com/users/francknouama/projects/1)

### Current Sprint: Foundation Testing
- [ ] Shell App unit tests
- [ ] Shared package tests
- [ ] User Service tests
- [ ] Security scanning setup

### Development Roadmap
- **Sprint 1**: Foundation Testing (2 weeks)
- **Sprint 2**: Frontend Testing (2 weeks)
- **Sprint 3**: Backend Testing (2 weeks)
- **Sprint 4**: Integration & Infrastructure (2 weeks)

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Cross-MFE communication
- **E2E Tests**: Playwright for user flows

### Backend Testing
- **Unit Tests**: Go testing with testify
- **Integration Tests**: API endpoint testing
- **Load Tests**: k6 performance testing

## 🚀 CI/CD Pipeline

GitHub Actions workflow handles:
- **Build**: All MFEs and microservices
- **Test**: Unit, integration, and E2E tests
- **Security**: Vulnerability scanning
- **Deploy**: Preview and production deployments

## 🏛️ Key Features

### Cross-MFE Communication
- Event-driven architecture with shared state
- Real-time updates across modules
- Type-safe event system

### Role-Based Access Control
- Admin, Manager, Kitchen Staff, Waitstaff, Host, Cashier roles
- Granular permissions system
- JWT-based authentication

### Real-time Operations
- Live kitchen queue updates
- Inventory stock alerts
- Order status tracking

## 📚 Documentation

- [Frontend MFE Guide](./frontend-mfe/README.md)
- [Backend Architecture](./backend/README.md)
- [API Documentation](./docs/)
- [Project Organization](./docs/PROJECT_ORGANIZATION.md)
- [GitHub Project Setup](./docs/GITHUB_PROJECT_CREATED.md)

## 🛡️ Security

- JWT authentication with Redis sessions
- Role-based access control (RBAC)
- Input validation and sanitization
- Security scanning in CI/CD pipeline
- HTTPS enforcement

## 🤝 Contributing

1. Check the [GitHub Project](https://github.com/users/francknouama/projects/1) for available tasks
2. Create a feature branch from `main`
3. Follow the testing requirements (80%+ coverage)
4. Submit a pull request with tests

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: Go fmt + golangci-lint
- **Commits**: Conventional commit format

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with modern micro-frontend and microservices architecture for scalable restaurant operations**