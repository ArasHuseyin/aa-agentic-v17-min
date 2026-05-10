import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  FormLayout,
  TextField,
  Divider,
  Banner,
  DataTable,
  EmptyState,
  Spinner,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/lib/shopify.server";
import { shopifyAdmin } from "~/lib/shopify-api.server";
import { captureSetupStep } from "~/lib/merchant-qa.server";
import type { Env } from "../../load-context";

interface ShopInfo {
  name: string;
  email: string;
  plan: string;
}

interface LoaderData {
  shop: ShopInfo;
  bundleCount: number;
  appStatus: "active" | "inactive";
}

interface ActionData {
  success?: boolean;
  error?: string;
  savedSettings?: {
    bundleLabel: string;
    inventoryBuffer: string;
  };
}

const SHOP_QUERY = `
  query ShopInfo {
    shop {
      name
      email
      plan {
        displayName
      }
    }
  }
`;

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { session, shop } = await authenticate.admin(request, context);
  const env = (context.cloudflare?.env ?? {}) as Env;

  const api = shopifyAdmin({ env, session, shop });

  const data = await api.graphql<{
    shop: { name: string; email: string; plan: { displayName: string } };
  }>(SHOP_QUERY);

  return json<LoaderData>({
    shop: {
      name: data.shop.name,
      email: data.shop.email,
      plan: data.shop.plan.displayName,
    },
    bundleCount: 0,
    appStatus: "active",
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { session, shop } = await authenticate.admin(request, context);
  const env = (context.cloudflare?.env ?? {}) as Env;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save-settings") {
    const bundleLabel = String(formData.get("bundleLabel") ?? "Bundle");
    const inventoryBuffer = String(formData.get("inventoryBuffer") ?? "0");

    await captureSetupStep(env, "bundle-settings-saved", {
      shop,
      bundleLabel,
      inventoryBuffer,
    });

    return json<ActionData>({
      success: true,
      savedSettings: { bundleLabel, inventoryBuffer },
    });
  }

  return json<ActionData>({ error: "Unknown intent" });
}

export default function Index() {
  const { shop, bundleCount, appStatus } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [bundleLabel, setBundleLabel] = useState("Bundle");
  const [inventoryBuffer, setInventoryBuffer] = useState("0");

  const handleBundleLabelChange = useCallback((value: string) => setBundleLabel(value), []);
  const handleInventoryBufferChange = useCallback((value: string) => setInventoryBuffer(value), []);

  return (
    <Page
      title="AA Agentic V17 Min"
      subtitle="Bundle management and inventory control"
    >
      <BlockStack gap="500">
        {actionData?.success && (
          <Banner tone="success" title="Settings saved successfully." />
        )}
        {actionData?.error && (
          <Banner tone="critical" title={actionData.error} />
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {/* Status Overview */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Status Overview
                  </Text>
                  <Divider />
                  <InlineStack gap="400" wrap={false}>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" tone="subdued">
                        App Status
                      </Text>
                      <Badge tone={appStatus === "active" ? "success" : "critical"}>
                        {appStatus === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Shop
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {shop.name}
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Plan
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {shop.plan}
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Active Bundles
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {bundleCount}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </Card>

              {/* Bundles Table */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd">
                      Bundles
                    </Text>
                    <Button variant="primary" disabled>
                      Create Bundle
                    </Button>
                  </InlineStack>
                  <Divider />
                  {bundleCount === 0 ? (
                    <EmptyState
                      heading="No bundles yet"
                      image=""
                    >
                      <p>
                        Create your first bundle by selecting a parent product and
                        adding child products with quantities and a bundle-only price.
                      </p>
                    </EmptyState>
                  ) : (
                    <DataTable
                      columnContentTypes={["text", "numeric", "text", "text"]}
                      headings={["Bundle Name", "Child Products", "Bundle Price", "Status"]}
                      rows={[]}
                    />
                  )}
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            {/* Settings Panel */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Bundle Settings
                </Text>
                <Divider />
                <Form method="post">
                  <input type="hidden" name="intent" value="save-settings" />
                  <FormLayout>
                    <TextField
                      label="Bundle Label"
                      name="bundleLabel"
                      value={bundleLabel}
                      onChange={handleBundleLabelChange}
                      helpText="Label shown to customers on the product page bundle block."
                      autoComplete="off"
                    />
                    <TextField
                      label="Inventory Buffer"
                      name="inventoryBuffer"
                      value={inventoryBuffer}
                      onChange={handleInventoryBufferChange}
                      type="number"
                      helpText="Extra units to reserve per child product when a bundle is purchased."
                      autoComplete="off"
                    />
                    <Button
                      submit
                      variant="primary"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Save Settings
                    </Button>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>

            {/* Shop Info */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Shop Info
                </Text>
                <Divider />
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Email
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {shop.email}
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}