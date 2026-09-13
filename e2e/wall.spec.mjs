// Seven checks over the doors into the kernel. Headlines are looked up on the card
// itself: the Story Map repeats each one as an SVG title, and a text lookup would
// match both. Not a pixel suite: each one asks
// whether a change made through one door shows up through the others.

import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { boardOnBridge, boardOnPage, McpClient, resetBoard, waitForBridge } from "./helpers.mjs";

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
  await waitForBridge(page);

  await expect(page.getByText("PlotCoder", { exact: true })).toBeVisible();
  await expect(page.locator("article.note")).toHaveCount(3);
  await expect(page.locator(".note__headline", { hasText: "Maya finds the letter" })).toBeVisible();
  await expect(page.getByLabel("Logline")).toHaveText("");
  expect(errors).toEqual([]);
});

test("an MCP tool call lands on the open wall", async ({ page, request }) => {
  await page.goto("/");
  await waitForBridge(page);
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
    await expect(page.locator(".note__headline", { hasText: "Sam steals the van" })).toBeVisible();
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
  await waitForBridge(page);
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
  await waitForBridge(page);

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

  await page.getByLabel(/Save, open, or sync project/).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save project" }).click(),
  ]);
  const saved = await download.path();
  const project = JSON.parse(fs.readFileSync(saved, "utf8"));
  expect(project.app).toBe("plotcoder");
  // The logline lives inside the open board's own key now (R35): one board per key.
  const record = JSON.parse(project.storage["plotcoder.project"]);
  const boardKeys = Object.keys(project.storage).filter((key) => key.startsWith("plotcoder.board."));
  expect(boardKeys).toEqual([`plotcoder.board.${record.activeBoardId}`]);
  expect(JSON.parse(project.storage[boardKeys[0]]).logline).toBe("Can Maya forgive a useful lie?");
  await page.getByRole("button", { name: "Close", exact: true }).click();

  // Lose the work: a fresh board on the bridge, and a reload to adopt it.
  await resetBoard(request);
  await page.reload();
  await expect(page.locator("article.note")).toHaveCount(3);
  await expect(page.getByLabel("Logline")).toHaveText("");

  // Open the file. The app reloads itself after importing.
  await page.getByLabel(/Save, open, or sync project/).click();
  await Promise.all([
    page.waitForEvent("load"),
    page.locator("input.project-file").setInputFiles(saved),
  ]);

  await expect(page.getByLabel("Logline")).toHaveText("Can Maya forgive a useful lie?");
  await expect(page.locator("article.note")).toHaveCount(4);
  await expect(page.locator(".note__headline", { hasText: "Sam steals the van" })).toBeVisible();

  // And the bridge — the agent's view — holds the reopened wall, not the old one.
  await expect
    .poll(async () => (await boardOnBridge(request)).logline)
    .toBe("Can Maya forgive a useful lie?");
});

test("the story map jumps the wall to a card, and hides to a ruler that is remembered", async ({
  page,
}) => {
  await page.goto("/");
  await waitForBridge(page);

  // A beat far off the first screen, so the jump has somewhere to go.
  await page.evaluate(() => {
    window.plotcoder.dispatch({
      type: "create_note",
      id: "lost",
      headline: "All is lost",
      change: "Maya has nothing left to trade.",
      rank: "beat",
      x: 2400,
      y: 1800,
    });
  });
  const card = page.locator("article.note").filter({ hasText: "All is lost" });
  const board = page.locator(".note-board");
  const before = (await card.boundingBox());
  const frame = (await board.boundingBox());
  expect(before.x).toBeGreaterThan(frame.x + frame.width);

  // The map names the beat; clicking the name brings the card to the middle.
  const label = page.locator(".story-map__beat-label", { hasText: "All is lost" });
  await expect(label).toBeVisible();
  await label.click();
  await expect(card).toHaveClass(/is-selected/);
  const after = (await card.boundingBox());
  const centreX = after.x + after.width / 2;
  const centreY = after.y + after.height / 2;
  expect(Math.abs(centreX - (frame.x + frame.width / 2))).toBeLessThan(4);
  expect(Math.abs(centreY - (frame.y + frame.height / 2))).toBeLessThan(4);

  // The wall did not change: a jump is a view, never a move.
  const onPage = await boardOnPage(page);
  expect(onPage.notes.find((note) => note.id === "lost")).toMatchObject({ x: 2400, y: 1800 });

  // Hide to a ruler; the choice survives a reload because it is per viewer.
  const strip = page.getByLabel("Story map");
  await page.getByRole("button", { name: "Story map · hide" }).click();
  await expect(page.getByRole("button", { name: "Story map · show" })).toBeVisible();
  expect((await strip.boundingBox()).height).toBeLessThan(30);
  await page.reload();
  await expect(page.getByRole("button", { name: "Story map · show" })).toBeVisible();
  await page.getByRole("button", { name: "Story map · show" }).click();
  await expect(page.getByRole("button", { name: "Story map · hide" })).toBeVisible();
});

