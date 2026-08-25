import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

const TITLE = "曾侯乙尊盘";
const MODEL_FALLBACK = "真实三维模型暂未提供，当前显示数字结构示意。";
const WEBGL_FALLBACK = "当前设备无法启用实时 3D，已显示静态数字结构示意。";
const FRAMEWORK_OVERLAYS = [
  "vite-error-overlay",
  "#webpack-dev-server-client-overlay",
  "[data-nextjs-dialog-overlay]",
].join(",");

interface BrowserDiagnostics {
  pageErrors: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  notFoundResponses: string[];
}

const isExpectedMissingModelNoise = (
  message: ConsoleMessage,
  diagnostics: BrowserDiagnostics,
) => {
  const locationUrl = message.location().url;
  const isGeneric404 =
    message.text() ===
    "Failed to load resource: the server responded with a status of 404 (Not Found)";
  const onlyExpectedModelWasMissing =
    diagnostics.notFoundResponses.length > 0 &&
    diagnostics.notFoundResponses.every((url) =>
      new URL(url).pathname.endsWith("/models/zunpan.glb"),
    );

  return (
    isGeneric404 &&
    (locationUrl.includes("/models/zunpan.glb") || onlyExpectedModelWasMissing)
  );
};

const collectDiagnostics = (page: Page): BrowserDiagnostics => {
  const diagnostics: BrowserDiagnostics = {
    pageErrors: [],
    consoleErrors: [],
    consoleWarnings: [],
    notFoundResponses: [],
  };

  page.on("pageerror", (error) => diagnostics.pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() === 404) {
      diagnostics.notFoundResponses.push(response.url());
    }
  });
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !isExpectedMissingModelNoise(message, diagnostics)
    ) {
      diagnostics.consoleErrors.push(message.text());
    }
    if (message.type() === "warning") {
      diagnostics.consoleWarnings.push(message.text());
    }
  });

  return diagnostics;
};

