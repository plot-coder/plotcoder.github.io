import { describe, expect, it } from "vitest";
import { describePlan, planWipe } from "./wipe-plan.mjs";

const TEST_WRITER = { email: "robert+round4@example.com", user_id: "user-test", test: true };
const REAL_WRITER = { email: "robert@example.com", user_id: "user-real", test: false };

const owned = { id: "p-low-season", name: "Low Season", owner: "user-test", boards: 1 };
const theirs = { id: "p-real", name: "The Real Series", owner: "user-real", boards: 4 };

describe("planWipe", () => {
  it("refuses an address with no account", () => {
    const plan = planWipe({ writer: null, projects: [], objects: [] }, "delete");
    expect(plan.ok).toBe(false);
    expect(plan.reason).toBe("unknown-address");
  });

  it("refuses an account that is not marked as a test account", () => {
    const plan = planWipe({ writer: REAL_WRITER, projects: [theirs], objects: [] }, "delete");
    expect(plan.ok).toBe(false);
    expect(plan.reason).toBe("not-a-test-account");
    expect(plan.say).toContain(REAL_WRITER.email);
  });

  it("refuses a mode it does not know", () => {
    const plan = planWipe({ writer: TEST_WRITER, projects: [], objects: [] }, "burn");
    expect(plan.ok).toBe(false);
    expect(plan.reason).toBe("unknown-mode");
  });

  it("takes the account's own projects and leaves the ones shared with it", () => {
    const plan = planWipe({ writer: TEST_WRITER, projects: [owned, theirs], objects: [] }, "empty");
    expect(plan.ok).toBe(true);
    expect(plan.projects.map((p) => p.id)).toEqual(["p-low-season"]);
    expect(plan.shared.map((p) => p.id)).toEqual(["p-real"]);
  });

  it("takes only the files under a project it owns", () => {
    const objects = [
      "p-low-season/pictures/nessa.png",
      "p-low-season/takes/one.mp4",
      "p-real/pictures/someone-elses.png",
    ];
    const plan = planWipe({ writer: TEST_WRITER, projects: [owned, theirs], objects }, "delete");
    expect(plan.files).toEqual(["p-low-season/pictures/nessa.png", "p-low-season/takes/one.mp4"]);
  });

  it("keeps the account on empty and removes it on delete", () => {
    const found = { writer: TEST_WRITER, projects: [owned], objects: [] };
    expect(planWipe(found, "empty").removesAccount).toBe(false);
    expect(planWipe(found, "delete").removesAccount).toBe(true);
  });

  it("handles an account with nothing in it", () => {
    const plan = planWipe({ writer: TEST_WRITER, projects: [], objects: [] }, "delete");
    expect(plan.ok).toBe(true);
    expect(plan.projects).toEqual([]);
    expect(plan.files).toEqual([]);
  });
});

describe("describePlan", () => {
  it("says what a refusal was", () => {
    const plan = planWipe({ writer: REAL_WRITER, projects: [], objects: [] }, "delete");
    expect(describePlan(plan)).toEqual([plan.say]);
  });

  it("names every project and says the account stays on empty", () => {
    const plan = planWipe({ writer: TEST_WRITER, projects: [owned], objects: [] }, "empty");
    const said = describePlan(plan).join("\n");
    expect(said).toContain("Low Season");
    expect(said).toContain("1 board");
    expect(said).toContain("The account stays");
  });

  it("says the account goes on delete, and names what survives", () => {
    const plan = planWipe(
      { writer: TEST_WRITER, projects: [owned, theirs], objects: ["p-low-season/pictures/a.png"] },
      "delete",
    );
    const said = describePlan(plan).join("\n");
    expect(said).toContain("1 file in the projects bucket");
    expect(said).toContain("belong to someone else");
    expect(said).toContain("The Real Series");
    expect(said).toContain("claimed again");
  });
});
