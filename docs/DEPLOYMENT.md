# 🚀 Production Deployment Guide

This guide covers deploying the Fleet Tracking System to production environments with best practices for security, performance, and reliability.

## 📋 Table of Contents

- [Deployment Options](#deployment-options)
- [Environment Setup](#environment-setup)
- [Build Configuration](#build-configuration)
- [Security Configuration](#security-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## 🌐 Deployment Options

### Option 1: Netlify (Recommended for Static Hosting)

#### Prerequisites
- GitHub/GitLab repository
- Netlify account
- Domain name (optional)

#### Deployment Steps

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Configure Netlify**
   - Log into Netlify
   - Click "New site from Git"
   - Connect your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Environment Variables**
   ```env
   # In Netlify dashboard > Site settings > Environment variables
   VITE_MOTIVE_API_KEY=your_production_motive_key
   VITE_MAPBOX_ACCESS_TOKEN=your_production_mapbox_token
   VITE_APP_TITLE=Fleet Tracking System
   ```

4. **Custom Domain (Optional)**
   - Add custom domain in Netlify dashboard
   - Configure DNS records
   - Enable HTTPS (automatic with Netlify)

### Option 2: Vercel

#### Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   ```bash
   vercel env add VITE_MOTIVE_API_KEY
   vercel env add VITE_MAPBOX_ACCESS_TOKEN
   ```

### Option 3: AWS S3 + CloudFront

#### Prerequisites
- AWS Account
- AWS CLI configured
- S3 bucket for hosting
- CloudFront distribution

#### Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

# Build the application
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"
```

### Option 4: Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    }
}
```

#### Docker Compose

```yaml
version: '3.8'

services:
  fleet-tracking:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Add reverse proxy
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./proxy.conf:/etc/nginx/nginx.conf
    depends_on:
      - fleet-tracking
```

## 🔧 Environment Setup

### Production Environment Variables

```env
# Application Configuration
NODE_ENV=production
VITE_APP_TITLE=Fleet Tracking System
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_MOTIVE_API_KEY=prod_motive_key_here
VITE_MOTIVE_FLEET_ID=your_fleet_id
VITE_MAPBOX_ACCESS_TOKEN=pk.production_token_here

# Optional APIs
VITE_HERE_API_KEY=production_here_key
VITE_GOOGLE_MAPS_API_KEY=production_google_key

# Performance Settings
VITE_REFRESH_INTERVAL=5
VITE_CACHE_DURATION=7200000
VITE_MAX_RETRIES=3

# Security Settings
VITE_ENABLE_DEBUG=false
VITE_API_TIMEOUT=30000
```

### Environment Validation

```typescript
// src/config/environment.ts
const requiredEnvVars = [
  'VITE_MOTIVE_API_KEY',
  'VITE_MAPBOX_ACCESS_TOKEN'
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Call during app initialization
validateEnvironment();
```

## 🏗️ Build Configuration

### Vite Production Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lucide-react']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/motive': {
        target: 'https://api.gomotive.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/motive/, ''),
        secure: true
      }
    }
  }
});
```

### Build Optimization

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "npm run build && npx vite-bundle-analyzer dist",
    "build:prod": "NODE_ENV=production npm run build",
    "preview": "vite preview"
  }
}
```

## 🛡️ Security Configuration

### Content Security Policy

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.gomotive.com https://api.mapbox.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

### Security Headers

```typescript
// For Express.js server
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.gomotive.com",
        "https://api.mapbox.com"
      ]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### API Key Security

```typescript
// Environment-based configuration
const getApiConfig = () => {
  const isProduction = import.meta.env.NODE_ENV === 'production';
  
  return {
    motiveApiKey: import.meta.env.VITE_MOTIVE_API_KEY,
    mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    enableDebug: !isProduction && import.meta.env.VITE_ENABLE_DEBUG === 'true',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000')
  };
};
```

## ⚡ Performance Optimization

### Code Splitting

```typescript
// Lazy load components
import { lazy, Suspense } from 'react';

const Settings = lazy(() => import('./components/Settings/Settings'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### Service Worker for Caching

```typescript
// public/sw.js
const CACHE_NAME = 'fleet-tracking-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Check for unused dependencies
npx depcheck

# Audit for vulnerabilities
npm audit
```

## 📊 Monitoring & Logging

### Error Tracking with Sentry

```typescript
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export const logError = (error: Error, context?: any) => {
  console.error('Application Error:', error);
  
  if (import.meta.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context
    });
  }
};
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export const trackPerformance = (name: string, fn: () => Promise<any>) => {
  return async (...args: any[]) => {
    const start = performance.now();
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      
      // Send to analytics service
      if (import.meta.env.NODE_ENV === 'production') {
        analytics.track('performance', {
          operation: name,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  };
};
```

### Health Check Endpoint

```typescript
// src/utils/healthCheck.ts
export const healthCheck = async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: import.meta.env.VITE_APP_VERSION,
    apis: {
      motive: false,
      mapbox: false
    }
  };
  
  try {
    // Test Motive API
    checks.apis.motive = await motiveApi.testConnection();
    
    // Test Mapbox API
    checks.apis.mapbox = await mapboxService.testConnection();
    
    const allHealthy = Object.values(checks.apis).every(Boolean);
    checks.status = allHealthy ? 'healthy' : 'degraded';
    
  } catch (error) {
    checks.status = 'unhealthy';
  }
  
  return checks;
};
```

## 💾 Backup & Recovery

### Data Backup Strategy

```typescript
// src/utils/backup.ts
export const createBackup = () => {
  const backupData = {
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION,
    data: {
      appointments: localStorage.getItem('truck_delivery_appointments'),
      loadNumbers: localStorage.getItem('truck_load_numbers'),
      settings: localStorage.getItem('systemSettings'),
      cache: localStorage.getItem('distance_cache')
    }
  };
  
  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fleet-tracking-backup-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
};

export const restoreBackup = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        
        // Validate backup structure
        if (!backup.data || !backup.timestamp) {
          throw new Error('Invalid backup file format');
        }
        
        // Restore data
        Object.entries(backup.data).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value as string);
          }
        });
        
        resolve(backup);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.readAsText(file);
  });
};
```

## 🔍 Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Verify environment variables
npm run build -- --mode production
```

