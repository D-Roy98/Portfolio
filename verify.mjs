import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5173");
await page.waitForTimeout(300);

const panels = ["PROJECTS", "PILOT LOG", "FLIGHT PLAN", "TRANSMISSIONS", "ARCHIVES", "COMMS"];
for (const label of panels) {
  await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.waitForTimeout(300);
  const file = `/tmp/f16-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
  await page.screenshot({ path: file });
  console.log("saved", file);
  await page.getByRole("button", { name: "CLOSE" }).first().click();
  await page.waitForTimeout(200);
}

// project detail overlay
await page.getByRole("button", { name: /PROJECTS/ }).click();
await page.waitForTimeout(300);
await page.getByText("Connected In-Car Services").click();
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/f16-project-detail.png" });
console.log("saved /tmp/f16-project-detail.png");

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.waitForTimeout(200);
console.log("console errors:", errors);

await browser.close();
