/**
 * Team management service for B2B collaboration features
 * Handles team creation, member management, permissions, and collaboration workflows
 */

import { prisma } from '@/lib/db'
import { analytics } from '@/lib/analytics'
import crypto from 'crypto'

export interface Team {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  industry?: string
  size?: TeamSize
  plan: TeamPlan
  billingEmail?: string
  monthlyAILimit: number
  storageLimit: number
  memberLimit: number
  customBranding?: any
  whiteLabel: boolean
  requireApproval: boolean
  allowPublicDesigns: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  memberCount?: number
  designCount?: number
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  permissions: string[]
  joinedAt: Date
  lastActiveAt?: Date
  designCount: number
  orderCount: number
  user?: {
    id: string
    name?: string
    email: string
    avatar?: string
  }
}

export interface TeamInvite {
  id: string
  teamId: string
  email: string
  role: TeamRole
  invitedBy: string
  token: string
  status: InviteStatus
  expiresAt: Date
  createdAt: Date
  acceptedAt?: Date
}

export type TeamSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE'
export type TeamPlan = 'TEAM' | 'BUSINESS' | 'ENTERPRISE'
export type TeamRole = 'OWNER' | 'ADMIN' | 'DESIGNER' | 'MEMBER' | 'VIEWER'
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export const TEAM_PERMISSIONS = {
  // Design permissions
  CREATE_DESIGNS: 'create_designs',
  EDIT_ALL_DESIGNS: 'edit_all_designs',
  DELETE_DESIGNS: 'delete_designs',
  APPROVE_DESIGNS: 'approve_designs',
  PUBLISH_DESIGNS: 'publish_designs',
  
  // Order permissions
  CREATE_ORDERS: 'create_orders',
  APPROVE_ORDERS: 'approve_orders',
  VIEW_ALL_ORDERS: 'view_all_orders',
  
  // Team permissions
  INVITE_MEMBERS: 'invite_members',
  MANAGE_MEMBERS: 'manage_members',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Billing permissions
  MANAGE_BILLING: 'manage_billing',
  VIEW_USAGE: 'view_usage',
} as const

export const DEFAULT_ROLE_PERMISSIONS = {
  OWNER: Object.values(TEAM_PERMISSIONS),
  ADMIN: [
    TEAM_PERMISSIONS.CREATE_DESIGNS,
    TEAM_PERMISSIONS.EDIT_ALL_DESIGNS,
    TEAM_PERMISSIONS.DELETE_DESIGNS,
    TEAM_PERMISSIONS.APPROVE_DESIGNS,
    TEAM_PERMISSIONS.CREATE_ORDERS,
    TEAM_PERMISSIONS.APPROVE_ORDERS,
    TEAM_PERMISSIONS.VIEW_ALL_ORDERS,
    TEAM_PERMISSIONS.INVITE_MEMBERS,
    TEAM_PERMISSIONS.MANAGE_MEMBERS,
    TEAM_PERMISSIONS.VIEW_ANALYTICS,
    TEAM_PERMISSIONS.VIEW_USAGE,
  ],
  DESIGNER: [
    TEAM_PERMISSIONS.CREATE_DESIGNS,
    TEAM_PERMISSIONS.CREATE_ORDERS,
  ],
  MEMBER: [
    TEAM_PERMISSIONS.CREATE_DESIGNS,
    TEAM_PERMISSIONS.CREATE_ORDERS,
  ],
  VIEWER: [],
}

class TeamService {
  // Create a new team
  async createTeam({
    name,
    description,
    industry,
    size,
    plan = 'TEAM',
    createdBy,
  }: {
    name: string
    description?: string
    industry?: string
    size?: TeamSize
    plan?: TeamPlan
    createdBy: string
  }): Promise<Team> {
    const slug = this.generateSlug(name)
    
    const team = await prisma.team.create({
      data: {
        name,
        slug,
        description,
        industry,
        size,
        plan,
        createdBy,
        monthlyAILimit: this.getPlanLimits(plan).aiLimit,
        storageLimit: this.getPlanLimits(plan).storageLimit,
        memberLimit: this.getPlanLimits(plan).memberLimit,
      },
    })

    // Add creator as owner
    await this.addTeamMember({
      teamId: team.id,
      userId: createdBy,
      role: 'OWNER',
      addedBy: createdBy,
    })

    // Track team creation
    analytics.trackEvent({
      action: 'team_created',
      category: 'teams',
      label: plan,
      custom_parameters: {
        team_id: team.id,
        team_size: size,
        industry,
      },
    })

    return team as Team
  }

