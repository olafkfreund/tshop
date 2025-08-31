import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy'
  responseTime: number
  error?: string
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = performance.now()
  
  try {
    await prisma.$queryRaw`SELECT 1`
    const responseTime = performance.now() - start
    
    return {
      service: 'database',
      status: 'healthy',
      responseTime: Math.round(responseTime),
    }
  } catch (error) {
    const responseTime = performance.now() - start
    
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Math.round(responseTime),
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

async function checkExternalServices(): Promise<HealthCheck[]> {
  const checks: Promise<HealthCheck>[] = []

  // Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    checks.push(
      (async (): Promise<HealthCheck> => {
        const start = performance.now()
        try {
          const response = await fetch('https://api.stripe.com/v1/account', {
            headers: {
              'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
            signal: AbortSignal.timeout(5000),
          })
          
          const responseTime = performance.now() - start
          
          return {
            service: 'stripe',
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Math.round(responseTime),
            error: response.ok ? undefined : `HTTP ${response.status}`,
          }
        } catch (error) {
          const responseTime = performance.now() - start
          return {
            service: 'stripe',
            status: 'unhealthy',
            responseTime: Math.round(responseTime),
            error: error instanceof Error ? error.message : 'Unknown Stripe error',
          }
        }
      })()
    )
  }

  // Check Printful
  if (process.env.PRINTFUL_API_KEY) {
    checks.push(
      (async (): Promise<HealthCheck> => {
        const start = performance.now()
        try {
          const response = await fetch('https://api.printful.com/store', {
            headers: {
              'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
            },
            signal: AbortSignal.timeout(5000),
          })
          
          const responseTime = performance.now() - start
          
          return {
            service: 'printful',
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Math.round(responseTime),
            error: response.ok ? undefined : `HTTP ${response.status}`,
          }
        } catch (error) {
          const responseTime = performance.now() - start
          return {
            service: 'printful',
            status: 'unhealthy',
            responseTime: Math.round(responseTime),
            error: error instanceof Error ? error.message : 'Unknown Printful error',
          }
        }
      })()
    )
  }

  // Check Printify
  if (process.env.PRINTIFY_API_KEY) {
    checks.push(
      (async (): Promise<HealthCheck> => {
        const start = performance.now()
        try {
          const response = await fetch('https://api.printify.com/v1/shops.json', {
            headers: {
              'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`,
            },
            signal: AbortSignal.timeout(5000),
          })
          
          const responseTime = performance.now() - start
          
          return {
            service: 'printify',
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Math.round(responseTime),
            error: response.ok ? undefined : `HTTP ${response.status}`,
          }
        } catch (error) {
          const responseTime = performance.now() - start
          return {
            service: 'printify',
            status: 'unhealthy',
            responseTime: Math.round(responseTime),
            error: error instanceof Error ? error.message : 'Unknown Printify error',
          }
        }
      })()
    )
  }

  // Check Google Gemini AI
  if (process.env.GOOGLE_AI_API_KEY) {
    checks.push(
      (async (): Promise<HealthCheck> => {
        const start = performance.now()
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_API_KEY}`,
            {
              signal: AbortSignal.timeout(5000),
            }
          )
          
          const responseTime = performance.now() - start
          
          return {
            service: 'gemini',
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Math.round(responseTime),
            error: response.ok ? undefined : `HTTP ${response.status}`,
          }
        } catch (error) {
          const responseTime = performance.now() - start
          return {
            service: 'gemini',
            status: 'unhealthy',
            responseTime: Math.round(responseTime),
            error: error instanceof Error ? error.message : 'Unknown Gemini error',
          }
        }
      })()
    )
  }

  return Promise.all(checks)
}

function getSystemInfo() {
  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    node_version: process.version,
    environment: process.env.NODE_ENV,
    platform: process.platform,
    arch: process.arch,
  }
}

export async function GET() {
  const startTime = performance.now()
  
  try {
    // Run health checks in parallel
    const [databaseCheck, externalChecks] = await Promise.all([
      checkDatabase(),
      checkExternalServices(),
    ])

    const allChecks = [databaseCheck, ...externalChecks]
    const unhealthyServices = allChecks.filter(check => check.status === 'unhealthy')
    
    const overallStatus = unhealthyServices.length === 0 ? 'healthy' : 
                         unhealthyServices.length <= 1 ? 'degraded' : 'unhealthy'

    const totalTime = Math.round(performance.now() - startTime)
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalResponseTime: totalTime,
      services: allChecks,
      system: getSystemInfo(),
      summary: {
        total: allChecks.length,
        healthy: allChecks.filter(c => c.status === 'healthy').length,
        unhealthy: unhealthyServices.length,
      },
    }

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(healthData, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true',
      },
    })
  } catch (error) {
    const totalTime = Math.round(performance.now() - startTime)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      totalResponseTime: totalTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      system: getSystemInfo(),
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true',
      },
    })
  }
}

// Simple health check for load balancers
export async function HEAD() {
  try {
    // Quick database ping
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}