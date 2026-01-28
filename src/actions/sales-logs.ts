'use server'

import { prisma } from "@/lib/prisma"
import { SalesLog } from "@prisma/client"

export type GetSalesLogsResult = {
    logs: SalesLog[]
    totalLogs: number
    totalPages: number
    currentPage: number
}

export async function getSalesLogs(
    page: number = 1,
    pageSize: number = 10
): Promise<GetSalesLogsResult> {
    try {
        const skip = (page - 1) * pageSize

        const [logs, totalLogs] = await prisma.$transaction([
            prisma.salesLog.findMany({
                skip,
                take: pageSize,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.salesLog.count(),
        ])

        const totalPages = Math.ceil(totalLogs / pageSize)

        return {
            logs,
            totalLogs,
            totalPages,
            currentPage: page,
        }
    } catch (error) {
        console.error("Error fetching sales logs:", error)
        throw new Error("Failed to fetch sales logs")
    }
}
