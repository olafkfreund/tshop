import { prisma } from '@/lib/db'
import { auditLogger, AuditAction, AuditResourceType, AuditSeverity } from '@/lib/audit-logger'

export interface CompliancePolicyRule {
  type: string
  condition: any
  action: 'ALLOW' | 'DENY' | 'WARN' | 'REQUIRE_APPROVAL'
  parameters?: any
}

export interface DataRetentionRule {
  dataType: 'DESIGNS' | 'ORDERS' | 'AUDIT_LOGS' | 'USER_DATA' | 'ANALYTICS'
  retentionPeriodDays: number
  autoDelete: boolean
  archiveBeforeDelete: boolean
  conditions?: any[]
}

export interface ComplianceCheckResult {
  compliant: boolean
  violations: Array<{
    policyId: string
    policyName: string
    violationType: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description: string
    details: any
  }>
  warnings: Array<{
    message: string
    recommendation: string
  }>
}

class ComplianceManager {
  /**
   * Check compliance for a specific action
   */
  async checkCompliance(
    teamId: string,
    action: string,
    resourceType: string,
    context: any,
    userId?: string
  ): Promise<ComplianceCheckResult> {
    try {
      // Get active policies for the team
      const policies = await prisma.compliancePolicy.findMany({
        where: {
          teamId,
          isActive: true,
          OR: [
            { effectiveFrom: { lte: new Date() } },
            { effectiveFrom: null },
          ],
          OR: [
            { expiresAt: { gte: new Date() } },
            { expiresAt: null },
          ],
        },
      })

      const result: ComplianceCheckResult = {
        compliant: true,
        violations: [],
        warnings: [],
      }

      for (const policy of policies) {
        const policyRules = JSON.parse(policy.rules) as CompliancePolicyRule[]
        
        for (const rule of policyRules) {
          const checkResult = await this.evaluateRule(rule, action, resourceType, context, userId)
          
          if (!checkResult.compliant) {
            result.compliant = false
            result.violations.push({
              policyId: policy.id,
              policyName: policy.name,
              violationType: checkResult.violationType,
              severity: checkResult.severity,
              description: checkResult.description,
              details: checkResult.details,
            })

            // Log compliance violation
            await this.logViolation(policy.id, teamId, userId, checkResult)
          }

          if (checkResult.warnings) {
            result.warnings.push(...checkResult.warnings)
          }
        }
      }

      return result

    } catch (error) {
      console.error('Error checking compliance:', error)
      return {
        compliant: false,
        violations: [{
          policyId: 'system',
          policyName: 'System Error',
          violationType: 'COMPLIANCE_CHECK_FAILED',
          severity: 'HIGH',
          description: 'Failed to check compliance due to system error',
          details: { error: error.message },
        }],
        warnings: [],
      }
    }
  }

  /**
   * Create a new compliance policy
   */
  async createPolicy(
    teamId: string,
    policyData: {
      policyType: string
      name: string
      description?: string
      rules: CompliancePolicyRule[]
      isRequired?: boolean
      effectiveFrom?: Date
      expiresAt?: Date
    },
    createdBy: string
  ) {
    const policy = await prisma.compliancePolicy.create({
      data: {
        teamId,
        policyType: policyData.policyType,
        name: policyData.name,
        description: policyData.description,
        rules: JSON.stringify(policyData.rules),
        isRequired: policyData.isRequired || false,
        effectiveFrom: policyData.effectiveFrom || new Date(),
        expiresAt: policyData.expiresAt,
        createdBy,
      },
    })

    // Log policy creation
    await auditLogger.log({
      userId: createdBy,
      teamId,
      action: AuditAction.INTEGRATION_CONFIGURED,
      resourceType: AuditResourceType.SYSTEM,
      resourceId: policy.id,
      details: {
        policyType: policyData.policyType,
        policyName: policyData.name,
        isRequired: policyData.isRequired,
      },
      severity: AuditSeverity.MEDIUM,
    })

    return policy
  }