#### 2. API Connection Issues

```typescript
// Debug API connectivity
const debugAPIs = async () => {
  console.log('Environment:', import.meta.env.NODE_ENV);
  console.log('API Keys configured:', {
    motive: !!import.meta.env.VITE_MOTIVE_API_KEY,
    mapbox: !!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  });
  
  // Test connections
  const results = await Promise.allSettled([
    motiveApi.testConnection(),
    mapboxService.testConnection()
  ]);
  
  console.log('API Test Results:', results);
};
```

#### 3. Performance Issues

```typescript
// Monitor bundle size
const analyzeBundleSize = () => {
  if (import.meta.env.NODE_ENV === 'development') {
    import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
      // Analyze bundle composition
    });
  }
};

// Check for memory leaks
const monitorMemory = () => {
  setInterval(() => {
    if (performance.memory) {
      console.log('Memory usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      });
    }
  }, 30000);
};
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] API keys tested and working
- [ ] Build process completes successfully
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented
- [ ] Health checks working
- [ ] Documentation updated

### Rollback Strategy

```bash
#!/bin/bash
# rollback.sh

# For Netlify
netlify sites:list
netlify api listSiteDeploys --site-id=SITE_ID
netlify api restoreSiteDeploy --site-id=SITE_ID --deploy-id=DEPLOY_ID

# For AWS S3
aws s3 sync s3://backup-bucket/previous-version/ s3://production-bucket/ --delete

# For Docker
docker tag fleet-tracking:previous fleet-tracking:latest
docker-compose up -d
```

---

For more information, see the main [README.md](../README.md) or contact the development team.