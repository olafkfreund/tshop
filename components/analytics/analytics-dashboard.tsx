'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Palette,
  Download,
  Calendar,
  Filter
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsDashboardProps {
  teamId: string
  userRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER'
}

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalOrders: number
    totalDesigns: number
    totalMembers: number
    conversionRate: number
    avgOrderValue: number
    revenueGrowth: number
    orderGrowth: number
  }
  revenue: {
    daily: Array<{ date: string; revenue: number; orders: number }>
    monthly: Array<{ month: string; revenue: number; orders: number }>
    byProduct: Array<{ product: string; revenue: number; orders: number }>
  }
  designs: {
    total: number
    aiGenerated: number
    aiPercentage: number
    byStatus: Array<{ status: string; count: number }>
    byCategory: Array<{ category: string; count: number }>
    trending: Array<{ id: string; title: string; uses: number; revenue: number }>
  }
  team: {
    members: number
    activeMembers: number
    designsPerMember: number
    memberActivity: Array<{ member: string; designs: number; orders: number }>
  }
  performance: {
    pageViews: number
    uniqueVisitors: number
    conversionFunnel: Array<{ step: string; count: number; percentage: number }>
    topPages: Array<{ page: string; views: number; conversions: number }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AnalyticsDashboard({ teamId, userRole }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [teamId, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?teamId=${teamId}&days=${timeRange}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/analytics/export?teamId=${teamId}&days=${timeRange}&format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${timeRange}days.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
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
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your team's performance and growth metrics
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
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {(userRole === 'OWNER' || userRole === 'ADMIN') && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => exportReport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.overview.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {data.overview.revenueGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={data.overview.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.overview.revenueGrowth).toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalOrders.toLocaleString()}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {data.overview.orderGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={data.overview.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.overview.orderGrowth).toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Designs Created</CardTitle>
            <Palette className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalDesigns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.designs.aiPercentage.toFixed(1)}% AI generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Avg. order ${data.overview.avgOrderValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="designs">Designs</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.revenue.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Design Status Distribution</CardTitle>
                <CardDescription>Current status of all designs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.designs.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.designs.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue breakdown by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.revenue.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product</CardTitle>
                <CardDescription>Which products generate the most revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenue.byProduct.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{product.product}</span>
                      <div className="text-right">
                        <div className="font-bold">${product.revenue.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{product.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="designs" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trending Designs</CardTitle>
                <CardDescription>Most popular designs by usage and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.designs.trending.map((design, index) => (
                    <div key={design.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{design.title}</span>
                        <div className="text-sm text-muted-foreground">{design.uses} uses</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${design.revenue.toFixed(2)}</div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Design Categories</CardTitle>
                <CardDescription>Popular design categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.designs.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Individual member contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.team.memberActivity.map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{member.member}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold">{member.designs}</div>
                        <div className="text-muted-foreground">Designs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{member.orders}</div>
                        <div className="text-muted-foreground">Orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey from visit to purchase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.conversionFunnel.map((step, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{step.step}</span>
                      <div className="flex items-center space-x-2">
                        <div className="font-bold">{step.count.toLocaleString()}</div>
                        <Badge variant="secondary">{step.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages and their conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{page.page}</span>
                      <div className="text-right">
                        <div className="font-bold">{page.views.toLocaleString()} views</div>
                        <div className="text-sm text-muted-foreground">
                          {page.conversions} conversions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}