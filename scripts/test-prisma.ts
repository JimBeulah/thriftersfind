import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Checking database connection...")
        await prisma.$connect()
        console.log("Connected successfully.")

        console.log("Querying users...")
        const users = await prisma.user.findMany()
        console.log("Users found:", users.length)
        if (users.length > 0) {
            console.log("First user:", users[0])
            console.log("User fields:", Object.keys(users[0]))
        }

        console.log("Querying roles...")
        const roles = await prisma.role.findMany()
        console.log("Roles found:", roles.length)
        if (roles.length > 0) {
            console.log("First role:", roles[0])
        }

    } catch (e) {
        console.error("Database check failed:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
