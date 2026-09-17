import { describe, expect, it } from "vitest";
import { describeSetAside, fromFdx, toFdx } from "./fdx";
import { fromFountain, mergeFountain, toFountain } from "./fountain";
import { applyCommand, seedState } from "./reducer";

const NOW = "2026-01-01T00:00:00.000Z";

function wall() {
  let state = seedState();
  state = applyCommand(state, { type: "set_location", ids: ["maya-letter"], location: "the piano shop" }, NOW).state;
  state = applyCommand(
    state,
    {
      type: "set_text",
      id: "maya-letter",
      text: "Rain on the shop window. MAYA lifts the lid & finds the envelope.\n\nMAYA\n(reading)\nTom? It's your writing.\n\nTOM ^\nIt is fine.\n\nCUT TO:",
    },
    NOW,
  ).state;
  return state;
}

// The shape Final Draft writes, by hand, for the reader to be tested against.
const SAMPLE = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
    <Paragraph Type="Scene Heading" Number="1">
      <SceneProperties Length="1 1/8" Page="1" Title="" />
      <Text>INT. THE PIANO SHOP - DAY</Text>
    </Paragraph>
    <Paragraph Type="Action">
      <Text>Rain on the shop window. </Text><Text Style="Italic">Maya</Text><Text> lifts the lid.</Text>
    </Paragraph>
    <Paragraph Type="Character">
      <Text>MAYA</Text>
    </Paragraph>
    <Paragraph Type="Parenthetical">
      <Text>(reading)</Text>
    </Paragraph>
    <Paragraph Type="Dialogue">
      <Text>Tom? It&apos;s your writing.</Text>
    </Paragraph>
    <Paragraph>
      <DualDialogue>
        <Paragraph Type="Character"><Text>MAYA</Text></Paragraph>
        <Paragraph Type="Dialogue"><Text>You said it was fine.</Text></Paragraph>
        <Paragraph Type="Character"><Text>TOM</Text></Paragraph>
        <Paragraph Type="Dialogue"><Text>It is fine.</Text></Paragraph>
      </DualDialogue>
    </Paragraph>
    <Paragraph Type="Transition">
      <Text>CUT TO:</Text>
    </Paragraph>
    <Paragraph Type="Scene Heading" Number="2">
      <Text>EXT. THE FLAT - NIGHT</Text>
    </Paragraph>
    <Paragraph Type="Action">
      <Text>Tom on the step with two cups.</Text>
    </Paragraph>
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="General" Alignment="Center"><Text>THE LETTER</Text></Paragraph>
      <Paragraph Type="General" Alignment="Center"><Text>Written by Robert</Text></Paragraph>
    </Content>
  </TitlePage>
