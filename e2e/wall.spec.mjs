// Four checks over the doors into the kernel. Not a pixel suite: each one asks
// whether a change made through one door shows up through the others.

import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { boardOnBridge, boardOnPage, McpClient, resetBoard } from "./helpers.mjs";

test.beforeEach(async ({ request }) => {
  await resetBoard(request);
});

test("the wall loads the seed cards with no console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page.getByText("PlotCoder", { exact: true })).toBeVisible();
  await expect(page.locator("article.note")).toHaveCount(3);
  await expect(page.getByText("Maya finds the letter")).toBeVisible();
  await expect(page.getByLabel("Logline")).toHaveText("");
  expect(errors).toEqual([]);
});

test("an MCP tool call lands on the open wall", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("article.note")).toHaveCount(3);

  const mcp = new McpClient();
  await mcp.start();
  try {
    const listed = await mcp.callTool("list_board");
    expect(listed).toContain("live: app is open");

    const created = await mcp.callToolData("create_note", {
      headline: "Sam steals the van",
      change: "Now there is no going back.",
      rank: "beat",
      x: 640,
      y: 140,
    });
    expect(created?.id).toBeTruthy();

    // The wall is what the writer sees; the bridge is what the file holds.
    await expect(page.getByText("Sam steals the van")).toBeVisible();
    await expect(page.locator("article.note")).toHaveCount(4);
    await expect(page.locator("article.note.is-beat")).toHaveCount(1);

    const onPage = await boardOnPage(page);
    const note = onPage.notes.find((item) => item.id === created.id);
    expect(note).toMatchObject({ headline: "Sam steals the van", rank: "beat", x: 640, y: 140 });

    const onBridge = await boardOnBridge(request);
    expect(onBridge.notes.map((item) => item.id)).toContain(created.id);
  } finally {
    mcp.stop();
  }
});

test("a dragged card lands where it was dropped, on the wall and in the file", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const before = (await boardOnPage(page)).notes.find((note) => note.id === "maya-letter");

  // Grab the paper's top strip, above the headline — the R13 gesture. The card
  // is rotated a couple of degrees, so aim at the centre where that does not matter.
  const card = page.locator("article.note").filter({ hasText: "Maya finds the letter" });
  const box = await card.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + 9;
  const dx = 220;
  const dy = 160;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx / 2, startY + dy / 2, { steps: 6 });
  await page.mouse.move(startX + dx, startY + dy, { steps: 6 });
  await page.mouse.up();

  // The view is the identity at load, so screen pixels are board pixels.
  const after = (await boardOnPage(page)).notes.find((note) => note.id === "maya-letter");
  expect(after.x).toBeCloseTo(before.x + dx, 0);
  expect(after.y).toBeCloseTo(before.y + dy, 0);

  // Dropping commits to the bridge at once, so an agent reading now sees the move.
  await expect
    .poll(async () => {
      const bridged = await boardOnBridge(request);
      return bridged.notes.find((note) => note.id === "maya-letter")?.x;
    })
    .toBeCloseTo(before.x + dx, 0);
});

test("a saved project reopens with the wall it held", async ({ page, request }) => {
  await page.goto("/");

  // Make the board unmistakable through the console door, then save it.
  await page.evaluate(() => {
    window.plotcoder.dispatch({ type: "set_logline", logline: "Can Maya forgive a useful lie?" });
    window.plotcoder.dispatch({
      type: "create_note",
      id: "van",
      headline: "Sam steals the van",
      change: "Now there is no going back.",
    });
  });
  await expect(page.locator("article.note")).toHaveCount(4);

  await page.getByLabel("Save or open project").click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save project" }).click(),
  ]);
  const saved = await download.path();
  const project = JSON.parse(fs.readFileSync(saved, "utf8"));
  expect(project.app).toBe("plotcoder");
  expect(project.storage["plotcoder.logline"]).toBe("Can Maya forgive a useful lie?");
  await page.getByRole("button", { name: "Close", exact: true }).click();

  // Lose the work: a fresh board on the bridge, and a reload to adopt it.
  await resetBoard(request);
  await page.reload();
  await expect(page.locator("article.note")).toHaveCount(3);
  await expect(page.getByLabel("Logline")).toHaveText("");

  // Open the file. The app reloads itself after importing.
  await page.getByLabel("Save or open project").click();
  await Promise.all([
    page.waitForEvent("load"),
    page.locator("input.project-file").setInputFiles(saved),
  ]);

  await expect(page.getByLabel("Logline")).toHaveText("Can Maya forgive a useful lie?");
  await expect(page.locator("article.note")).toHaveCount(4);
  await expect(page.getByText("Sam steals the van")).toBeVisible();

  // And the bridge — the agent's view — holds the reopened wall, not the old one.
  await expect
    .poll(async () => (await boardOnBridge(request)).logline)
    .toBe("Can Maya forgive a useful lie?");
});
