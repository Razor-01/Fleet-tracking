# 🤝 Contributing to Fleet Tracking System

Thank you for your interest in contributing to the Fleet Tracking System! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and Tailwind CSS

### First-time Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/fleet-tracking-system.git
   cd fleet-tracking-system
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original-owner/fleet-tracking-system.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your development API keys
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🛠️ Development Setup

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Environment Configuration

```env
# Development environment variables
NODE_ENV=development
VITE_APP_TITLE=Fleet Tracking System (Dev)

# API Keys (get from respective services)
VITE_MOTIVE_API_KEY=your_dev_motive_key
VITE_MAPBOX_ACCESS_TOKEN=your_dev_mapbox_token

# Development settings
VITE_ENABLE_DEBUG=true
VITE_REFRESH_INTERVAL=10
VITE_API_TIMEOUT=30000
```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug fixes** - Fix issues and improve stability
- **✨ New features** - Add functionality that benefits users
- **📚 Documentation** - Improve or add documentation
- **🎨 UI/UX improvements** - Enhance user experience
- **⚡ Performance optimizations** - Make the app faster
- **🧪 Tests** - Add or improve test coverage
- **🔧 Tooling** - Improve development experience

### Before You Start

1. **Check existing issues** - Look for related issues or discussions
2. **Create an issue** - For new features or significant changes
3. **Discuss approach** - Get feedback before implementing
4. **Keep it focused** - One feature/fix per pull request

### Branch Naming Convention

```bash
# Feature branches
feature/add-driver-communication
feature/route-optimization

# Bug fix branches
fix/coordinate-parsing-issue
fix/memory-leak-in-distance-calc

# Documentation branches
docs/api-integration-guide
docs/deployment-instructions

# Chore branches
chore/update-dependencies
chore/improve-build-process
```

## 🔄 Pull Request Process

### 1. Create Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main
git push origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, readable code
- Follow existing patterns and conventions
- Add tests for new functionality
- Update documentation as needed

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add real-time driver communication

- Add WebSocket connection for live messaging
- Implement message history storage
- Add notification system for new messages
- Update UI with chat interface

Closes #123"
```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(api): add vehicle status filtering
fix(ui): resolve mobile responsive issues
docs(readme): update installation instructions
refactor(hooks): simplify distance calculation logic
```

### 4. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Use the PR template and fill out all sections
```

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested this change in a browser

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## 🎨 Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types for function parameters and return values
const calculateDistance = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DistanceResult> => {
  // Implementation
};

// Use interfaces for object types
interface VehicleLocation {
  lat: number;
  lon: number;
  address?: string;
  timestamp: Date;
}

// Use enums for constants
enum VehicleStatus {
  MOVING = 'moving',
  IDLE = 'idle',
  STATIONARY = 'stationary'
}

// Use generic types when appropriate
interface APIResponse<T> {
  data: T;
  status: number;
  message: string;
}
```

### React Component Guidelines

```typescript
// Use functional components with TypeScript
interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
  className?: string;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onSelect,
  className = ''
}) => {
  // Use descriptive variable names
  const isMoving = vehicle.status === VehicleStatus.MOVING;
  const lastUpdateTime = formatTimeAgo(vehicle.lastUpdate);
  
  // Handle events with clear function names
  const handleVehicleClick = useCallback(() => {
    onSelect(vehicle.id);
  }, [vehicle.id, onSelect]);
  
  return (
    <div 
      className={`vehicle-card ${className}`}
      onClick={handleVehicleClick}
    >
      {/* Component content */}
    </div>
  );
};
```

### CSS/Tailwind Guidelines

```css
/* Use semantic class names */
.vehicle-status-badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
}

.vehicle-status-moving {
  @apply bg-green-100 text-green-800;
}

.vehicle-status-idle {
  @apply bg-yellow-100 text-yellow-800;
}

/* Use consistent spacing */
.dashboard-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

/* Use responsive design patterns */
.stats-card {
  @apply bg-white rounded-lg shadow-sm p-6;
  @apply hover:shadow-md transition-shadow duration-200;
}
```