const assertAppShell = async (page: Page) => {
  await expect(page).toHaveURL(/127\.0\.0\.1:4173\/?(?:#.*)?$/);
  await expect(page).toHaveTitle(/曾侯乙尊盘数字展/);
  await expect(page.locator("main#main-content")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
  await expect(page.locator(FRAMEWORK_OVERLAYS)).toHaveCount(0);
};

const assertDiagnosticsClean = (diagnostics: BrowserDiagnostics) => {
  expect(diagnostics.pageErrors, "uncaught page errors").toEqual([]);
  expect(diagnostics.consoleErrors, "relevant console errors").toEqual([]);
};

const waitForViewerFallback = async (page: Page) => {
  const modelFallback = page.getByText(MODEL_FALLBACK, { exact: true });
  const webglFallback = page.getByText(WEBGL_FALLBACK, { exact: true });

  await expect(modelFallback.or(webglFallback)).toBeVisible({ timeout: 30_000 });
  return (await webglFallback.isVisible()) ? "webgl" : "interactive";
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
};

test("desktop exhibition flow remains interactive when the GLB is missing", async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page);
  await page.goto("/");
  await assertAppShell(page);

  const viewer = page.locator("[data-artifact-viewer]");
  await expect(viewer).toBeVisible();
  const viewerBranch = await waitForViewerFallback(page);

  const toolbar = page.getByRole("toolbar", { name: "三维查看器工具" });
  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "重置视角" })).toBeVisible();
  await expect(
    toolbar.getByRole("button", { name: /自动旋转：(开|关)/ }),
  ).toBeVisible();
  await expect(
    toolbar.getByRole("button", { name: /热点显示：(开|关)/ }),
  ).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "全屏查看" })).toBeVisible();

  const rotateToggle = toolbar.getByRole("button", { name: /自动旋转：(开|关)/ });
  const rotateBefore = await rotateToggle.getAttribute("aria-pressed");
  await rotateToggle.click();
  await expect(rotateToggle).toHaveAttribute(
    "aria-pressed",
    rotateBefore === "true" ? "false" : "true",
  );

  if (viewerBranch === "interactive") {
    const hotspotToggle = toolbar.getByRole("button", { name: /热点显示：开/ });
    const hotspotButtons = page.getByRole("button", { name: /^查看热点：/ });
    await expect(hotspotButtons).toHaveCount(3);
    await hotspotToggle.click();
    await expect(hotspotButtons).toHaveCount(0);
    await toolbar.getByRole("button", { name: /热点显示：关/ }).click();
    await expect(hotspotButtons).toHaveCount(3);

    const hotspot = page.getByRole("button", { name: "查看热点：尊口镂空纹饰" });
    await hotspot.click();
    const hotspotDialog = page.getByRole("dialog", { name: "尊口镂空纹饰" });
    await expect(hotspotDialog).toContainText(
      "尊口装饰由多层相互缠绕的蟠螭纹组成，构件细密复杂，形成强烈的空间层次和视觉张力。",
    );
    await expect(
      hotspotDialog.getByRole("button", { name: "关闭热点详情" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(hotspotDialog).toHaveCount(0);
    await expect(hotspot).toBeFocused();
  } else {
    await expect(page.getByText(WEBGL_FALLBACK, { exact: true })).toBeVisible();
  }

  const desktopNav = page.getByRole("navigation", { name: "主导航" });
  await desktopNav.getByRole("link", { name: "文物概览", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "文物概览" })).toBeVisible();
  await desktopNav.getByRole("link", { name: "纹饰解析", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "纹饰解析" })).toBeVisible();

  const secondOpener = page.getByRole("button", {
    name: "查看镂空卷云结构细节",
  });
  await secondOpener.click();
  await expect(page.getByRole("dialog", { name: "镂空卷云结构" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "龙蛇形立体装饰" })).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "放大" }).click();
  await expect(page.getByText("125%", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(secondOpener).toBeFocused();

  const returnButton = page.getByRole("button", { name: "返回顶部" });
  await returnButton.scrollIntoViewIfNeeded();
  await returnButton.click();
  await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeFocused();
  await page.waitForFunction(() => window.scrollY < window.innerHeight);

  assertDiagnosticsClean(diagnostics);
});

test("an explicit model 404 keeps the viewer toolbar and surrounding archive usable", async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page);
  await page.route("**/models/zunpan.glb", (route) =>
    route.fulfill({ status: 404, contentType: "text/plain", body: "not found" }),
  );
  await page.goto("/");
  await assertAppShell(page);

  await waitForViewerFallback(page);
  const toolbar = page.getByRole("toolbar", { name: "三维查看器工具" });
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole("button", { name: "重置视角" }).click();
  await expect(page.locator("section#overview")).toBeAttached();
  await expect(page.locator("section#ornaments")).toBeAttached();
  assertDiagnosticsClean(diagnostics);
});

