// app/api/admin/orders/route.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Order from "@/models/Order"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
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

    await connectToDatabase()
    const filter = status ? { status } : {}
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
    console.error("GET /api/admin/orders error:", error)
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 })
  }
}