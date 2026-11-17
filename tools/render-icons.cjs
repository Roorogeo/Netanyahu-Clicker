// Re-render every 3D model in js/models.js to assets/icons/<name>.png.
//
//   python3 -m http.server 8765          # from the repo root, in another terminal
//   node tools/render-icons.cjs [http://localhost:8765] [name ...]
//
// Needs Playwright with Chromium (WebGL is used through SwiftShader when headless).
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const base = (process.argv[2] || "http://localhost:8765").replace(/\/$/, "");
  const only = process.argv.slice(3);
  const outDir = path.join(__dirname, "..", "assets", "icons");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`${base}/tools/render-icons.html`);
  await page.waitForFunction(() => window.iconsReady, null, { timeout: 30000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  const names = only.length ? only : await page.evaluate(() => window.iconNames);
  for (const name of names) {
    const url = await page.evaluate((n) => window.renderIcon(n), name);
    fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(url.split(",")[1], "base64"));
    process.stdout.write(`${name} `);
  }
  console.log(`\nRendered ${names.length} icons to ${outDir}`);
  await browser.close();
})();
