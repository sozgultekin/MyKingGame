import { type Card, type Suit, rankValue } from "./cards.js";

export type PlayerId = 0 | 1 | 2 | 3;
export const PLAYER_IDS: readonly PlayerId[] = [0, 1, 2, 3] as const;

export interface TrickPlay {
  readonly player: PlayerId;
  readonly card: Card;
}

export interface Trick {
  readonly leader: PlayerId;
  readonly plays: readonly TrickPlay[];
}

export interface ResolvedTrick extends Trick {
  readonly winner: PlayerId;
  readonly leadSuit: Suit;
}

export function leadSuitOf(trick: Trick): Suit | undefined {
  return trick.plays[0]?.card.suit;
}

export function legalPlays(
  hand: readonly Card[],
  trick: Trick,
): Card[] {
  const lead = leadSuitOf(trick);
  if (lead === undefined) return hand.slice();
  const sameSuit = hand.filter((c) => c.suit === lead);
  return sameSuit.length > 0 ? sameSuit : hand.slice();
}

export function trickWinner(trick: Trick, trump?: Suit): PlayerId {
  if (trick.plays.length === 0) {
    throw new Error("Empty trick has no winner");
  }
  const lead = trick.plays[0]!.card.suit;
  let best = trick.plays[0]!;
  for (let i = 1; i < trick.plays.length; i++) {
    const play = trick.plays[i]!;
    if (beats(play.card, best.card, lead, trump)) {
      best = play;
    }
  }
  return best.player;
}

function beats(
  candidate: Card,
  current: Card,
  lead: Suit,
  trump: Suit | undefined,
): boolean {
  if (trump !== undefined) {
    if (candidate.suit === trump && current.suit !== trump) return true;
    if (candidate.suit !== trump && current.suit === trump) return false;
    if (candidate.suit === trump && current.suit === trump) {
      return rankValue(candidate.rank) > rankValue(current.rank);
    }
  }
  if (candidate.suit !== lead) return false;
  if (current.suit !== lead) return true;
  return rankValue(candidate.rank) > rankValue(current.rank);
}

export function resolveTrick(trick: Trick, trump?: Suit): ResolvedTrick {
  const leadSuit = leadSuitOf(trick);
  if (leadSuit === undefined) {
    throw new Error("Cannot resolve empty trick");
  }
  return {
    ...trick,
    leadSuit,
    winner: trickWinner(trick, trump),
  };
}

export function nextPlayer(p: PlayerId): PlayerId {
  return ((p + 1) % 4) as PlayerId;
}
