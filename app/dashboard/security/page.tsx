'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import SecurityDashboard from '@/components/security/security-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Building2, Plus, AlertTriangle } from 'lucide-react'

interface Team {
  id: string
  name: string
  slug: string
  plan: string
  memberCount: number
  role: string
}

export default function SecurityPage() {
  const { data: session, status } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchTeams()
    }
  }, [status])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const result = await response.json()
        const userTeams = result.teams.filter((team: any) => 
          ['OWNER', 'ADMIN', 'MANAGER'].includes(team.role)
        )
        setTeams(userTeams)
        if (userTeams.length > 0 && !selectedTeam) {
          setSelectedTeam(userTeams[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">No Teams Found</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You need to be a team owner, admin, or manager to access security features.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span>Security features are only available for Business and Enterprise plans</span>
          </div>
          <Button asChild>
            <a href="/teams/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </a>
          </Button>
        </div>
      </div>
    )
  }

  const selectedTeamData = teams.find(team => team.id === selectedTeam)

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Team Selection */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Shield className="w-8 h-8" />
            <span>Security & Compliance</span>
          </h1>
          <p className="text-muted-foreground">
            Monitor security, compliance, and audit activities
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedTeam || ''} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center space-x-2">
                    <span>{team.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {team.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Info */}
      {selectedTeamData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>{selectedTeamData.name}</span>
              <Badge variant={selectedTeamData.plan === 'ENTERPRISE' ? 'default' : 'secondary'}>
                {selectedTeamData.plan}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span>{selectedTeamData.memberCount} members</span>
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="outline">
                  {selectedTeamData.role}
                </Badge>
              </div>
              {selectedTeamData.plan === 'TEAM' && (
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Upgrade to Business plan for advanced security features</span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Security Dashboard */}
      {selectedTeam && selectedTeamData && (
        <>
          {selectedTeamData.plan === 'TEAM' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span>Security Features Limited</span>
                </CardTitle>
                <CardDescription>
                  Advanced security and compliance features are available with Business and Enterprise plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Basic security features like audit logs and incident tracking are available, 
                    but advanced compliance policies and security monitoring require a plan upgrade.
                  </p>
                  <div className="flex space-x-4">
                    <Button asChild>
                      <a href="/teams/billing">Upgrade Plan</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/pricing">View Pricing</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SecurityDashboard 
              teamId={selectedTeam} 
              userRole={selectedTeamData?.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER'} 
            />
          )}
        </>
      )}
    </div>
  )
}