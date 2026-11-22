import { expect, test } from "@playwright/test";

test("GET /health returns 200 ok", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { status: string; service: string };
  expect(body.status).toBe("ok");
  expect(body.service).toBe("web");
});

test("GET /api/inngest serves a valid function registry", async ({ request }) => {
  const res = await request.get("/api/inngest");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { function_count?: number };
  expect(typeof body.function_count).toBe("number");
  expect(body.function_count).toBeGreaterThanOrEqual(1);
});

const marketingRoutes = ["/", "/services", "/services/mama-efes-kitchen", "/market"];

for (const route of marketingRoutes) {
  test(`GET ${route} renders with 200 and no runtime errors`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
    expect(pageErrors).toEqual([]);
  });
}