  // Get team by ID with member count
  async getTeam(teamId: string, includeStats = false): Promise<Team | null> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: includeStats ? {
          members: true,
          designs: true,
        } : undefined,
      },
    })

    if (!team) return null

    return {
      ...team,
      memberCount: team._count?.members,
      designCount: team._count?.designs,
    } as Team
  }

  // Get user's teams
  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: {
              members: true,
              designs: true,
            },
          },
        },
      },
    })

    return memberships.map(membership => ({
      ...membership.team,
      memberCount: membership.team._count.members,
      designCount: membership.team._count.designs,
    })) as Team[]
  }

  // Add team member
  async addTeamMember({
    teamId,
    userId,
    role,
    addedBy,
    permissions,
  }: {
    teamId: string
    userId: string
    role: TeamRole
    addedBy: string
    permissions?: string[]
  }): Promise<TeamMember> {
    // Check if user can add members
    await this.checkPermission(addedBy, teamId, TEAM_PERMISSIONS.INVITE_MEMBERS)

    // Check member limit
    const team = await this.getTeam(teamId, true)
    if (team && team.memberCount && team.memberCount >= team.memberLimit) {
      throw new Error('Team member limit reached')
    }

    const defaultPermissions = permissions || DEFAULT_ROLE_PERMISSIONS[role]

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
        permissions: JSON.stringify(defaultPermissions),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Update user's primary team if they don't have one
    await prisma.user.updateMany({
      where: {
        id: userId,
        primaryTeamId: null,
      },
      data: {
        primaryTeamId: teamId,
      },
    })

    analytics.trackEvent({
      action: 'team_member_added',
      category: 'teams',
      label: role,
      custom_parameters: {
        team_id: teamId,
        user_id: userId,
        added_by: addedBy,
      },
    })

    return {
      ...member,
      permissions: JSON.parse(member.permissions),
    } as TeamMember
  }

  // Invite team member
  async inviteTeamMember({
    teamId,
    email,
    role,
    invitedBy,
  }: {
    teamId: string
    email: string
    role: TeamRole
    invitedBy: string
  }): Promise<TeamInvite> {
    // Check if user can invite members
    await this.checkPermission(invitedBy, teamId, TEAM_PERMISSIONS.INVITE_MEMBERS)

    // Check if already invited or member
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        email,
        status: 'PENDING',
      },
    })

    if (existingInvite) {
      throw new Error('User already invited')
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: existingUser.id,
        },
      })

      if (existingMember) {
        throw new Error('User is already a team member')
      }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        invitedBy,
        token,
        expiresAt,
      },
    })

    // Send invitation email (implement your email service)
    await this.sendInviteEmail(invite, teamId)

    analytics.trackEvent({
      action: 'team_invite_sent',
      category: 'teams',
      label: role,
      custom_parameters: {
        team_id: teamId,
        invited_by: invitedBy,
      },
    })

    return invite as TeamInvite
  }

  // Accept team invite
  async acceptInvite(token: string, userId: string): Promise<TeamMember> {
    const invite = await prisma.teamInvite.findUnique({
      where: { token },
    })

    if (!invite || invite.status !== 'PENDING') {
      throw new Error('Invalid or expired invite')
    }

    if (invite.expiresAt < new Date()) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })
      throw new Error('Invite has expired')
    }

    // Add user to team
    const member = await this.addTeamMember({
      teamId: invite.teamId,
      userId,
      role: invite.role,
      addedBy: invite.invitedBy,
    })

    // Update invite status
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    })

    return member
  }

  // Update team member role
  async updateMemberRole({
    teamId,
    userId,
    newRole,
    updatedBy,
  }: {
    teamId: string
    userId: string
    newRole: TeamRole
    updatedBy: string
  }): Promise<TeamMember> {
    await this.checkPermission(updatedBy, teamId, TEAM_PERMISSIONS.MANAGE_MEMBERS)

    const newPermissions = DEFAULT_ROLE_PERMISSIONS[newRole]

    const member = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        role: newRole,
        permissions: JSON.stringify(newPermissions),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return {
      ...member,
      permissions: JSON.parse(member.permissions),
    } as TeamMember
  }

  // Check if user has permission
  async checkPermission(
    userId: string,
    teamId: string,
    permission: string
  ): Promise<boolean> {
    const member = await prisma.teamMember.findFirst({
      where: {
        userId,
        teamId,
      },
    })

    if (!member) {
      throw new Error('User is not a member of this team')
    }

    const permissions = JSON.parse(member.permissions)
    return permissions.includes(permission)
  }

  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' },
      ],
    })

    return members.map(member => ({
      ...member,
      permissions: JSON.parse(member.permissions),
    })) as TeamMember[]
  }

  // Remove team member
  async removeTeamMember({
    teamId,
    userId,
    removedBy,
  }: {
    teamId: string
    userId: string
    removedBy: string
  }): Promise<void> {
    await this.checkPermission(removedBy, teamId, TEAM_PERMISSIONS.MANAGE_MEMBERS)

    // Can't remove team owner
    const member = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    })

    if (member?.role === 'OWNER') {
      throw new Error('Cannot remove team owner')
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    // Update user's primary team if this was their primary team
    await prisma.user.updateMany({
      where: {
        id: userId,
        primaryTeamId: teamId,
      },
      data: {
        primaryTeamId: null,
      },
    })

    analytics.trackEvent({
      action: 'team_member_removed',
      category: 'teams',
      custom_parameters: {
        team_id: teamId,
        user_id: userId,
        removed_by: removedBy,
      },
    })
  }

  // Helper methods
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 8)
    return `${baseSlug}-${suffix}`
  }

  private getPlanLimits(plan: TeamPlan) {
    const limits = {
      TEAM: {
        aiLimit: 500,
        storageLimit: 10000, // 10GB
        memberLimit: 25,
      },
      BUSINESS: {
        aiLimit: 2000,
        storageLimit: 50000, // 50GB
        memberLimit: 100,
      },
      ENTERPRISE: {
        aiLimit: 10000,
        storageLimit: 200000, // 200GB
        memberLimit: 500,
      },
    }

    return limits[plan]
  }

  private async sendInviteEmail(invite: TeamInvite, teamId: string): Promise<void> {
    // Implement email sending logic
    // This would integrate with your email service (SendGrid, Resend, etc.)
    console.log(`Sending invite email to ${invite.email} for team ${teamId}`)
    
    // Example email content:
    // Subject: You're invited to join [Team Name] on TShop
    // Body: [Inviter] has invited you to collaborate on custom designs...
    // CTA: Accept Invitation -> /teams/invite/[token]
  }
}

export const teamService = new TeamService()