</FinalDraft>
`;

describe("Final Draft out (c3)", () => {
  it("writes one paragraph per element, dual dialogue as a pair, numbers by wall order, and a title page", () => {
    const xml = toFdx(wall(), { title: "Episode 2", project: "The Letter", draftDate: "2026-09-13T10:00:00Z" });
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    expect(xml).toContain('<Paragraph Type="Scene Heading" Number="1">');
    expect(xml).toContain("<Text>THE PIANO SHOP</Text>");
    expect(xml).toContain("<Text>Rain on the shop window. MAYA lifts the lid &amp; finds the envelope.</Text>");
    expect(xml).toContain('<Paragraph Type="Parenthetical">\n      <Text>(reading)</Text>');
    expect(xml).toContain("<DualDialogue>");
    expect(xml).toContain('<Paragraph Type="Transition">\n      <Text>CUT TO:</Text>');
    // The unwritten cards print their change line as action, after the mark (round thirteen, entry 27).
    expect(xml).toContain("<Text>[Unwritten] Maya starts to doubt him.</Text>");
    expect(xml).not.toContain("<Text>Maya starts to doubt him.</Text>");
    expect(xml).toContain('Number="3"');
    expect(xml).toContain("<Text>Episode 2</Text>");
    expect(xml).toContain("<Text>An episode of The Letter</Text>");
    expect(xml).toContain("<Text>2026-09-13</Text>");
  });
});

describe("Final Draft in (c4)", () => {
  it("reads the shape Final Draft writes: styled runs joined, entities unescaped, dual dialogue marked, numbers kept", () => {
    const { titles, scenes } = fromFdx(SAMPLE);
    expect(titles.title).toBe("THE LETTER");
    expect(scenes).toHaveLength(2);
    expect(scenes[0].heading).toBe("INT. THE PIANO SHOP - DAY");
    expect(scenes[0].number).toBe("1");
    expect(scenes[0].text).toBe(
      [
        "Rain on the shop window. Maya lifts the lid.",
        "",
        "MAYA",
        "(reading)",
        "Tom? It's your writing.",
        "",
        "MAYA",
        "You said it was fine.",
        "",
        "TOM ^",
        "It is fine.",
        "",
        "CUT TO:",
      ].join("\n"),
    );
    expect(scenes[1].text).toBe("Tom on the step with two cups.");
  });

  it("round-trips: out, then in, changes nothing on the wall", () => {
    const state = wall();
    const back = fromFdx(toFdx(state, { title: "Episode 2" }));
    const { commands } = mergeFountain(state, back);
    expect(commands).toEqual([]);
  });

  it("reads back what the paginator's parser reads: the same elements as the Fountain export", () => {
    const state = wall();
    const viaFountain = fromFountain(toFountain(state, { title: "x" })).scenes.map((scene) => scene.text);
    const viaFdx = fromFdx(toFdx(state, { title: "x" })).scenes.map((scene) => scene.text);
    expect(viaFdx[0]).toBe(viaFountain[0]);
  });
});

describe("the receipt (Roadmap 2, item 3)", () => {
  it("counts what a production draft carries that the wall does not hold, and says so", () => {
    const xml = `<FinalDraft DocumentType="Script" Template="No" Version="5"><Content>
      <Paragraph Type="Scene Heading" Number="12" Locked="Yes"><SceneProperties Length="1" Page="9" Title="" SceneNumberLocked="Yes" /><Text>INT. HALL - DAY</Text></Paragraph>
      <Paragraph Type="Action" RevisionID="3"><Text>Tom in the hall.</Text><ScriptNote><Paragraph><Text>check with props</Text></Paragraph></ScriptNote></Paragraph>
      <Paragraph Type="Shot"><Text>CLOSE ON the phone.</Text></Paragraph>
      <Paragraph Type="Action" StartsNewPage="Yes"><Text>Later.</Text></Paragraph>
    </Content></FinalDraft>`;
    const { scenes, setAside } = fromFdx(xml);
    expect(scenes[0].text).toContain("Tom in the hall.");
    expect(scenes[0].text).toContain("CLOSE ON the phone.");
    expect(scenes[0].text).not.toContain("check with props");
    expect(setAside).toMatchObject({ scriptNotes: 1, revisedParagraphs: 1, lockedNumbers: 1, pageBreaks: 1, other: { Shot: 1 } });
    expect(describeSetAside(setAside)).toBe(
      "Kept out of the wall: 1 script note · revision marks on 1 paragraph · 1 locked scene number · 1 forced page break · 1 Shot paragraph read as action. Nothing was deleted.",
    );
    expect(describeSetAside(fromFdx(toFdx(wall(), { title: "x" })).setAside)).toBe("");
  });
});

describe("revisions in Final Draft out (round fourteen, entry 45)", () => {
  const NOW2 = "2026-09-17T10:00:00.000Z";
  it("writes the revision set and marks the changed paragraphs, which the reader counts as revision marks", () => {
    let state = applyCommand(seedState(), { type: "set_text", id: "maya-letter", text: "Rain.\n\nMAYA\nTom?" }, NOW2).state;
    state = applyCommand(state, { type: "start_revision", name: "Blue", color: "blue" }, NOW2).state;
    state = applyCommand(state, { type: "set_text", id: "maya-letter", text: "Rain.\n\nMAYA\nTom? On the bus." }, NOW2).state;
    state = applyCommand(state, { type: "update_note", id: "tom-lies", change: "Maya starts to doubt him, hard." }, NOW2).state;
    const xml = toFdx(state, { title: "B" });
    expect(xml).toContain('<Revisions ActiveSet="1"');
    expect(xml).toContain('<Revision Color="#5B8DEF" FullRevision="No" ID="1" Mark="*" Name="Blue" Style="" />');
    expect(xml).toContain('<Text RevisionID="1">Tom? On the bus.</Text>');
    expect(xml).not.toContain('<Text RevisionID="1">Rain.</Text>');
    expect(xml).toContain('<Text RevisionID="1">TOM LIES ABOUT THE JOB</Text>');
    expect(xml).toContain("Blue revision · 2026-09-17; changed paragraphs are marked.");
    expect(fromFdx(xml).setAside.revisedParagraphs).toBe(2);
  });
});
