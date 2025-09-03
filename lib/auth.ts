import NextAuth, { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { query } from '@/lib/db-direct'
import bcryptjs from 'bcryptjs'
import { z } from 'zod'

// User schema for validation
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
  emailVerified: z.date().nullable(),
})

export type User = z.infer<typeof userSchema>

// Sign in schema
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Custom user functions
async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await query('SELECT * FROM users WHERE email = $1', [email])
    if (users.length === 0) return null
    
    const user = users[0]
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.email_verified ? new Date(user.email_verified) : null,
    }
  } catch (error) {
    console.error('Error fetching user by email:', error)
    return null
  }
}

async function getUserById(id: string): Promise<User | null> {
  try {
    const users = await query('SELECT * FROM users WHERE id = $1', [id])
    if (users.length === 0) return null
    
    const user = users[0]
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.email_verified ? new Date(user.email_verified) : null,
    }
  } catch (error) {
    console.error('Error fetching user by id:', error)
    return null
  }
}

async function createUser(email: string, name?: string, hashedPassword?: string): Promise<User | null> {
  try {
    const userRows = await query(`
      INSERT INTO users (id, email, name, password, created_at, updated_at)
      VALUES (gen_random_uuid()::text, $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [email, name || null, hashedPassword || null])
    
    const user = userRows[0]
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.email_verified ? new Date(user.email_verified) : null,
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

async function updateUser(id: string, updates: Partial<{ name: string; image: string; emailVerified: Date }>): Promise<User | null> {
  try {
    const setParts = []
    const values = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      setParts.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }
    
    if (updates.image !== undefined) {
      setParts.push(`image = $${paramIndex++}`)
      values.push(updates.image)
    }
    
    if (updates.emailVerified !== undefined) {
      setParts.push(`email_verified = $${paramIndex++}`)
      values.push(updates.emailVerified)
    }

    if (setParts.length === 0) {
      return await getUserById(id)
    }

    setParts.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id) // for WHERE clause

    const userRows = await query(`
      UPDATE users SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values)
    
    if (userRows.length === 0) return null
    
    const user = userRows[0]
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.email_verified ? new Date(user.email_verified) : null,
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return null
  }
}

// NextAuth configuration
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnAuthPage = nextUrl.pathname.startsWith('/auth')
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isOnAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }
      
      return true
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // GitHub OAuth provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    
    // Credentials provider for email/password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const validation = signInSchema.safeParse(credentials)
        if (!validation.success) {
          return null
        }

        const { email, password } = validation.data
        
        const user = await getUserByEmail(email)
        if (!user) {
          return null
        }

        // Get user with password from database
        const userWithPassword = await query('SELECT * FROM users WHERE email = $1', [email])
        if (userWithPassword.length === 0 || !userWithPassword[0].password) {
          return null
        }

        const isPasswordValid = await bcryptjs.compare(password, userWithPassword[0].password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
  ],
  events: {
    async createUser({ user }) {
      // When a user is created via OAuth, ensure they exist in our database
      if (!user.email) return
      
      const existingUser = await getUserByEmail(user.email)
      if (!existingUser) {
        await createUser(user.email, user.name || undefined)
      }
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Helper functions for registration and user management
export async function registerUser(email: string, password: string, name?: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12)
    
    // Create user
    const user = await createUser(email, name, hashedPassword)
    if (!user) {
      return { success: false, error: 'Failed to create user' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export { getUserByEmail, getUserById, createUser, updateUser }