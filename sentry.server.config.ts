// This file configures the initialization of Sentry on the server side.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Profiling
  profilesSampleRate: 0.1,
  
  // Only run in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Configure environment
  environment: process.env.NODE_ENV,
  
  // Filtering and privacy
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message) {
        // Don't send errors containing sensitive information
        const sensitivePatterns = [
          'API_KEY',
          'SECRET',
          'PASSWORD',
          'TOKEN',
          'PRIVATE_KEY'
        ];
        
        for (const pattern of sensitivePatterns) {
          if (error.message.includes(pattern)) {
            return null;
          }
        }
      }
    }
    return event;
  },
  
  // Set context
  initialScope: {
    tags: {
      component: 'server'
    }
  },
  
  // Integrations
  integrations: [
    // Add profiling integration
    new Sentry.ProfilingIntegration()
  ]
})