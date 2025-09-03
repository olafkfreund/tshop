import { prisma } from '@/lib/db'

export interface AuditLogEntry {
  userId: string
  teamId?: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  severity: AuditSeverity
}

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  
  // Team Management
  TEAM_CREATED = 'TEAM_CREATED',
  TEAM_UPDATED = 'TEAM_UPDATED',
  TEAM_DELETED = 'TEAM_DELETED',
  MEMBER_INVITED = 'MEMBER_INVITED',
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  
  // Design Management
  DESIGN_CREATED = 'DESIGN_CREATED',
  DESIGN_UPDATED = 'DESIGN_UPDATED',
  DESIGN_DELETED = 'DESIGN_DELETED',
  DESIGN_SHARED = 'DESIGN_SHARED',
  DESIGN_APPROVED = 'DESIGN_APPROVED',
  DESIGN_REJECTED = 'DESIGN_REJECTED',
  
  // Data Access
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  BULK_OPERATION = 'BULK_OPERATION',
  
  // Security Events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // System Events
  WEBHOOK_CREATED = 'WEBHOOK_CREATED',
  WEBHOOK_UPDATED = 'WEBHOOK_UPDATED',
  WEBHOOK_DELETED = 'WEBHOOK_DELETED',
  INTEGRATION_CONFIGURED = 'INTEGRATION_CONFIGURED',
}

export enum AuditResourceType {
  USER = 'USER',
  TEAM = 'TEAM',
  DESIGN = 'DESIGN',
  ORDER = 'ORDER',
  API_KEY = 'API_KEY',
  WEBHOOK = 'WEBHOOK',
  SYSTEM = 'SYSTEM',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

class AuditLogger {
  /**
   * Log a security audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          teamId: entry.teamId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: JSON.stringify(entry.details),
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          severity: entry.severity,
          timestamp: new Date(),
        },
      })

      // For critical events, also trigger alerts
      if (entry.severity === AuditSeverity.CRITICAL) {
        await this.triggerSecurityAlert(entry)
      }

    } catch (error) {
      console.error('Failed to log audit entry:', error)
      // Don't throw - audit logging should never break application flow
    }
  }

  /**
   * Bulk log multiple audit entries
   */
  async logBatch(entries: AuditLogEntry[]): Promise<void> {
    try {
      await prisma.auditLog.createMany({
        data: entries.map(entry => ({
          userId: entry.userId,
          teamId: entry.teamId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: JSON.stringify(entry.details),
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          severity: entry.severity,
          timestamp: new Date(),
        })),
      })

    } catch (error) {
      console.error('Failed to log audit batch:', error)
    }
  }