test("a change an agent made can be undone from the wall, and redone", async ({ page, request }) => {
  await page.goto("/");
  await waitForBridge(page);
  await expect(page.locator("article.note")).toHaveCount(3);

  const mcp = new McpClient();
  await mcp.start();
  try {
    await mcp.callTool("create_note", { headline: "Sam steals the van", change: "No going back." });
    await expect(page.locator("article.note")).toHaveCount(4);

    // ⌘Z on the wall takes back what the agent did; the bridge follows.
    await page.locator(".note-board").click({ position: { x: 20, y: 20 } });
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.locator("article.note")).toHaveCount(3);
    await expect
      .poll(async () => (await boardOnBridge(request)).notes.length)
      .toBe(3);

    // And forward again.
    await page.keyboard.press("Shift+ControlOrMeta+z");
    await expect(page.locator("article.note")).toHaveCount(4);
    await expect(page.locator(".note__headline", { hasText: "Sam steals the van" })).toBeVisible();

    // A drag is one step: undo puts the card straight back.
    const card = page.locator("article.note").filter({ hasText: "Maya finds the letter" });
    const before = (await boardOnPage(page)).notes.find((note) => note.id === "maya-letter");
    const box = await card.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 9);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + 9 + 120, { steps: 8 });
    await page.mouse.up();
    const moved = (await boardOnPage(page)).notes.find((note) => note.id === "maya-letter");
    expect(moved.x).not.toBe(before.x);
    await page.keyboard.press("ControlOrMeta+z");
    const back = (await boardOnPage(page)).notes.find((note) => note.id === "maya-letter");
    expect([back.x, back.y]).toEqual([before.x, before.y]);
  } finally {
    mcp.stop();
  }
});

test("a project holds more than one board, and switching keeps each wall intact", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await waitForBridge(page);
  await expect(page.locator("article.note")).toHaveCount(3);

  // One board: the crumb shows only the mark. Open the panel and add a board.
  await expect(page.getByLabel("Board name")).toHaveCount(0);
  await page.getByRole("button", { name: /Open the project/ }).click();
  await page.getByLabel("Add a board").fill("Episode 2");
  await page.getByLabel("Add a board").press("Enter");

  // The new board opens, empty, and the crumb now names it.
  await expect(page.locator("article.note")).toHaveCount(0);
  await expect(page.getByLabel("Board name")).toHaveText("Episode 2");
  await page.evaluate(() => {
    window.plotcoder.dispatch({ type: "create_note", id: "ep2", headline: "A second story", change: "Begins." });
  });
  await expect(page.locator("article.note")).toHaveCount(1);

  // Back to the first board: its three seed cards are where they were.
  await page.getByRole("button", { name: /Board 1/ }).click();
  await expect(page.locator("article.note")).toHaveCount(3);
  await expect(page.getByLabel("Board name")).toHaveText("Board 1");

  // The bridge followed the switch: an agent reading now sees board one, and
  // the project mirror has both boards.
  await expect.poll(async () => (await boardOnBridge(request)).notes.length).toBe(3);
  await expect
    .poll(async () => (await (await request.get("/__plotcoder/project")).json()).project.boards.length)
    .toBe(2);

  // And forward again, by the agent's door this time.
  const mcp = new McpClient();
  await mcp.start();
  try {
    const listed = await mcp.callTool("list_boards");
    expect(listed).toContain("boards: 2");
    expect(await mcp.callTool("open_board", { board: "Episode 2" })).toContain('Opened "Episode 2"');
    await expect(page.locator("article.note")).toHaveCount(1);
    await expect(page.getByLabel("Board name")).toHaveText("Episode 2");
  } finally {
    mcp.stop();
  }
});

test("a person's page opens from the cast lens, takes a line, and shows their scenes", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await waitForBridge(page);
  await expect(page.locator("article.note")).toHaveCount(3);

  // The roster, then Maya's page from the chevron at her row's end.
  await page.getByRole("button", { name: "Cast", exact: true }).click();
  await page.getByLabel("Open Maya's page").click();
  await expect(page.getByRole("region", { name: "Maya's page" })).toBeVisible();
  // Her scenes, in wall order, with page numbers; she is on all three seed cards.
  await expect(page.locator(".cast-page__scene")).toHaveCount(3);
  await expect(page.locator(".cast-page__headline").first()).toHaveText("Maya finds the letter");

  // A blank line asks; typing answers it, and the answer reaches the bridge.
  const looks = page.getByLabel("Looks of Maya");
  await expect(looks).toHaveAttribute("data-placeholder", /stranger notice/);
  await looks.click();
  await page.keyboard.type("Thirty-four, tall, a coat too good for the flat.");
  await page.keyboard.press("Enter");
  await expect
    .poll(async () => (await boardOnBridge(request)).characters.find((c) => c.id === "maya")?.looks)
    .toBe("Thirty-four, tall, a coat too good for the flat.");

  // A scene in the list jumps the wall to that card and selects it.
  await page.locator(".cast-page__jump").nth(2).click();
  await expect(page.locator("article.note.is-selected")).toHaveCount(1);
  await expect(page.locator("article.note.is-selected .note__headline")).toHaveText("The letter is read aloud");

  // Back to the roster: the chevron now says the page has lines.
  await page.getByRole("button", { name: "‹ Cast" }).click();
  await expect(page.getByLabel("Open Maya's page")).toHaveAttribute("title", /1 of 5 lines/);

  // And an agent sees the same page through its door.
  const mcp = new McpClient();
  await mcp.start();
  try {
    expect(await mcp.callTool("list_board")).toContain('"Maya" on 3 cards · page: looks');
    expect(await mcp.callTool("update_character", { id: "maya", voice: "Low, and quicker when she lies." })).toContain(
      "Wrote voice on Maya's page",
    );
  } finally {
    mcp.stop();
  }
  await page.getByLabel("Open Maya's page").click();
  await expect(page.getByLabel("Voice of Maya")).toHaveText("Low, and quicker when she lies.");
});

