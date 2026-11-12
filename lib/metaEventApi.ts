import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

type MetaPurchaseOrder = {
  id: string;
  email: string;
  mobileNumber: string;
  totalAmount: number;
  createdAt?: Date;
  products: Array<{
    productId: string | { toString(): string };
    price: number;
    quantity: number;
  }>;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function sendMetaPurchaseEvent(
  request: NextRequest,
  order: MetaPurchaseOrder,
) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    throw new Error(
      "Meta CAPI is not configured: set NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN",
    );
  }

  const eventId = `${order.id}_purchase`;
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const phoneDigits = order.mobileNumber.replace(/\D/g, "");
  const phone = phoneDigits.startsWith("0")
    ? `92${phoneDigits.slice(1)}`
    : phoneDigits;
  const userAgent = request.headers.get("user-agent");
  const fbp = request.cookies.get("_fbp")?.value;
  const fbc = request.cookies.get("_fbc")?.value;
  const userData: Record<string, string | string[]> = {
    em: [hash(order.email.trim().toLowerCase())],
    ...(phone && { ph: [hash(phone)] }),
    ...(forwardedIp && { client_ip_address: forwardedIp }),
    ...(userAgent && { client_user_agent: userAgent }),
    ...(fbp && { fbp }),
    ...(fbc && { fbc }),
  };

  const response = await fetch(
    `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || "v24.0"}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor((order.createdAt?.getTime() ?? Date.now()) / 1000),
            event_id: eventId,
            action_source: "website",
            event_source_url: new URL(`/orders/${order.id}`, request.url).toString(),
            user_data: userData,
            custom_data: {
              value: order.totalAmount,
              currency: "PKR",
              content_ids: order.products.map((product) => product.productId.toString()),
              content_type: "product",
              num_items: order.products.reduce((sum, product) => sum + product.quantity, 0),
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Meta CAPI request failed (${response.status}): ${responseText}`);
  }
}
