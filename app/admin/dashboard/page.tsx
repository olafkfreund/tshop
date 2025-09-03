'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Users, 
  Bot, 
  Eye, 
  Plug2, 
  Shield, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  Database,
  Activity,
  TrendingUp,
  AlertCircle as AlertIcon
} from 'lucide-react'

interface AdminData {
  system: {
    health: {
      database: { status: string; responseTime: string }
      status: string
      application: {
        totalUsers: number
        totalTeams: number
        totalOrders: number
        totalDesigns: number
        recentErrors: number
      }
    }
    stats: {
      users: { total: number; active30d: number; newToday: number }
      revenue: { total: number; today: number }
      orders: { total: number; today: number }
      designs: { total: number; today: number }
      ai: { generationsToday: number }
      system: { errors24h: number; status: string }
    }
  }
  aiModels: {
    models: Array<{
      id: string
      name: string
      status: string
      dailyRequests: number
      dailyCost: number
      successRate: number
    }>
  }
  content: {
    overview: {
      totalDesigns: number
      pendingReview: number
      flaggedCount: number
      approvedCount: number
      aiGeneratedCount: number
    }
  }
  integrations: {
    overview: {
      totalIntegrations: number
      activeIntegrations: number
      healthyIntegrations: number
      failingIntegrations: number
    }
  }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Fetch all admin data in parallel
      const [systemRes, aiRes, contentRes, integrationsRes] = await Promise.all([
        fetch('/api/admin/system?action=health'),
        fetch('/api/admin/ai-models?action=models'),
        fetch('/api/admin/content?action=analytics'),
        fetch('/api/admin/integrations?action=list'),
      ])

      const [systemStats] = await Promise.all([
        fetch('/api/admin/system?action=stats'),
      ])

      const [systemHealth, aiModels, contentData, integrations, stats] = await Promise.all([
        systemRes.ok ? systemRes.json() : { data: null },
        aiRes.ok ? aiRes.json() : { data: { models: [] } },
        contentRes.ok ? contentRes.json() : { data: { overview: {} } },
        integrationsRes.ok ? integrationsRes.json() : { data: { integrations: [] } },
        systemStats.ok ? systemStats.json() : { data: {} },
      ])

      setData({
        system: {
          health: systemHealth.data,
          stats: stats.data,
        },
        aiModels: aiModels.data,
        content: contentData.data,
        integrations: {
          overview: {
            totalIntegrations: integrations.data?.integrations?.length || 0,
            activeIntegrations: integrations.data?.integrations?.filter((i: any) => i.status === 'active').length || 0,
            healthyIntegrations: integrations.data?.integrations?.filter((i: any) => i.health === 'healthy').length || 0,
            failingIntegrations: integrations.data?.integrations?.filter((i: any) => i.health === 'error').length || 0,
          },
        },
      })

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Settings className="w-8 h-8" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            Comprehensive system administration and monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={data.system.health.status === 'healthy' ? 'default' : 'destructive'}>
            System {data.system.health.status}
          </Badge>
          <Button onClick={fetchAdminData} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system.stats.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data.system.stats.users?.newToday || 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data.system.stats.revenue?.total || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${(data.system.stats.revenue?.today || 0).toFixed(2)} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system.stats.ai?.generationsToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Today's AI usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.system.health.status)}
              <span className="text-lg font-semibold capitalize">
                {data.system.health.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.system.stats.system?.errors24h || 0} errors (24h)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="ai">AI Models</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Core system components status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.system.health.database.status)}
                    <span className="text-sm">{data.system.health.database.responseTime}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Application</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.system.health.status)}
                    <span className="text-sm">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Services</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.aiModels.models.some(m => m.status === 'active') ? 'healthy' : 'warning')}
                    <span className="text-sm">
                      {data.aiModels.models.filter(m => m.status === 'active').length} active
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Integrations</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.integrations.overview.failingIntegrations > 0 ? 'warning' : 'healthy')}
                    <span className="text-sm">
                      {data.integrations.overview.activeIntegrations}/{data.integrations.overview.totalIntegrations} active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key platform metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.system.stats.designs?.total || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Designs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.system.stats.orders?.total || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {data.content.overview.pendingReview || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {data.content.overview.flaggedCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Flagged Content</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/admin/users')}
                  className="h-20 flex-col"
                >
                  <Users className="w-6 h-6 mb-2" />
                  <span>Manage Users</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('content')}
                  className="h-20 flex-col"
                >
                  <Eye className="w-6 h-6 mb-2" />
                  <span>Moderate Content</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('ai')}
                  className="h-20 flex-col"
                >
                  <Bot className="w-6 h-6 mb-2" />
                  <span>AI Models</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('integrations')}
                  className="h-20 flex-col"
                >
                  <Plug2 className="w-6 h-6 mb-2" />
                  <span>Integrations</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p>Access the full user management interface to view, search, and manage user accounts, roles, and permissions.</p>
                </div>
                <Button onClick={() => router.push('/admin/users')}>
                  Go to User Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Models Overview</CardTitle>
              <CardDescription>Monitor and manage AI model configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.aiModels.models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-1">
                      <div className="font-semibold">{model.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {model.dailyRequests} requests today • ${model.dailyCost.toFixed(2)} cost • {model.successRate}% success
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                        {model.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center pt-4">
                <Button onClick={() => router.push('/admin/ai-models')}>
                  Manage AI Models
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Review and moderate user-generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.content.overview.pendingReview || 0}
                  </div>
                  <div className="text-sm text-yellow-600">Pending Review</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {data.content.overview.flaggedCount || 0}
                  </div>
                  <div className="text-sm text-red-600">Flagged Content</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.content.overview.aiGeneratedCount || 0}
                  </div>
                  <div className="text-sm text-blue-600">AI Generated</div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button onClick={() => router.push('/admin/content')}>
                  Open Content Moderation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations Status</CardTitle>
              <CardDescription>Third-party services and API connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {data.integrations.overview.totalIntegrations}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.integrations.overview.activeIntegrations}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.integrations.overview.healthyIntegrations}
                  </div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {data.integrations.overview.failingIntegrations}
                  </div>
                  <div className="text-sm text-muted-foreground">Failing</div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button onClick={() => router.push('/admin/integrations')}>
                  Manage Integrations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>System settings and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Database className="w-6 h-6 mb-2" />
                  <span>Database Settings</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Shield className="w-6 h-6 mb-2" />
                  <span>Security Settings</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Zap className="w-6 h-6 mb-2" />
                  <span>Performance Settings</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertIcon className="w-6 h-6 mb-2" />
                  <span>Maintenance Mode</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}