  /**
   * Evaluate a specific compliance rule
   */
  private async evaluateRule(
    rule: CompliancePolicyRule,
    action: string,
    resourceType: string,
    context: any,
    userId?: string
  ): Promise<{
    compliant: boolean
    violationType: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description: string
    details: any
    warnings?: Array<{ message: string; recommendation: string }>
  }> {
    const warnings = []

    switch (rule.type) {
      case 'DATA_ACCESS_CONTROL':
        return this.evaluateDataAccessRule(rule, action, resourceType, context, userId)
      
      case 'TIME_RESTRICTION':
        return this.evaluateTimeRestrictionRule(rule, action, context)
      
      case 'IP_RESTRICTION':
        return this.evaluateIPRestrictionRule(rule, context)
      
      case 'SENSITIVE_DATA_PROTECTION':
        return this.evaluateSensitiveDataRule(rule, action, resourceType, context)
      
      case 'RETENTION_COMPLIANCE':
        return this.evaluateRetentionRule(rule, action, resourceType, context)
      
      case 'EXPORT_CONTROL':
        return this.evaluateExportControlRule(rule, action, context)
      
      default:
        return {
          compliant: false,
          violationType: 'UNKNOWN_RULE_TYPE',
          severity: 'MEDIUM',
          description: `Unknown compliance rule type: ${rule.type}`,
          details: { ruleType: rule.type },
        }
    }
  }

  private async evaluateDataAccessRule(rule: CompliancePolicyRule, action: string, resourceType: string, context: any, userId?: string) {
    // Example: Restrict access to sensitive design data
    if (rule.condition.restrictedActions?.includes(action) && 
        rule.condition.restrictedResources?.includes(resourceType)) {
      
      if (!userId || !rule.condition.allowedRoles?.includes(context.userRole)) {
        return {
          compliant: false,
          violationType: 'UNAUTHORIZED_ACCESS',
          severity: 'HIGH',
          description: `Unauthorized access attempt to ${resourceType} via ${action}`,
          details: { action, resourceType, userRole: context.userRole },
        }
      }
    }

    return { compliant: true, violationType: '', severity: 'LOW', description: '', details: {} }
  }

  private async evaluateTimeRestrictionRule(rule: CompliancePolicyRule, action: string, context: any) {
    const now = new Date()
    const currentHour = now.getHours()
    
    if (rule.condition.restrictedHours) {
      const [startHour, endHour] = rule.condition.restrictedHours
      if (currentHour >= startHour && currentHour <= endHour) {
        return {
          compliant: false,
          violationType: 'TIME_RESTRICTION_VIOLATION',
          severity: 'MEDIUM',
          description: `Action ${action} not allowed during restricted hours ${startHour}:00-${endHour}:00`,
          details: { currentHour, restrictedHours: rule.condition.restrictedHours },
        }
      }
    }

    return { compliant: true, violationType: '', severity: 'LOW', description: '', details: {} }
  }

  private async evaluateIPRestrictionRule(rule: CompliancePolicyRule, context: any) {
    const clientIP = context.ipAddress
    
    if (rule.condition.allowedIPs && clientIP) {
      const isAllowed = rule.condition.allowedIPs.some((allowedIP: string) => {
        // Simple IP range check (would need more sophisticated logic for CIDR)
        return clientIP.startsWith(allowedIP.split('*')[0])
      })

      if (!isAllowed) {
        return {
          compliant: false,
          violationType: 'IP_RESTRICTION_VIOLATION',
          severity: 'HIGH',
          description: `Access denied from unauthorized IP address: ${clientIP}`,
          details: { clientIP, allowedIPs: rule.condition.allowedIPs },
        }
      }
    }

    return { compliant: true, violationType: '', severity: 'LOW', description: '', details: {} }
  }

  private async evaluateSensitiveDataRule(rule: CompliancePolicyRule, action: string, resourceType: string, context: any) {
    // Check for sensitive data patterns in content
    if (action === 'CREATE' || action === 'UPDATE') {
      const sensitivePatterns = rule.condition.sensitivePatterns || []
      const content = JSON.stringify(context.data || {})
      
      for (const pattern of sensitivePatterns) {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(content)) {
          return {
            compliant: false,
            violationType: 'SENSITIVE_DATA_DETECTED',
            severity: 'CRITICAL',
            description: `Sensitive data pattern detected: ${pattern}`,
            details: { pattern, resourceType },
          }
        }
      }
    }

