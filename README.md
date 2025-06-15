# 🚛 Fleet Tracking System

A comprehensive, real-time fleet tracking web application built with React, TypeScript, and modern web technologies. This system provides intelligent vehicle monitoring, delivery management, and late tracking capabilities for fleet operations.

![Fleet Tracking Dashboard](https://via.placeholder.com/800x400/2563eb/ffffff?text=Fleet+Tracking+Dashboard)

## 🎯 Overview

The Fleet Tracking System is designed for fleet managers, dispatchers, and operations teams who need real-time visibility into their vehicle operations. It integrates with Motive's fleet management API and provides intelligent distance calculations, appointment management, and late tracking analysis.

### Key Features

- **🔄 Real-Time Vehicle Tracking** - Live GPS locations with automatic refresh
- **📅 Smart Appointment Management** - Natural language appointment parsing with multiple appointments per vehicle
- **🛣️ Intelligent Distance Calculation** - Optimized API usage with caching and 30-minute auto-refresh
- **⚠️ Late Tracking & Risk Analysis** - Proactive delivery monitoring with visual filtering
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🔧 Comprehensive Configuration** - Flexible API and system settings

## 🎯 Use Cases

### For Fleet Managers
- Monitor entire fleet status at a glance
- Track on-time delivery performance
- Identify at-risk deliveries before they become late
- Optimize routes and schedules

### For Dispatchers
- Assign and track delivery appointments directly in the main dashboard
- Monitor vehicle locations and speeds
- Manage load numbers and delivery schedules
- Coordinate with drivers on delivery timing

### For Operations Teams
- Real-time visibility into fleet operations
- Performance analytics and reporting
- Exception management for late deliveries
- Resource allocation optimization

## 🛠️ Technologies Used

### Frontend
- **React 18** - Modern UI library with hooks and functional components
- **TypeScript** - Type-safe development with enhanced IDE support
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Vite** - Fast build tool and development server
- **Lucide React** - Beautiful, customizable icons

### APIs & Services
- **Motive API** - Fleet management and vehicle tracking data
- **Mapbox API** - Geocoding and distance calculation services
- **HERE Maps** - Alternative mapping provider (configurable)
- **Google Maps** - Additional mapping option (configurable)

### State Management
- **React Hooks** - Built-in state management with custom hooks
- **Local Storage** - Persistent data storage for settings and cache
- **Real-time Sync** - Coordinated state updates across components

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **PostCSS** - CSS processing and optimization
- **Autoprefixer** - Automatic vendor prefix handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Motive API key with vehicle location permissions
- Mapbox API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fleet-tracking-system.git
   cd fleet-tracking-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📖 Detailed Setup Guide

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Motive API Configuration
VITE_MOTIVE_API_KEY=your_motive_api_key_here
VITE_MOTIVE_FLEET_ID=your_fleet_id_here

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Optional: Additional Mapping APIs
VITE_HERE_API_KEY=your_here_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# Application Settings
VITE_APP_TITLE="Fleet Tracking System"
VITE_REFRESH_INTERVAL=5
```

### API Key Setup

#### Motive API
1. Log into your Motive account
2. Navigate to **Settings > API**
3. Generate a new API key with **Vehicle Locations** permissions
4. Copy the API key to your `.env` file
5. Find your Fleet ID in **Fleet Management** section

#### Mapbox API
1. Create account at [mapbox.com](https://mapbox.com)
2. Go to **Account > Access Tokens**
3. Create a new token with **Navigation** and **Geocoding** scopes
4. Copy the token to your `.env` file

### Initial Configuration

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Configure APIs**
   - Navigate to **Settings > API Configuration**
   - Enter your Motive API key and test connection
   - Configure Mapbox API key and test connection

3. **System Settings**
   - Set refresh interval (recommended: 5 minutes)
   - Configure operation hours
   - Set speed thresholds for vehicle status

## 💡 Usage Guide

### Dashboard Overview

The main dashboard provides:
- **Stats Cards** - Fleet overview with key metrics
- **Vehicle Table** - Detailed vehicle information and status
- **Filter Controls** - Filter vehicles by delivery status
- **Distance Controls** - Manage API usage and calculations

### Managing Appointments

1. **Add Appointment**
   - Click on a vehicle's appointment cell in the main table
   - Enter location and time using natural language:
     - `06/16/2025 9AM`
     - `Tomorrow 2PM`
     - `Monday 9AM-2PM`
   - System automatically parses and validates

2. **Multiple Appointments**
   - Each vehicle can have multiple appointments
   - Appointments are sorted chronologically
   - Next appointment is highlighted prominently

3. **Track Status**
   - Appointments show as Pending, Completed, or Missed
   - Late tracking analyzes delivery risk in real-time
   - Visual indicators show on-time, at-risk, or late status

### Distance Calculation

The system automatically calculates distances every 30 minutes to conserve API usage:

- **Auto-calculation** - Every 30 minutes for all vehicles with appointments
- **Manual override** - "Calculate Now" button for immediate updates
- **Smart caching** - 2-hour cache with position-based invalidation
- **Usage monitoring** - Tracks API calls and warns at 80% of free tier

### Load Number Tracking

- Click on any vehicle's load number cell to add/edit
- Load numbers are automatically saved and persist across sessions
- Visual indicators show which vehicles have assigned load numbers

### Delivery Status Filtering

Filter vehicles by delivery status:
- **All Trucks** - Show all vehicles
- **Late** - Vehicles past their appointment time
- **At Risk** - Vehicles that may be late based on distance and time
- **On Time** - Vehicles with sufficient time to reach appointments
- **No Appointments** - Vehicles without scheduled deliveries

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard/       # Main dashboard components
│   │   ├── StatsCards.tsx
│   │   ├── VehicleTable.tsx
│   │   ├── DistanceControls.tsx
│   │   ├── LateTrackingFilter.tsx
│   │   ├── DeliveryStatusDisplay.tsx
│   │   ├── EditableLoadNumber.tsx
│   │   └── VehicleStatusBadge.tsx
│   ├── DeliveryManager/ # Appointment management
│   │   └── MultipleDeliveryAppointments.tsx
│   ├── Layout/          # Layout components
│   │   └── Header.tsx
│   └── Settings/        # Configuration components
│       ├── ApiConfigPanel.tsx
│       └── SystemSettings.tsx
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useLoadNumbers.ts
│   ├── useDeliveryAppointments.ts
│   └── useControlledDistanceCalculation.ts
├── services/            # Business logic and API integration
│   ├── motiveApi.ts     # Motive API integration
│   ├── mapboxService.ts # Mapbox API integration
│   ├── lateTrackingService.ts
│   ├── deliveryAppointmentsService.ts
│   ├── loadNumberService.ts
│   └── distanceCalculationManager.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Helper functions
└── styles/              # CSS and styling
    └── index.css
```

## 🔧 API Documentation

See [docs/API.md](docs/API.md) for detailed API integration documentation.

## 🚀 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guide.

## 🛡️ Security Considerations

- **API Keys** - Never commit API keys to version control
- **Environment Variables** - Use `.env` files for sensitive configuration
- **CORS** - Configure proper CORS settings for production
- **Rate Limiting** - Built-in rate limiting for API calls
- **Data Validation** - Input validation for all user data

## 🔍 Troubleshooting

### Common Issues

#### "No vehicles found" or empty dashboard
- Verify Motive API key has correct permissions
- Check Fleet ID configuration
- Review browser console for API errors
- Test API connection in Settings

#### Missing coordinates (0.000000, 0.000000)
- Motive API response structure may vary
- Use "Debug Coordinates" button in Settings
- Check browser console for coordinate extraction logs
- Verify vehicles have recent GPS data

#### Distance calculations not working
- Verify Mapbox API key is configured
- Check API usage limits
- Review cache settings
- Test geocoding with known addresses

#### Appointments not parsing correctly
- Use supported date formats: `MM/DD/YYYY HH:MM AM/PM`
- Examples: `06/16/2025 9AM`, `Tomorrow 2PM`
- Check browser console for parsing errors

### Debug Tools

The application includes comprehensive debugging tools:

- **Coordinate Debugger** - Analyzes GPS data structure
- **API Response Inspector** - Shows raw API responses
- **Cache Statistics** - Monitors cache hit rates
- **Usage Tracking** - API call monitoring

## 📊 Performance Optimization

### API Usage Optimization
- **30-minute auto-refresh** - Reduces unnecessary API calls
- **Smart caching** - 2-hour cache with position-based invalidation
- **Rate limiting** - Built-in delays between API requests
- **Batch processing** - Efficient data processing

### Frontend Performance
- **Component memoization** - Prevents unnecessary re-renders
- **Lazy loading** - Components loaded on demand
- **Optimized images** - Proper image sizing and formats
- **Bundle optimization** - Tree shaking and code splitting

### Data Management
- **Local storage** - Persistent data without server dependency
- **State optimization** - Efficient state updates
- **Memory management** - Proper cleanup of intervals and listeners

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add JSDoc comments for public functions
- Include unit tests for new features
- Update documentation as needed

## 🎯 Roadmap

### Version 2.0 (Q2 2024)
- [ ] **Real-time WebSocket Updates** - Live data streaming
- [ ] **Advanced Analytics Dashboard** - Performance metrics and reporting
- [ ] **Mobile App** - React Native companion app
- [ ] **Multi-tenant Support** - Support for multiple fleets

### Version 2.1 (Q3 2024)
- [ ] **Route Optimization** - AI-powered route suggestions
- [ ] **Driver Communication** - In-app messaging system
- [ ] **Geofencing** - Location-based alerts and automation
- [ ] **Advanced Reporting** - Custom reports and exports

### Version 2.2 (Q4 2024)
- [ ] **Predictive Analytics** - Machine learning for delivery predictions
- [ ] **Integration Hub** - Connect with ERP and TMS systems
- [ ] **Advanced Notifications** - SMS, email, and push notifications
- [ ] **Audit Trail** - Comprehensive activity logging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Motive** - Fleet management API and platform
- **Mapbox** - Mapping and geocoding services
- **React Team** - Amazing frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautiful icon library

## 📞 Support

- **Documentation** - Check our comprehensive docs
- **Issues** - Report bugs on GitHub Issues
- **Discussions** - Join GitHub Discussions for questions
- **Email** - Contact us at support@fleettracking.com

---

**Built with ❤️ for fleet operations teams worldwide**