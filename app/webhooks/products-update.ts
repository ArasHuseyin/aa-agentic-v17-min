import type { AppLoadContext } from "@remix-run/cloudflare";
import type { Env } from "~/env.d";

interface ProductsUpdatePayload {
  id: number;
  title?: string;
  variants?: Array<{
    id: number;
    inventory_quantity?: number;
    sku?: string;
  }>;
  tags?: string;
  updated_at?: string;
}

const logger = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.info(JSON.stringify({ level: "info", msg, ...data })),
  warn: (msg: string, data?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", msg, ...data })),
  error: (msg: string, data?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", msg, ...data })),
};

export default async function handler(
  request: Request,
  context: AppLoadContext
): Promise<Response> {
  const env = (context.cloudflare?.env ?? {}) as Env;

  let payload: ProductsUpdatePayload;
  try {
    payload = (await request.json()) as ProductsUpdatePayload;
  } catch (err) {
    logger.error("products/update: failed to parse payload", {
      error: String(err),
    });
    return new Response("Bad Request", { status: 400 });
  }

  const productId = payload.id;
  const productTitle = payload.title ?? "(unknown)";
  const variantCount = payload.variants?.length ?? 0;

  logger.info("products/update: received", {
    productId,
    productTitle,
    variantCount,
    updatedAt: payload.updated_at,
  });

  // Bundle-aware stub: if the product carries a "bundle" tag, log intent
  // for downstream inventory deduction logic (Sprint N will implement fully).
  const tags = payload.tags ?? "";
  const isBundle = tags.split(",").map((t) => t.trim()).includes("bundle");

  if (isBundle) {
    logger.info("products/update: bundle product detected — inventory sync pending", {
      productId,
      productTitle,
    });
    // TODO (Sprint N): query bundle metafields for child product IDs + quantities,
    // then call shopifyAdmin({ env, session, shop }).graphql(...) to adjust
    // child inventory levels by N × child_qty for each fulfilled bundle unit.
  }

  return new Response("OK", { status: 200 });
}