test("responsive viewport matrix has no page or overlay overflow", async ({ page }) => {
  const diagnostics = collectDiagnostics(page);
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 375, height: 812 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await assertAppShell(page);
    await waitForViewerFallback(page);
    await expectNoHorizontalOverflow(page);

    const viewer = page.locator("[data-artifact-viewer]");
    await expect(viewer).toBeVisible();
    await expect(page.locator("section#overview")).toBeAttached();
    await expect(page.locator("section#ornaments")).toBeAttached();

    if (viewport.width <= 768) {
      const visibleControls = page
        .getByRole("toolbar", { name: "三维查看器工具" })
        .getByRole("button");
      const count = await visibleControls.count();
      for (let index = 0; index < count; index += 1) {
        const box = await visibleControls.nth(index).boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }

    if (viewport.width === 768) {
      const heroBox = await page.locator("#home header").boundingBox();
      const viewerBox = await viewer.boundingBox();
      expect(viewerBox?.y).toBeGreaterThanOrEqual(
        (heroBox?.y ?? 0) + (heroBox?.height ?? 0) - 1,
      );
    }

    if (viewport.width === 375) {
      const menuButton = page.getByRole("button", { name: "打开导航菜单" });
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      const mobileNav = page.getByRole("navigation", { name: "移动导航" });
      await expect(mobileNav).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await mobileNav.getByRole("link", { name: "纹饰解析" }).click();
      await expect(mobileNav).toBeHidden();

      const viewerBox = await viewer.boundingBox();
      expect(viewerBox?.height).toBeGreaterThanOrEqual(viewport.height * 0.55);
      await expect(
        page.locator('[data-viewer-control-label="visible"]'),
      ).toHaveCount(4);

      await page.getByRole("button", { name: "查看镂空卷云结构细节" }).click();
      await expect(page.getByRole("dialog", { name: "镂空卷云结构" })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.keyboard.press("Escape");

      const hotspot = page.getByRole("button", { name: "查看热点：尊口镂空纹饰" });
      if ((await hotspot.count()) > 0 && (await hotspot.isVisible())) {
        await hotspot.click();
        const dialog = page.getByRole("dialog", { name: "尊口镂空纹饰" });
        const dialogBox = await dialog.boundingBox();
        expect(dialogBox).not.toBeNull();
        expect((dialogBox?.y ?? 0) + (dialogBox?.height ?? 0)).toBeGreaterThan(
          viewport.height * 0.9,
        );
        await expectNoHorizontalOverflow(page);
        await page.keyboard.press("Escape");
      } else {
        await expect(page.getByText(WEBGL_FALLBACK, { exact: true })).toBeVisible();
      }
    }
  }

  assertDiagnosticsClean(diagnostics);
});

test("reduced motion reveals all content and keeps the lightbox usable", async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await assertAppShell(page);
  await waitForViewerFallback(page);

  const rotateToggle = page.getByRole("button", { name: "自动旋转：关" });
  await expect(rotateToggle).toHaveAttribute("aria-pressed", "false");

  const hiddenReveal = await page
    .locator("[data-hero-reveal], [data-viewer-reveal], [data-reveal], [data-reveal-item]")
    .evaluateAll((elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        return style.opacity === "0" || style.visibility === "hidden";
      }).length,
    );
  expect(hiddenReveal).toBe(0);

  const historyAnimationDuration = await page.locator("#history").evaluate((element) =>
    getComputedStyle(element, "::before").animationDuration,
  );
  expect(parseFloat(historyAnimationDuration)).toBeLessThanOrEqual(0.00001);

  await page.getByRole("button", { name: "查看蟠螭纹细节" }).click();
  await expect(page.getByRole("dialog", { name: "蟠螭纹" })).toBeVisible();
  await page.keyboard.press("Escape");
  assertDiagnosticsClean(diagnostics);
});

test("keyboard and accessible names cover navigation, dialogs, and informative images", async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page);
  await page.goto("/");
  await assertAppShell(page);
  await waitForViewerFallback(page);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "跳至主要内容" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const informativeImagesWithoutAlt = await page.locator("img").evaluateAll((images) =>
    images.filter((image) => !image.getAttribute("alt")?.trim()).length,
  );
  expect(informativeImagesWithoutAlt).toBe(0);

  const rotateToggle = page.getByRole("button", { name: /自动旋转：(开|关)/ });
  await expect(rotateToggle).toHaveAttribute("aria-pressed", /true|false/);
  await expect(rotateToggle.locator('[data-viewer-control-label="visible"]')).toContainText(
    /自动旋转：(开|关)/,
  );

  const ornamentOpener = page.locator(
    'section#ornaments button[aria-label="查看镂空卷云结构细节"]',
  );
  await ornamentOpener.scrollIntoViewIfNeeded();
  await expect(ornamentOpener).toBeVisible();
  await ornamentOpener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "镂空卷云结构" });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.getByRole("button", { name: "关闭纹饰细节" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.locator("button").last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(ornamentOpener).toBeFocused();

  assertDiagnosticsClean(diagnostics);
});
