// Prisma client setup will be added here.
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Reuse the client across warm serverless invocations to avoid opening a new
// database connection for every Vercel request.
globalForPrisma.prisma = prisma