    return { compliant: true, violationType: '', severity: 'LOW', description: '', details: {} }
  }

  private async evaluateRetentionRule(rule: CompliancePolicyRule, action: string, resourceType: string, context: any) {
    // Check if data exceeds retention period
    if (action === 'READ' && context.createdAt) {
      const dataAge = Date.now() - new Date(context.createdAt).getTime()
      const maxAge = rule.condition.retentionPeriodDays * 24 * 60 * 60 * 1000
      
      if (dataAge > maxAge) {
        return {
          compliant: false,
          violationType: 'DATA_RETENTION_VIOLATION',
          severity: 'MEDIUM',
          description: `Data exceeds retention period of ${rule.condition.retentionPeriodDays} days`,
          details: { dataAge: Math.floor(dataAge / (24 * 60 * 60 * 1000)), maxAgeDays: rule.condition.retentionPeriodDays },
        }
      }
    }

    return { compliant: true, violationType: '', severity: 'LOW', description: '', details: {} }
  }

  private async evaluateExportControlRule(rule: CompliancePolicyRule, action: string, context: any) {
    if (action === 'EXPORT' || action === 'DOWNLOAD') {
      const exportSize = context.exportSize || 0
      const maxExportSize = rule.condition.maxExportSizeMB || 100
      
      if (exportSize > maxExportSize * 1024 * 1024) {
        return {
          compliant: false,
          violationType: 'EXPORT_SIZE_VIOLATION',
          severity: 'HIGH',
          description: `Export size ${Math.round(exportSize / 1024 / 1024)}MB exceeds limit of ${maxExportSize}MB`,
          details: { exportSizeMB: Math.round(exportSize / 1024 / 1024), maxSizeMB: maxExportSize },
        }
      }

      // Check export frequency
      if (context.recentExports && rule.condition.maxExportsPerHour) {
        const recentCount = context.recentExports.filter((exp: any) => 
          Date.now() - new Date(exp.createdAt).getTime() < 60 * 60 * 1000
        ).length

        if (recentCount >= rule.condition.maxExportsPerHour) {
          return {
            compliant: false,
            violationType: 'EXPORT_FREQUENCY_VIOLATION',
            severity: 'MEDIUM',
            description: `Export frequency limit exceeded: ${recentCount}/${rule.condition.maxExportsPerHour} per hour`,
            details: { recentExports: recentCount, maxPerHour: rule.condition.maxExportsPerHour },
          }
        }
      }
    }

    return { compliant: true, violationType: '', severity: 'LOW', description: '', details: {} }
  }

  /**
   * Log a compliance violation
   */
  private async logViolation(policyId: string, teamId: string, userId: string | undefined, violation: any) {
    try {
      await prisma.complianceViolation.create({
        data: {
          policyId,
          teamId,
          userId,
          violationType: violation.violationType,
          severity: violation.severity,
          title: violation.description,
          description: violation.description,
          details: JSON.stringify(violation.details),
          detectedAt: new Date(),
        },
      })

      // Also log to audit trail
      if (userId) {
        await auditLogger.log({
          userId,
          teamId,
          action: AuditAction.SECURITY_VIOLATION,
          resourceType: AuditResourceType.SYSTEM,
          resourceId: policyId,
          details: violation.details,
          severity: violation.severity === 'CRITICAL' ? AuditSeverity.CRITICAL : AuditSeverity.HIGH,
        })
      }

    } catch (error) {
      console.error('Failed to log compliance violation:', error)
    }
  }

  /**
   * Get team compliance status
   */
  async getTeamComplianceStatus(teamId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [policies, violations] = await Promise.all([
      prisma.compliancePolicy.findMany({
        where: { teamId, isActive: true },
      }),
      prisma.complianceViolation.findMany({
        where: {
          teamId,
          detectedAt: { gte: startDate },
        },
        include: {
          policy: {
            select: { id: true, name: true, policyType: true },
          },
        },
      }),
    ])

    const violationsByPolicy = violations.reduce((acc, violation) => {
      const policyId = violation.policyId
      if (!acc[policyId]) {
        acc[policyId] = []
      }
      acc[policyId].push(violation)
      return acc
    }, {} as Record<string, any[]>)

    const violationsBySeverity = violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalPolicies: policies.length,
      requiredPolicies: policies.filter(p => p.isRequired).length,
      totalViolations: violations.length,
      openViolations: violations.filter(v => v.status === 'OPEN').length,
      violationsBySeverity,
      violationsByPolicy,
      complianceScore: Math.max(0, 100 - (violations.length * 5)), // Simple scoring
      riskLevel: this.calculateRiskLevel(violationsBySeverity),
    }
  }

  /**
   * Auto-remediate violations where possible
   */
  async autoRemediate(teamId: string) {
    const violations = await prisma.complianceViolation.findMany({
      where: {
        teamId,
        status: 'OPEN',
      },
      include: {
        policy: true,
      },
    })

    const results = {
      attempted: 0,
      successful: 0,
      failed: 0,
      actions: [] as Array<{ violationId: string; action: string; result: string }>,
    }

    for (const violation of violations) {
      results.attempted++
      
      try {
        const remediated = await this.attemptRemediation(violation)
        
        if (remediated) {
          await prisma.complianceViolation.update({
            where: { id: violation.id },
            data: {
              status: 'RESOLVED',
              resolvedAt: new Date(),
              resolution: 'Auto-remediated by system',
            },
          })
          
          results.successful++
          results.actions.push({
            violationId: violation.id,
            action: 'auto_remediated',
            result: 'success',
          })
        } else {
          results.failed++
          results.actions.push({
            violationId: violation.id,
            action: 'attempted_remediation',
            result: 'failed_no_auto_fix',
          })
        }
        
      } catch (error) {
        results.failed++
        results.actions.push({
          violationId: violation.id,
          action: 'attempted_remediation',
          result: `failed_${error.message}`,
        })
      }
    }

    return results
  }

  private async attemptRemediation(violation: any): Promise<boolean> {
    // Implement auto-remediation logic based on violation type
    switch (violation.violationType) {
      case 'DATA_RETENTION_VIOLATION':
        // Auto-archive old data
        return await this.remediateDataRetention(violation)
      
      case 'EXPORT_SIZE_VIOLATION':
        // Cancel large export or split it
        return await this.remediateExportViolation(violation)
      
      default:
        // No auto-remediation available
        return false
    }
  }

  private async remediateDataRetention(violation: any): Promise<boolean> {
    // Implementation would depend on the specific data type
    // This is a placeholder for the actual remediation logic
    console.log('Auto-remediating data retention violation:', violation.id)
    return false // Placeholder - would implement actual remediation
  }

  private async remediateExportViolation(violation: any): Promise<boolean> {
    // Implementation would cancel or modify the export
    console.log('Auto-remediating export violation:', violation.id)
    return false // Placeholder - would implement actual remediation
  }

  private calculateRiskLevel(violationsBySeverity: Record<string, number>): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const critical = violationsBySeverity.CRITICAL || 0
    const high = violationsBySeverity.HIGH || 0
    const medium = violationsBySeverity.MEDIUM || 0
    
    if (critical > 0) return 'CRITICAL'
    if (high > 2) return 'HIGH'
    if (high > 0 || medium > 5) return 'MEDIUM'
    return 'LOW'
  }
}

