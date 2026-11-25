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

const authRoutes = [
  "/sign-in",
  "/sign-up",
  "/sign-up?intent=vendor",
  "/sign-up?intent=seller",
  "/mfa-required",
  "/suspended",
  "/invite/demo",
];

for (const route of authRoutes) {
  test(`GET ${route} renders with 200 and no runtime errors`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
    expect(pageErrors).toEqual([]);
  });
}

const protectedRoutes = [
  "/dashboard",
  "/vendor",
  "/seller",
  "/account",
  "/onboarding",
  "/onboarding/customer",
  "/onboarding/vendor",
  "/onboarding/seller",
  "/admin",
];

for (const route of protectedRoutes) {
  test(`GET ${route} redirects unauthenticated requests to sign-in`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/sign-in");
  });
}

test("POST /api/webhooks/clerk rejects requests without Svix headers", async ({ request }) => {
  const res = await request.post("/api/webhooks/clerk", {
    data: { type: "user.created", data: { id: "user_test" } },
  });
  expect(res.status()).toBe(400);
});

test("Cookie consent gates PostHog and persists preferences across reloads", async ({ page }) => {
  const posthogRequests: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("posthog.com")) {
      posthogRequests.push(req.url());
    }
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
  });

  await page.goto("/", { waitUntil: "load" });
  const banner = page.getByRole("region", { name: "Cookie notice" });
  await expect(banner, `consoleErrors=${JSON.stringify(consoleErrors)}`).toBeVisible({
    timeout: 15_000,
  });
  expect(posthogRequests).toEqual([]);

  await banner.getByRole("button", { name: "Essential" }).click();
  await expect(banner).toBeHidden();

  await page.reload({ waitUntil: "load" });
  await expect(page.getByRole("region", { name: "Cookie notice" })).toBeHidden();
  expect(posthogRequests).toEqual([]);

  await page.getByRole("button", { name: "Cookie preferences" }).click();
  await expect(page.getByRole("dialog", { name: "Cookie preferences" })).toBeVisible();
});
