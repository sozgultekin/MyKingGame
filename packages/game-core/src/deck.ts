import { type Card, RANKS, SUITS } from "./cards.js";
import type { Rng } from "./rng.js";

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export function deal(
  deck: readonly Card[],
  players: number,
  cardsEach: number,
): Card[][] {
  if (deck.length < players * cardsEach) {
    throw new Error(
      `Not enough cards: need ${players * cardsEach}, have ${deck.length}`,
    );
  }
  const hands: Card[][] = Array.from({ length: players }, () => []);
  for (let i = 0; i < players * cardsEach; i++) {
    hands[i % players]!.push(deck[i]!);
  }
  return hands;
}
