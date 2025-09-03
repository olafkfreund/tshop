import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { teamService } from '@/lib/team-management'

// GET /api/teams - Get user's teams
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user ID from email (simplified - in real app you'd have proper user session)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const teams = await teamService.getUserTeams(user.id)

    return NextResponse.json({
      success: true,
      teams,
    })

  } catch (error: any) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, industry, size, plan = 'TEAM' } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const team = await teamService.createTeam({
      name,
      description,
      industry,
      size,
      plan,
      createdBy: user.id,
    })

    return NextResponse.json({
      success: true,
      team,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create team' },
      { status: 500 }
    )
  }
}