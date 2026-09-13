import { describe, expect, it } from "vitest";
import { crc32, unzip, zip } from "./zip";

describe("zip (Roadmap 2, item 5)", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789")).toString(16)).toBe("cbf43926");
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("writes a stored zip that reads back entry for entry, with the signatures the format requires", () => {
    const a = new TextEncoder().encode("Maya, thirty-four.");
    const b = new Uint8Array([0, 1, 2, 255, 254]);
    const bytes = zip([{ name: "maya/maya.txt", bytes: a }, { name: "maya/face.bin", bytes: b }], new Date("2026-09-13T10:00:00"));
    // Local header, central directory, end of central directory.
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(bytes.length - 22 + 10, true)).toBe(2);
    const back = unzip(bytes);
    expect(back.map((entry) => entry.name)).toEqual(["maya/maya.txt", "maya/face.bin"]);
    expect(new TextDecoder().decode(back[0].bytes)).toBe("Maya, thirty-four.");
    expect([...back[1].bytes]).toEqual([0, 1, 2, 255, 254]);
  });

  it("writes an empty package", () => {
    expect(unzip(zip([]))).toEqual([]);
  });
});
