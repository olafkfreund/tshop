import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Mock database for development when Prisma client isn't available
const createMockPrisma = () => {
  const mockMethods = {
    user: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (data: any) => ({ id: 'mock-id', ...data.data }),
      update: async (args: any) => ({ id: args.where.id, ...args.data }),
      delete: async (args: any) => ({ id: args.where.id }),
    },
    product: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (data: any) => ({ id: 'mock-id', ...data.data }),
      update: async (args: any) => ({ id: args.where.id, ...args.data }),
      delete: async (args: any) => ({ id: args.where.id }),
    },
    design: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (data: any) => ({ id: 'mock-id', ...data.data }),
      update: async (args: any) => ({ id: args.where.id, ...args.data }),
      delete: async (args: any) => ({ id: args.where.id }),
    },
    order: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (data: any) => ({ id: 'mock-id', ...data.data }),
      update: async (args: any) => ({ id: args.where.id, ...args.data }),
      delete: async (args: any) => ({ id: args.where.id }),
    },
    cartItem: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (data: any) => ({ id: 'mock-id', ...data.data }),
      update: async (args: any) => ({ id: args.where.id, ...args.data }),
      delete: async (args: any) => ({ id: args.where.id }),
    },
    $connect: async () => {},
    $disconnect: async () => {},
  }
  
  return mockMethods as any
}

let prismaInstance: PrismaClient | any

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query'],
  })
} catch (error) {
  console.warn('⚠️ Prisma client not available, using mock database for development')
  prismaInstance = createMockPrisma()
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== 'production' && typeof prismaInstance?.$connect === 'function') {
  globalForPrisma.prisma = prisma
}