### File Organization

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── VehicleCard.tsx
│   │   ├── StatsCards.tsx
│   │   └── index.ts          # Export all components
│   └── common/               # Reusable components
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useVehicles.ts
│   ├── useLocalStorage.ts
│   └── useAPI.ts
├── services/
│   ├── api/
│   │   ├── motiveApi.ts
│   │   ├── mapboxApi.ts
│   │   └── types.ts
│   └── utils/
│       ├── dateUtils.ts
│       ├── formatUtils.ts
│       └── validationUtils.ts
├── types/
│   ├── vehicle.ts
│   ├── api.ts
│   └── index.ts
└── utils/
    ├── constants.ts
    ├── helpers.ts
    └── testUtils.ts
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// src/utils/__tests__/dateUtils.test.ts
import { formatTimeAgo, parseAppointmentTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatTimeAgo', () => {
    it('should format recent times correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      expect(formatTimeAgo(fiveMinutesAgo)).toBe('5m ago');
    });
    
    it('should handle hours correctly', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago');
    });
  });
  
  describe('parseAppointmentTime', () => {
    it('should parse standard date format', () => {
      const result = parseAppointmentTime('06/16/2025 9AM');
      
      expect(result.startDateTime).toBeInstanceOf(Date);
      expect(result.isRange).toBe(false);
    });
    
    it('should parse time ranges', () => {
      const result = parseAppointmentTime('06/16/2025 9AM-2PM');
      
      expect(result.isRange).toBe(true);
      expect(result.endDateTime).toBeInstanceOf(Date);
    });
  });
});
```

### Component Tests

```typescript
// src/components/__tests__/VehicleCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VehicleCard } from '../VehicleCard';
import { mockVehicle } from '../../utils/testUtils';

describe('VehicleCard', () => {
  const mockOnSelect = jest.fn();
  
  beforeEach(() => {
    mockOnSelect.mockClear();
  });
  
  it('should render vehicle information', () => {
    render(
      <VehicleCard 
        vehicle={mockVehicle} 
        onSelect={mockOnSelect} 
      />
    );
    
    expect(screen.getByText(mockVehicle.truckNumber)).toBeInTheDocument();
    expect(screen.getByText(mockVehicle.status)).toBeInTheDocument();
  });
  
  it('should call onSelect when clicked', () => {
    render(
      <VehicleCard 
        vehicle={mockVehicle} 
        onSelect={mockOnSelect} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockVehicle.id);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test VehicleCard.test.tsx
```

## 📚 Documentation

### JSDoc Comments

```typescript
/**
 * Calculates the distance between two geographic points using the Mapbox API
 * 
 * @param fromLat - Starting latitude coordinate
 * @param fromLng - Starting longitude coordinate  
 * @param toLat - Destination latitude coordinate
 * @param toLng - Destination longitude coordinate
 * @returns Promise that resolves to distance calculation result
 * 
 * @example
 * ```typescript
 * const distance = await calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
 * console.log(`Distance: ${distance.distanceMiles} miles`);
 * ```
 */
export const calculateDistance = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DistanceResult> => {
  // Implementation
};
```

### README Updates

When adding new features, update the relevant documentation:

- Main README.md for user-facing features
- API.md for API changes
- DEPLOYMENT.md for deployment-related changes

### Code Comments

```typescript
// Good: Explain why, not what
// Cache geocoding results for 24 hours to reduce API calls
// and improve response times for frequently used addresses
const geocodeCache = new Map<string, CachedGeocode>();

// Good: Explain complex business logic
// Calculate buffer time based on delivery type and traffic conditions
// Standard deliveries get 30 minutes, priority deliveries get 15 minutes
const bufferTime = appointment.priority === 'high' ? 15 : 30;

// Avoid: Obvious comments
// Bad: Set the variable to true
const isLoading = true;
```

## 🎯 Review Process

### What Reviewers Look For

1. **Functionality** - Does the code work as intended?
2. **Code Quality** - Is the code clean, readable, and maintainable?
3. **Performance** - Are there any performance implications?
4. **Security** - Are there any security concerns?
5. **Testing** - Is the code adequately tested?
6. **Documentation** - Is the code properly documented?

### Responding to Feedback

- Be open to feedback and suggestions
- Ask questions if feedback is unclear
- Make requested changes promptly
- Thank reviewers for their time and input

### Getting Your PR Merged

1. **All checks pass** - CI/CD, tests, linting
2. **Approved by maintainer** - At least one approval required
3. **No merge conflicts** - Keep your branch up to date
4. **Documentation updated** - If applicable

## 🏆 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Annual contributor acknowledgments

## 📞 Getting Help

- **GitHub Discussions** - For questions and general discussion
- **GitHub Issues** - For bug reports and feature requests
- **Discord** - Real-time chat with the community
- **Email** - Direct contact for sensitive issues

---

Thank you for contributing to the Fleet Tracking System! Your efforts help make fleet management more efficient and effective for teams worldwide.