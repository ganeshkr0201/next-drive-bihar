# Frontend Deployment Guide

This guide explains how to deploy the NextDrive Bihar frontend application with proper environment variable configuration.

## Environment Variables Setup

### Required Environment Variables

The following environment variables must be configured for deployment:

#### API Configuration
- `VITE_API_URL` - Backend API URL (e.g., `https://api.yourdomain.com`)
- `VITE_API_TIMEOUT` - API request timeout in milliseconds (default: 10000)

#### Application Configuration
- `VITE_APP_NAME` - Application name (default: "NextDrive Bihar")
- `VITE_APP_DESCRIPTION` - Application description
- `VITE_APP_VERSION` - Application version

#### Feature Flags
- `VITE_ENABLE_GOOGLE_AUTH` - Enable/disable Google OAuth (true/false)
- `VITE_ENABLE_NOTIFICATIONS` - Enable/disable notifications (true/false)
- `VITE_ENABLE_FEEDBACK_SYSTEM` - Enable/disable feedback system (true/false)

#### External Services
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (if using maps)
- `VITE_ANALYTICS_ID` - Analytics tracking ID

### Environment Files

1. **Development**: Use `.env` file in the frontend root directory
2. **Production**: Set environment variables in your deployment platform

### Example Production Configuration

```bash
# Production Environment Variables
VITE_API_URL=https://api.nextdrivebihar.com
VITE_API_TIMEOUT=15000
VITE_APP_NAME=NextDrive Bihar
VITE_APP_DESCRIPTION=Premier Tour & Travel Services in Bihar
VITE_APP_VERSION=1.0.0
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_FEEDBACK_SYSTEM=true
VITE_ENABLE_DEBUG_LOGS=false
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_ANALYTICS_ID=your_analytics_id
```

## Deployment Steps

### 1. Platform-Specific Setup

#### Vercel
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

#### Netlify
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### Traditional Hosting
1. Build the application: `npm run build`
2. Upload the `dist` folder to your web server
3. Configure your web server to serve the SPA

### 2. Build Configuration

The application uses Vite as the build tool. Build settings:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. Environment Variable Validation

The application includes built-in environment variable validation:

- Required variables are checked at startup
- Missing variables are logged in production
- Default values are provided for optional variables

### 4. Security Considerations

- Never commit `.env` files to version control
- Use `.env.example` as a template for required variables
- Ensure sensitive keys are properly secured
- Use HTTPS in production for `VITE_API_URL`

## Configuration Features

### Centralized Configuration

The application uses a centralized configuration system (`src/config/env.js`) that:

- Provides type-safe access to environment variables
- Includes default values for all variables
- Validates required variables
- Offers utility methods for common operations

### Feature Flags

Use feature flags to enable/disable functionality:

```javascript
// Example usage in components
import envConfig from '../config/env';

if (envConfig.enableNotifications) {
  // Show notification panel
}

if (envConfig.enableGoogleAuth) {
  // Show Google login button
}
```

### Asset URL Management

The configuration system automatically handles asset URLs:

```javascript
// Automatically handles relative and absolute URLs
const avatarUrl = envConfig.getAssetUrl(user.avatar);
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure variables start with `VITE_`
   - Restart development server after adding variables
   - Check for typos in variable names

2. **API connection issues**
   - Verify `VITE_API_URL` is correct
   - Check CORS configuration on backend
   - Ensure backend is accessible from frontend domain

3. **Build failures**
   - Check for missing required environment variables
   - Verify all imports are correct
   - Run `npm run build` locally to test

### Debug Mode

Enable debug logging in development:

```bash
VITE_ENABLE_DEBUG_LOGS=true
```

This will log additional information to help with troubleshooting.

## Performance Optimization

### Environment-Based Optimizations

- Debug logs are disabled in production
- API timeouts can be adjusted per environment
- Feature flags allow disabling unused functionality

### Build Optimizations

The Vite build process automatically:
- Minifies JavaScript and CSS
- Optimizes images
- Generates source maps (configurable)
- Splits code for better caching

## Monitoring and Analytics

### Built-in Monitoring

The application includes:
- Error boundary components
- API error handling
- Performance monitoring hooks

### External Analytics

Configure analytics using environment variables:
- Set `VITE_ANALYTICS_ID` for tracking
- Analytics are automatically initialized if ID is provided

## Support

For deployment issues:
1. Check this documentation
2. Verify environment variable configuration
3. Test build process locally
4. Check browser console for errors
5. Review server logs for API issues

## Version History

- v1.0.0 - Initial deployment configuration
- Environment variable system implementation
- Centralized configuration management