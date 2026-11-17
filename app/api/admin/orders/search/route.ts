import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"

import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/db"
import Order from "@/models/Order"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")?.trim()
    if (!query) {
      return NextResponse.json({ success: false, error: "Search query is required" }, { status: 400 })
    }
    if (query.length > 100) {
      return NextResponse.json({ success: false, error: "Search query is too long" }, { status: 400 })
    }

    const requestedPage = Number(searchParams.get("page"))
    const requestedLimit = Number(searchParams.get("limit"))
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20
    const status = searchParams.get("status")
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"]

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const filter: Record<string, unknown> = {
      $or: [
        { name: { $regex: escapedQuery, $options: "i" } },
        { email: { $regex: escapedQuery, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: escapedQuery,
              options: "i",
            },
          },
        },
      ],
    }
    if (status) filter.status = status

    await connectToDatabase()
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    })
  } catch (error) {
    console.error("GET /api/admin/orders/search error:", error)
    return NextResponse.json({ success: false, error: "Failed to search orders" }, { status: 500 })
  }
}
