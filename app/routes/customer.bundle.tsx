import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const bundleId = url.searchParams.get("bundleId");

  if (!shop || !bundleId) {
    return json(
      { error: "Missing required query parameters: shop, bundleId" },
      { status: 400 }
    );
  }

  // Public endpoint — no admin auth required.
  // Bundle data is fetched server-side via the shopifyAdmin helper in a
  // dedicated API route; here we return a lightweight shell that the
  // storefront block can hydrate via client-side fetch to /api/bundle.
  return json({
    shop,
    bundleId,
    bundle: null as BundlePayload | null,
    message:
      "Fetch bundle details from /api/bundle?shop=<shop>&bundleId=<id> for live data.",
  });
}

interface BundleChild {
  productId: string;
  variantId: string;
  title: string;
  quantity: number;
  imageUrl: string | null;
}

interface BundlePayload {
  parentProductId: string;
  title: string;
  bundlePrice: string;
  currency: string;
  children: BundleChild[];
}

export default function CustomerBundlePage() {
  const data = useLoaderData<typeof loader>();

  if ("error" in data) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{data.error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Bundle Details</h1>
      <p style={styles.meta}>
        <strong>Shop:</strong> {data.shop}
      </p>
      <p style={styles.meta}>
        <strong>Bundle ID:</strong> {data.bundleId}
      </p>

      {data.bundle ? (
        <BundleCard bundle={data.bundle} />
      ) : (
        <p style={styles.hint}>{data.message}</p>
      )}
    </div>
  );
}

function BundleCard({ bundle }: { bundle: BundlePayload }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.bundleTitle}>{bundle.title}</h2>
      <p style={styles.price}>
        Bundle price:{" "}
        <strong>
          {bundle.currency} {bundle.bundlePrice}
        </strong>
      </p>
      <ul style={styles.childList}>
        {bundle.children.map((child) => (
          <li key={child.variantId} style={styles.childItem}>
            {child.imageUrl && (
              <img
                src={child.imageUrl}
                alt={child.title}
                style={styles.childImage}
              />
            )}
            <span>
              {child.title} &times; {child.quantity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "sans-serif",
    maxWidth: 640,
    margin: "2rem auto",
    padding: "0 1rem",
    color: "#1a1a1a",
  },
  heading: {
    fontSize: "1.5rem",
    marginBottom: "0.5rem",
  },
  meta: {
    margin: "0.25rem 0",
    fontSize: "0.95rem",
  },
  hint: {
    marginTop: "1rem",
    fontSize: "0.9rem",
    color: "#555",
  },
  error: {
    color: "#c0392b",
    fontWeight: "bold",
  },
  card: {
    marginTop: "1.5rem",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "1rem",
    background: "#fafafa",
  },
  bundleTitle: {
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
  },
  price: {
    marginBottom: "1rem",
  },
  childList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  childItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0",
    borderTop: "1px solid #eee",
  },
  childImage: {
    width: 48,
    height: 48,
    objectFit: "cover",
    borderRadius: 4,
  },
};