import { describe, expect, it } from "vitest";
import { cardId, parseCard, rankValue, sameCard } from "./cards.js";

describe("cards", () => {
  it("round-trips card id parsing", () => {
    for (const id of ["2C", "TH", "JD", "QS", "KH", "AC"]) {
      const c = parseCard(id);
      expect(cardId(c)).toBe(id);
    }
  });

  it("orders ranks correctly", () => {
    expect(rankValue("2")).toBeLessThan(rankValue("T"));
    expect(rankValue("T")).toBeLessThan(rankValue("J"));
    expect(rankValue("J")).toBeLessThan(rankValue("Q"));
    expect(rankValue("Q")).toBeLessThan(rankValue("K"));
    expect(rankValue("K")).toBeLessThan(rankValue("A"));
  });

  it("sameCard compares by suit and rank", () => {
    expect(sameCard({ rank: "A", suit: "S" }, { rank: "A", suit: "S" })).toBe(true);
    expect(sameCard({ rank: "A", suit: "S" }, { rank: "A", suit: "H" })).toBe(false);
  });

  it("rejects invalid ids", () => {
    expect(() => parseCard("1S")).toThrow();
    expect(() => parseCard("AX")).toThrow();
    expect(() => parseCard("")).toThrow();
  });
});
