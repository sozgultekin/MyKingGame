import { describe, expect, it } from "vitest";
import { cardId } from "./cards.js";
import { createDeck, deal, shuffle } from "./deck.js";
import { rngFromSeed } from "./rng.js";

describe("deck", () => {
  it("creates 52 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    const ids = new Set(deck.map(cardId));
    expect(ids.size).toBe(52);
  });

  it("shuffles deterministically by seed", () => {
    const a = shuffle(createDeck(), rngFromSeed("hello")).map(cardId);
    const b = shuffle(createDeck(), rngFromSeed("hello")).map(cardId);
    const c = shuffle(createDeck(), rngFromSeed("world")).map(cardId);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("deals 13 cards to each of 4 players", () => {
    const hands = deal(createDeck(), 4, 13);
    expect(hands).toHaveLength(4);
    for (const h of hands) expect(h).toHaveLength(13);
    const ids = hands.flat().map(cardId);
    expect(new Set(ids).size).toBe(52);
  });

  it("throws if deck is too small", () => {
    expect(() => deal(createDeck().slice(0, 10), 4, 13)).toThrow();
  });
});
