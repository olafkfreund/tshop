'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  FileText, 
  Activity,
  Download,
  Eye,
  AlertCircle,
  Lock
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface SecurityDashboardProps {
  teamId: string
  userRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER'
}

interface SecurityData {
  overview: {
    complianceScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    totalPolicies: number
    activeIncidents: number
    recentViolations: number
    auditEvents: number
  }
  compliance: {
    totalPolicies: number
    requiredPolicies: number
    totalViolations: number
    openViolations: number
    violationsBySeverity: Record<string, number>
    complianceScore: number
    riskLevel: string
  }
  incidents: Array<{
    id: string
    type: string
    severity: string
    title: string
    status: string
    detectedAt: string
    assignee?: { name: string; email: string }
  }>
  policies: Array<{
    id: string
    name: string
    policyType: string
    isActive: boolean
    isRequired: boolean
    violationCount: number
  }>
  auditLogs: Array<{
    id: string
    action: string
    severity: string
    timestamp: string
    user?: { name: string; email: string }
  }>
  violations: Array<{
    id: string
    violationType: string
    severity: string
    title: string
    status: string
    detectedAt: string
    policy: { name: string }
  }>
}

const SEVERITY_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#DC2626',
}

const RISK_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#DC2626',
}

export default function SecurityDashboard({ teamId, userRole }: SecurityDashboardProps) {
  const [data, setData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchSecurityData()
  }, [teamId, timeRange])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      
      // Parallel fetch all security data
      const [complianceRes, incidentsRes, auditLogsRes] = await Promise.all([
        fetch(`/api/security/compliance?teamId=${teamId}&days=${timeRange}`),
        fetch(`/api/security/incidents?teamId=${teamId}&status=OPEN`),
        fetch(`/api/security/audit-logs?teamId=${teamId}&limit=20`),
      ])

      const [complianceData, incidentsData, auditData] = await Promise.all([
        complianceRes.ok ? complianceRes.json() : { data: null },
        incidentsRes.ok ? incidentsRes.json() : { data: null },
        auditData.ok ? auditLogsRes.json() : { data: null },
      ])

      // Combine data
      const securityData: SecurityData = {
        overview: {
          complianceScore: complianceData.data?.complianceStatus?.complianceScore || 0,
          riskLevel: complianceData.data?.complianceStatus?.riskLevel || 'LOW',
          totalPolicies: complianceData.data?.policies?.length || 0,
          activeIncidents: incidentsData.data?.incidents?.length || 0,
          recentViolations: complianceData.data?.violations?.length || 0,
          auditEvents: auditData.data?.logs?.length || 0,
        },
        compliance: complianceData.data?.complianceStatus || {},
        incidents: incidentsData.data?.incidents || [],
        policies: complianceData.data?.policies || [],
        auditLogs: auditData.data?.logs || [],
        violations: complianceData.data?.violations || [],
      }

      setData(securityData)
      
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportSecurityReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/security/export?teamId=${teamId}&days=${timeRange}&format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-report-${timeRange}days.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting security report:', error)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center space-x-2">
            <Shield className="w-6 h-6" />
            <span>Security Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            Monitor security compliance and incidents
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full md:w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          {(userRole === 'OWNER' || userRole === 'ADMIN') && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => exportSecurityReport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => exportSecurityReport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Security Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Score</span>
          </CardTitle>
          <CardDescription>Overall security and compliance rating</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-primary">
                {data.overview.complianceScore}
              </div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>
            <Badge 
              variant={data.overview.riskLevel === 'LOW' ? 'default' : 
                     data.overview.riskLevel === 'MEDIUM' ? 'secondary' : 'destructive'}
              className="text-lg px-3 py-1"
            >
              {data.overview.riskLevel} RISK
            </Badge>
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold">{data.overview.totalPolicies}</div>
              <div className="text-xs text-muted-foreground">Policies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-500">{data.overview.activeIncidents}</div>
              <div className="text-xs text-muted-foreground">Open Incidents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-yellow-500">{data.overview.recentViolations}</div>
              <div className="text-xs text-muted-foreground">Violations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{data.overview.auditEvents}</div>
              <div className="text-xs text-muted-foreground">Audit Events</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Incidents</CardTitle>
                <CardDescription>Recent security incidents by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.incidents.slice(0, 5).map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-sm text-muted-foreground">{incident.type}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={incident.severity === 'CRITICAL' ? 'destructive' : 
                                 incident.severity === 'HIGH' ? 'secondary' : 'outline'}
                        >
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {data.incidents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      No active security incidents
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Violations</CardTitle>
                <CardDescription>Recent compliance violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.violations.slice(0, 5).map((violation) => (
                    <div key={violation.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{violation.title}</div>
                        <div className="text-sm text-muted-foreground">{violation.policy.name}</div>
                      </div>
                      <Badge 
                        variant={violation.severity === 'CRITICAL' ? 'destructive' : 
                               violation.severity === 'HIGH' ? 'secondary' : 'outline'}
                      >
                        {violation.severity}
                      </Badge>
                    </div>
                  ))}
                  {data.violations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      No compliance violations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>All security incidents requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="font-semibold">{incident.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Type: {incident.type} • Detected: {new Date(incident.detectedAt).toLocaleDateString()}
                        </div>
                        {incident.assignee && (
                          <div className="text-sm">
                            Assigned to: {incident.assignee.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={incident.severity === 'CRITICAL' ? 'destructive' : 
                                 incident.severity === 'HIGH' ? 'secondary' : 'outline'}
                        >
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Current compliance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Compliance Score</span>
                    <span className="font-bold">{data.compliance.complianceScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Policies</span>
                    <span className="font-bold">{data.compliance.totalPolicies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required Policies</span>
                    <span className="font-bold">{data.compliance.requiredPolicies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Open Violations</span>
                    <span className="font-bold text-red-500">{data.compliance.openViolations}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Violations by Severity</CardTitle>
                <CardDescription>Breakdown of compliance violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.compliance.violationsBySeverity || {}).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] }}
                        />
                        <span>{severity}</span>
                      </div>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Recent security-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-1">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.user?.name || 'System'} • {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge 
                      variant={log.severity === 'CRITICAL' ? 'destructive' : 
                             log.severity === 'HIGH' ? 'secondary' : 'outline'}
                    >
                      {log.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Active security and compliance policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.policies.map((policy) => (
                  <div key={policy.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-semibold">{policy.name}</span>
                          {policy.isRequired && (
                            <Badge variant="secondary" className="text-xs">REQUIRED</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Type: {policy.policyType}
                        </div>
                        <div className="text-sm">
                          Violations: <span className="font-medium">{policy.violationCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                          {policy.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                        {userRole === 'OWNER' || userRole === 'ADMIN' ? (
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}