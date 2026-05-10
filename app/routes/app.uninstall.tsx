import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare?.env;
  const supportEmail = env?.SUPPORT_EMAIL ?? "support@example.com";
  const emergencyContact = env?.EMERGENCY_CONTACT_EMAIL ?? supportEmail;

  return Response.json({
    app: "AA Agentic V17 Min",
    steps: [
      "Revoke OAuth access and stop background jobs for the shop.",
      "Uninstall " + "AA Agentic V17 Min" + " from Shopify admin > Settings > Apps and sales channels.",
      "Verify the mandatory shop/redact webhook fired and completed data cleanup.",
    ],
    dataRetention:
      "AA Agentic V17 Min" + " deletes or anonymizes shop data after uninstall and shop/redact processing. The standard deletion SLA is 30 days.",
    stuckUninstallContact: {
      email: supportEmail,
      emergencyEmail: emergencyContact,
      instructions:
        "Include your myshopify.com domain, uninstall timestamp, and any Shopify admin error message.",
    },
  });
}