  /**
   * Query audit logs with filters
   */
  async query(filters: {
    userId?: string
    teamId?: string
    action?: AuditAction
    resourceType?: AuditResourceType
    resourceId?: string
    severity?: AuditSeverity
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.teamId) where.teamId = filters.teamId
    if (filters.action) where.action = filters.action
    if (filters.resourceType) where.resourceType = filters.resourceType
    if (filters.resourceId) where.resourceId = filters.resourceId
    if (filters.severity) where.severity = filters.severity

    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    return await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })
  }

  /**
   * Get audit statistics for a team
   */
  async getTeamAuditStats(teamId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.auditLog.findMany({
      where: {
        teamId,
        timestamp: { gte: startDate },
      },
      select: {
        action: true,
        severity: true,
        timestamp: true,
      },
    })

    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const severityCounts = logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const dailyStats = this.groupLogsByDay(logs, days)

    return {
      totalEvents: logs.length,
      actionBreakdown: actionCounts,
      severityBreakdown: severityCounts,
      dailyActivity: dailyStats,
      criticalEvents: logs.filter(log => log.severity === AuditSeverity.CRITICAL).length,
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(userId: string, teamId?: string): Promise<{
    suspiciousPatterns: Array<{
      type: string
      description: string
      severity: AuditSeverity
      details: any
    }>
  }> {
    const lookbackHours = 24
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - lookbackHours)

    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        teamId,
        timestamp: { gte: startTime },
      },
      orderBy: { timestamp: 'desc' },
    })

    const suspiciousPatterns = []

    // Pattern 1: Multiple failed login attempts
    const failedLogins = recentLogs.filter(log => log.action === AuditAction.LOGIN_FAILED)
    if (failedLogins.length >= 5) {
      suspiciousPatterns.push({
        type: 'BRUTE_FORCE_ATTEMPT',
        description: `${failedLogins.length} failed login attempts in ${lookbackHours} hours`,
        severity: AuditSeverity.HIGH,
        details: { attempts: failedLogins.length, timeRange: `${lookbackHours}h` },
      })
    }

    // Pattern 2: Unusual data export activity
    const dataExports = recentLogs.filter(log => log.action === AuditAction.DATA_EXPORTED)
    if (dataExports.length >= 3) {
      suspiciousPatterns.push({
        type: 'EXCESSIVE_DATA_EXPORT',
        description: `${dataExports.length} data export operations in ${lookbackHours} hours`,
        severity: AuditSeverity.MEDIUM,
        details: { exports: dataExports.length, timeRange: `${lookbackHours}h` },
      })
    }

    // Pattern 3: Multiple IP addresses for same user
    const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress).filter(Boolean))
    if (uniqueIPs.size >= 3) {
      suspiciousPatterns.push({
        type: 'MULTIPLE_IP_ADDRESSES',
        description: `Activity from ${uniqueIPs.size} different IP addresses`,
        severity: AuditSeverity.MEDIUM,
        details: { ipCount: uniqueIPs.size, ips: Array.from(uniqueIPs) },
      })
    }

    // Pattern 4: Rapid sequence of high-privilege actions
    const privilegedActions = [
      AuditAction.MEMBER_REMOVED,
      AuditAction.ROLE_CHANGED,
      AuditAction.API_KEY_CREATED,
      AuditAction.PERMISSION_GRANTED,
    ]
    const privilegedLogs = recentLogs.filter(log => privilegedActions.includes(log.action as AuditAction))
    if (privilegedLogs.length >= 5) {
      const timeSpan = privilegedLogs[0].timestamp.getTime() - privilegedLogs[privilegedLogs.length - 1].timestamp.getTime()
      const minutesSpan = timeSpan / (1000 * 60)
      
      if (minutesSpan <= 30) { // 5+ privileged actions in 30 minutes
        suspiciousPatterns.push({
          type: 'RAPID_PRIVILEGED_ACTIONS',
          description: `${privilegedLogs.length} privileged actions in ${Math.round(minutesSpan)} minutes`,
          severity: AuditSeverity.HIGH,
          details: { actions: privilegedLogs.length, timeSpan: `${Math.round(minutesSpan)}min` },
        })
      }
    }

    return { suspiciousPatterns }
  }

  /**
   * Trigger security alert for critical events
   */
  private async triggerSecurityAlert(entry: AuditLogEntry): Promise<void> {
    // In a real implementation, this would:
    // 1. Send notifications to security team
    // 2. Create incident tickets
    // 3. Trigger automated responses if configured
    // 4. Log to external SIEM systems
    
    console.warn('SECURITY ALERT:', {
      action: entry.action,
      severity: entry.severity,
      userId: entry.userId,
      teamId: entry.teamId,
      details: entry.details,
      timestamp: new Date().toISOString(),
    })

    // Create security incident record
    try {
      await prisma.securityIncident.create({
        data: {
          type: entry.action,
          severity: entry.severity,
          userId: entry.userId,
          teamId: entry.teamId,
          description: `Security event: ${entry.action}`,
          details: JSON.stringify(entry.details),
          status: 'OPEN',
          detectedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to create security incident:', error)
    }
  }

  /**
   * Group logs by day for trending analysis
   */
  private groupLogsByDay(logs: any[], days: number) {
    const dailyStats = []
    const today = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayLogs = logs.filter(log => 
        log.timestamp.toISOString().startsWith(dateStr)
      )

      dailyStats.push({
        date: dateStr,
        totalEvents: dayLogs.length,
        criticalEvents: dayLogs.filter(log => log.severity === AuditSeverity.CRITICAL).length,
        highSeverityEvents: dayLogs.filter(log => log.severity === AuditSeverity.HIGH).length,
      })
    }

    return dailyStats.reverse() // Oldest to newest
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

// Convenience methods for common audit events
export const logAuthEvent = (
  userId: string,
  action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.LOGIN_FAILED,
  details: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string
) => {
  return auditLogger.log({
    userId,
    action,
    resourceType: AuditResourceType.USER,
    resourceId: userId,
    details,
    ipAddress,
    userAgent,
    severity: action === AuditAction.LOGIN_FAILED ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
  })
}

export const logTeamEvent = (
  userId: string,
  teamId: string,
  action: AuditAction,
  details: Record<string, any> = {},
  severity: AuditSeverity = AuditSeverity.LOW
) => {
  return auditLogger.log({
    userId,
    teamId,
    action,
    resourceType: AuditResourceType.TEAM,
    resourceId: teamId,
    details,
    severity,
  })
}

export const logSecurityEvent = (
  userId: string,
  action: AuditAction,
  details: Record<string, any> = {},
  teamId?: string,
  severity: AuditSeverity = AuditSeverity.HIGH
) => {
  return auditLogger.log({
    userId,
    teamId,
    action,
    resourceType: AuditResourceType.SYSTEM,
    details,
    severity,
  })
}