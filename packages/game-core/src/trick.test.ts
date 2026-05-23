import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import { type Trick, legalPlays, resolveTrick, trickWinner } from "./trick.js";

const C = (s: string): Card => {
  const suit = s.slice(-1) as Card["suit"];
  const rank = s.slice(0, -1) as Card["rank"];
  return { suit, rank };
};

describe("trick", () => {
  it("declares the highest lead-suit card the winner when no trump", () => {
    const trick: Trick = {
      leader: 0,
      plays: [
        { player: 0, card: C("5H") },
        { player: 1, card: C("QH") },
        { player: 2, card: C("3H") },
        { player: 3, card: C("9C") },
      ],
    };
    expect(trickWinner(trick)).toBe(1);
  });

  it("respects trump over lead suit", () => {
    const trick: Trick = {
      leader: 0,
      plays: [
        { player: 0, card: C("AH") },
        { player: 1, card: C("QH") },
        { player: 2, card: C("2S") },
        { player: 3, card: C("9H") },
      ],
    };
    expect(trickWinner(trick, "S")).toBe(2);
  });

  it("higher trump beats lower trump", () => {
    const trick: Trick = {
      leader: 0,
      plays: [
        { player: 0, card: C("AH") },
        { player: 1, card: C("3S") },
        { player: 2, card: C("KS") },
        { player: 3, card: C("9H") },
      ],
    };
    expect(trickWinner(trick, "S")).toBe(2);
  });

  it("must follow suit when possible", () => {
    const hand: Card[] = [C("AC"), C("2H"), C("KH"), C("5S")];
    const trick: Trick = { leader: 0, plays: [{ player: 0, card: C("3H") }] };
    const legal = legalPlays(hand, trick);
    expect(legal).toHaveLength(2);
    expect(legal.map((c) => c.suit).every((s) => s === "H")).toBe(true);
  });

  it("can play anything when out of suit", () => {
    const hand: Card[] = [C("AC"), C("5S")];
    const trick: Trick = { leader: 0, plays: [{ player: 0, card: C("3H") }] };
    expect(legalPlays(hand, trick)).toHaveLength(2);
  });

  it("can play anything when leading", () => {
    const hand: Card[] = [C("AC"), C("2H"), C("KH")];
    const trick: Trick = { leader: 0, plays: [] };
    expect(legalPlays(hand, trick)).toHaveLength(3);
  });

  it("resolves include lead suit and winner", () => {
    const trick: Trick = {
      leader: 0,
      plays: [
        { player: 0, card: C("5H") },
        { player: 1, card: C("9H") },
        { player: 2, card: C("3H") },
        { player: 3, card: C("KH") },
      ],
    };
    const r = resolveTrick(trick);
    expect(r.leadSuit).toBe("H");
    expect(r.winner).toBe(3);
  });
});
