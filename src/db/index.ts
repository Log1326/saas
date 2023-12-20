import { PrismaClient } from '@prisma/client'

declare global {
	var cachedPrisma: PrismaClient
}
let db: PrismaClient = globalThis.cachedPrisma || new PrismaClient()
if (process.env.NODE_ENV === 'production') globalThis.cachedPrisma = db
export default db