// Export singleton instance
export const complianceManager = new ComplianceManager()

// Default compliance policies for teams
export const DEFAULT_COMPLIANCE_POLICIES = {
  DATA_PROTECTION: {
    policyType: 'DATA_PROTECTION',
    name: 'Data Protection Policy',
    description: 'Protects sensitive user and business data',
    rules: [
      {
        type: 'SENSITIVE_DATA_PROTECTION',
        condition: {
          sensitivePatterns: [
            '\\b\\d{4}\\s*\\d{4}\\s*\\d{4}\\s*\\d{4}\\b', // Credit card patterns
            '\\b\\d{3}-\\d{2}-\\d{4}\\b', // SSN patterns
            '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', // Email patterns in content
          ],
        },
        action: 'DENY',
      },
    ],
    isRequired: true,
  },
  ACCESS_CONTROL: {
    policyType: 'ACCESS_CONTROL',
    name: 'Access Control Policy',
    description: 'Controls access to sensitive operations',
    rules: [
      {
        type: 'DATA_ACCESS_CONTROL',
        condition: {
          restrictedActions: ['DELETE', 'EXPORT', 'BULK_OPERATION'],
          restrictedResources: ['USER', 'TEAM', 'ORDER'],
          allowedRoles: ['OWNER', 'ADMIN'],
        },
        action: 'REQUIRE_APPROVAL',
      },
    ],
    isRequired: true,
  },
}