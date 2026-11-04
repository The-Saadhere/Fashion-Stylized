import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendOrderNotificationEmail, sendOrderConfirmationEmail } from "@/lib/resend"
import Setting from "@/models/Setting"
import Product from "@/models/Product"
import { z } from "zod"

const createOrderSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().min(1),
  products: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().positive(),
    color: z.string().optional(),
  })).min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().optional(),
  mobileNumber: z.string().trim().min(1),
  paymentMethod: z.enum(["COD", "online"]).optional(),
})

export const dynamic = "force-dynamic"
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);

    const parsed = createOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: "Invalid order details"
      }, { status: 400 });
    }

    const {
      name,
      email,
      products: requestedProducts,
      address,
      city,
      postalCode,
      mobileNumber,
      paymentMethod,
    } = parsed.data;

    const productIds = [...new Set(requestedProducts.map((item) => item.productId))];
    const catalogProducts = await Product.find({ _id: { $in: productIds } })
      .select("_id title price images category")
      .lean();
    const productsById = new Map(
      catalogProducts.map((product) => [product._id.toString(), product])
    );

    const products = [];
    for (const item of requestedProducts) {
      const product = productsById.get(item.productId.toLowerCase());
      if (!product) {
        return NextResponse.json({
          success: false,
          error: "One or more products are no longer available"
        }, { status: 400 });
      }

      products.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || "",
        category: product.category,
        quantity: item.quantity,
        color: item.color,
      });
    }

    if (products.some((product) => !Number.isFinite(product.price) || product.price < 0)) {
      console.error("Cannot create order with an invalid catalog product price");
      return NextResponse.json({
        success: false,
        error: "Unable to verify product pricing"
      }, { status: 500 });
    }

    const setting = await Setting.findOne().lean()
    const deliveryFee = setting?.deliveryFee ?? 300
    const subtotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = subtotal + deliveryFee;

    const newOrder = new Order({
      userId: session?.user?.id.toString() || null,
      name,
      email,
      products,
      address,
      city,
      postalCode,
      mobileNumber,
      paymentMethod: paymentMethod || "COD",
      isPaid: false,
      status: "pending",
      totalAmount,
      shippingFee: deliveryFee,
    });

    const savedOrder = await newOrder.save();

      sendOrderNotificationEmail({
      orderId: savedOrder._id.toString(),
      customerName: name,
      customerEmail: email,
      mobileNumber,
      city,
      address,
      shippingFee: deliveryFee,
      paymentMethod: paymentMethod || "COD",
      products: products.map((p) => ({
        title: p.title,
        quantity: p.quantity,
        price: p.price,
        category: p.category,
      })),
      totalAmount,
    }).catch(err => console.error("Failed to send order notification:", err))

    sendOrderConfirmationEmail({
      customerName: name,
      customerEmail: email,
      orderId: savedOrder._id.toString(),
      products: products.map((p) => ({
        title: p.title,
        quantity: p.quantity,
        price: p.price,
        category: p.category,
      })),
      totalAmount,
      shippingFee: deliveryFee,
      address,
      city,
      mobileNumber,
      paymentMethod: paymentMethod || "COD",
    }).catch(err => console.error("Failed to send order confirmation:", err))

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder._id,
    }, { status: 201 });

  } catch (error) {
    console.error("POST order error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to place order"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: "Please login to view orders"
      }, { status: 401 });
    }

    const orders = await Order.find({ userId: session.user.id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: orders
    }, { status: 200 });

  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch orders"
    }, { status: 500 });
  }
}