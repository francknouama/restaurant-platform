# Frontend Application

A modern, production-ready React frontend application built with TypeScript, Tailwind CSS, and comprehensive tooling.

## 🚀 Features

- **Modern React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive, utility-first styling
- **React Router** for client-side routing with protected routes
- **React Query** for server state management
- **Zustand** for client state management
- **React Hook Form** for efficient form handling
- **Comprehensive testing** with Vitest and Testing Library
- **Code quality tools** - ESLint, Prettier, and pre-commit hooks
- **Responsive design** optimized for all devices
- **Authentication system** with JWT token management
- **Modern UI components** with accessibility best practices

## 📦 Tech Stack

### Core
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS

### State Management
- Zustand (client state)
- React Query (server state)

### Routing & Forms
- React Router DOM
- React Hook Form

### UI & Icons
- Headless UI
- Heroicons
- React Hot Toast

### Testing
- Vitest
- React Testing Library
- Jest DOM

### Code Quality
- ESLint
- Prettier
- TypeScript

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_APP_NAME=Frontend App
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/               # API client and endpoints
│   ├── components/        # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Generic UI components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── store/            # State management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── __tests__/        # Test files
│   └── test/             # Test configuration
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## 🧪 Testing

The project includes comprehensive testing setup:

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure
- **Unit tests** for utilities and hooks
- **Component tests** for UI components
- **Integration tests** for API interactions
- **E2E tests** for critical user flows

## 🎨 Styling & Design System

### Tailwind CSS Configuration
- Custom color palette with primary, secondary, and accent colors
- Responsive breakpoints
- Custom animations and transitions
- Typography scale
- Spacing system based on 8px grid

### Component Classes
The project includes utility classes for common patterns:
- `.btn` - Base button styles
- `.btn-primary`, `.btn-secondary`, `.btn-danger` - Button variants
- `.input` - Form input styles
- `.card` - Card container styles

## 🔐 Authentication

The application includes a complete authentication system:

### Features
- User registration and login
- Protected routes
- Token-based authentication
- Automatic token refresh
- Persistent login state

### Usage
```typescript
import { useAuth } from '@hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  // Component logic
}
```

## 🌐 API Integration

### API Client
Centralized API client with:
- Automatic token attachment
- Request/response interceptors
- Error handling
- TypeScript types

### Usage
```typescript
import { apiClient } from '@api/client'

const response = await apiClient.get<User[]>('/users')
```

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Breakpoint system: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Flexible grid layouts
- Optimized mobile navigation

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Set the following environment variables for production:
- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME` - Application name

### Deployment Options
- **Netlify** - Drop the `dist` folder or connect to Git
- **Vercel** - Import project from Git
- **AWS S3** - Upload `dist` folder contents
- **Docker** - Use included Dockerfile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use functional components with hooks
- Write tests for new features
- Follow the existing code style
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information
- Contact the development team

---

Built with ❤️ using modern web technologies