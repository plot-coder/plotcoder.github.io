import { describe, expect, it } from "vitest";
import { fromFdx, toFdx } from "./fdx";
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
    // The unwritten cards print their change line as action.
    expect(xml).toContain("<Text>Maya starts to doubt him.</Text>");
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
