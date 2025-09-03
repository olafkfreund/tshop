// This file configures the initialization of Sentry on the browser/client side.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Session Replay
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  
  // Only run in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Configure environment
  environment: process.env.NODE_ENV,
  
  // Filtering and privacy
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('API_KEY')) {
        return null; // Don't send API key errors
      }
    }
    return event;
  },
  
  // Set user context
  initialScope: {
    tags: {
      component: 'client'
    }
  }
})