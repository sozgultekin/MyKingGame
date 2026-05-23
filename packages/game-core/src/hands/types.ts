import type { Card, Suit } from "../cards.js";
import type { PlayerId, ResolvedTrick } from "../trick.js";

export type TrumpRule =
  | { readonly kind: "none" }
  | { readonly kind: "chooser" }
  | { readonly kind: "fixed"; readonly suit: Suit };

export interface HandContext {
  readonly resolvedTricks: readonly ResolvedTrick[];
  readonly trump?: Suit;
  readonly chooser: PlayerId;
}

export type Scores = Readonly<Record<PlayerId, number>>;

export interface HandType {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly trump: TrumpRule;
  scoreHand(ctx: HandContext): Scores;
}

export function zeroScores(): Scores {
  return { 0: 0, 1: 0, 2: 0, 3: 0 };
}

export function addScores(a: Scores, b: Scores): Scores {
  return {
    0: a[0] + b[0],
    1: a[1] + b[1],
    2: a[2] + b[2],
    3: a[3] + b[3],
  };
}

export function countMatchingPerWinner(
  tricks: readonly ResolvedTrick[],
  predicate: (card: Card) => boolean,
): Readonly<Record<PlayerId, number>> {
  const out: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const trick of tricks) {
    for (const play of trick.plays) {
      if (predicate(play.card)) {
        out[trick.winner] += 1;
      }
    }
  }
  return out;
}