test("a place typed on a card appears in the lens, fades the wall, and reaches an agent", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await waitForBridge(page);
  await expect(page.locator("article.note")).toHaveCount(3);

  // The fourth line: tap it and type where the scene happens.
  const card = page.locator("article.note", { hasText: "Maya finds the letter" });
  await card.hover();
  await card.getByLabel("Place Maya finds the letter").click();
  await page.keyboard.type("the piano shop");
  await page.keyboard.press("Enter");
  await expect(card.getByLabel(/Place of Maya finds the letter/)).toHaveText(/at the piano shop/);
  await expect
    .poll(async () => (await boardOnBridge(request)).notes.find((note) => note.id === "maya-letter")?.location)
    .toBe("the piano shop");

  // A second card completes from the first: type "the p", take the completion.
  const second = page.locator("article.note", { hasText: "The letter is read aloud" });
  await second.hover();
  await second.getByLabel("Place The letter is read aloud").click();
  await page.keyboard.type("the p");
  await expect(page.getByRole("option", { name: "the piano shop" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(second.getByLabel(/Place of The letter is read aloud/)).toHaveText(/at the piano shop/);

  // The lens lists the place with its count; holding it fades the other card.
  await page.getByRole("button", { name: "Cast", exact: true }).click();
  const place = page.getByLabel("Places").getByRole("listitem").filter({ hasText: "the piano shop" });
  await expect(place).toContainText("2 cards");
  await place.click();
  await expect(page.locator("article.note.is-dim")).toHaveCount(1);
  await expect(page.locator("article.note.is-dim")).toContainText("Tom lies about the job");

  // And an agent sees and sets the same line.
  const mcp = new McpClient();
  await mcp.start();
  try {
    expect(await mcp.callTool("list_board")).toContain('at: the piano shop] — "Maya finds the letter"');
    expect(await mcp.callTool("set_location", { ids: ["tom-lies"], location: "the flat" })).toContain(
      "1 card(s) now at the flat",
    );
  } finally {
    mcp.stop();
  }
  await expect(page.getByLabel("Places").getByRole("listitem")).toHaveCount(2);
});

test("pages open beside the wall: a scene typed there lands on its card, measured", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await waitForBridge(page);
  await expect(page.locator("article.note")).toHaveCount(3);

  // The panel: the whole script in wall order, one scene per card.
  await page.getByRole("button", { name: "Pages", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Pages" });
  await expect(panel).toBeVisible();
  await expect(panel.locator(".scene")).toHaveCount(3);
  await expect(panel.locator(".scene__heading").first()).toContainText("MAYA FINDS THE LETTER");

  // Type a scene; its card is measured and the text reaches the bridge.
  const scene = panel.getByLabel("Scene text of Maya finds the letter");
  await scene.click();
  await scene.fill("Rain on the shop window.\n\nMAYA\nTom?");
  await scene.blur();
  await expect
    .poll(async () => (await boardOnBridge(request)).notes.find((note) => note.id === "maya-letter")?.text)
    .toBe("Rain on the shop window.\n\nMAYA\nTom?");
  await expect(panel.locator(".scene").first()).toHaveClass(/is-measured/);
  await expect(page.locator("article.note", { hasText: "Maya finds the letter" }).locator(".note__length")).toHaveClass(/is-measured/);

  // The caret in a scene selects its card on the wall.
  await panel.getByLabel("Scene text of Tom lies about the job").click();
  await expect(page.locator("article.note.is-selected .note__headline")).toHaveText("Tom lies about the job");

  // Widen takes the window; Close gives the wall back.
  await panel.getByRole("button", { name: "Widen" }).click();
  await expect(panel).toHaveClass(/pages--wide/);
  await panel.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("complementary", { name: "Pages" })).toHaveCount(0);

  // The export carries the scene as the body.
  const mcp = new McpClient();
  await mcp.start();
  try {
    expect(await mcp.callTool("export_fountain")).toContain("Rain on the shop window.");
  } finally {
    mcp.stop();
  }
});
