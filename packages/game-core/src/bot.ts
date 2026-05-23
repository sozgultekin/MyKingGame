import {
  type Card,
  type Suit,
  isHeart,
  isJackOrKing,
  isKingOfHearts,
  isQueen,
  rankValue,
} from "./cards.js";
import type { GameState } from "./game.js";
import {
  type PlayerId,
  type Trick,
  legalPlays,
} from "./trick.js";

export interface Bot {
  pickHand(state: GameState, asPlayer: PlayerId): string;
  pickTrump(state: GameState, asPlayer: PlayerId): Suit;
  playCard(state: GameState, asPlayer: PlayerId): Card;
}

const POSITIVE_HANDS = new Set(["kozlu", "koz-yok"]);

export function createRuleBasedBot(): Bot {
  return new RuleBasedBot();
}

class RuleBasedBot implements Bot {
  pickHand(state: GameState, asPlayer: PlayerId): string {
    const remaining = state.remainingHandTypeIds;
    if (remaining.length === 0) {
      throw new Error("No remaining hand types");
    }
    const hand = state.playerCards[asPlayer];
    let best = remaining[0]!;
    let bestScore = -Infinity;
    for (const id of remaining) {
      const score = rateHandTypeForPlayer(id, hand);
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    }
    return best;
  }

  pickTrump(state: GameState, asPlayer: PlayerId): Suit {
    const hand = state.playerCards[asPlayer];
    const counts: Record<Suit, number> = { C: 0, D: 0, H: 0, S: 0 };
    const strengths: Record<Suit, number> = { C: 0, D: 0, H: 0, S: 0 };
    for (const c of hand) {
      counts[c.suit] += 1;
      strengths[c.suit] += rankValue(c.rank);
    }
    let best: Suit = "S";
    let bestScore = -Infinity;
    for (const s of ["C", "D", "H", "S"] as const) {
      const score = counts[s] * 10 + strengths[s];
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    return best;
  }

  playCard(state: GameState, asPlayer: PlayerId): Card {
    const phase = state.phase;
    if (phase.kind !== "play") {
      throw new Error("Bot can only play in play phase");
    }
    const hand = state.playerCards[asPlayer];
    const legal = legalPlays(hand, phase.currentTrick);
    if (legal.length === 0) {
      throw new Error("No legal plays");
    }

    const wantToWin = POSITIVE_HANDS.has(phase.handTypeId);
    const trump = phase.trump;
    const isLeading = phase.currentTrick.plays.length === 0;

    if (isLeading) {
      return wantToWin
        ? pickStrongLead(legal, hand, trump)
        : pickWeakLead(legal, phase.handTypeId, hand);
    }
    return pickFollow(legal, phase.currentTrick, trump, wantToWin, phase.handTypeId);
  }
}

function rateHandTypeForPlayer(id: string, hand: readonly Card[]): number {
  const numQueens = hand.filter(isQueen).length;
  const numJK = hand.filter(isJackOrKing).length;
  const numHearts = hand.filter(isHeart).length;
  const hasKH = hand.some(isKingOfHearts);
  const highCount = hand.filter((c) => rankValue(c.rank) >= 11).length;
  const lowCount = hand.filter((c) => rankValue(c.rank) <= 6).length;
  const sortedAce = hand.filter((c) => c.rank === "A").length;

  switch (id) {
    case "rifki":
      return lowCount * 2 - highCount * 2;
    case "kupa":
      return 8 - numHearts * 2;
    case "kiz":
      return 6 - numQueens * 3;
    case "erkek":
      return 8 - numJK * 2;
    case "kupa-papazi":
      return hasKH ? -10 : 5;
    case "son-iki":
      return lowCount - highCount + sortedAce;
    case "altili":
      return lowCount - highCount;
    case "pisli":
      return lowCount - highCount;
    case "kozlu":
      return longestSuitLength(hand) + highCount;
    case "koz-yok":
      return highCount - lowCount + sortedAce * 2;
    default:
      return 0;
  }
}

function longestSuitLength(hand: readonly Card[]): number {
  const counts: Record<Suit, number> = { C: 0, D: 0, H: 0, S: 0 };
  for (const c of hand) counts[c.suit] += 1;
  return Math.max(counts.C, counts.D, counts.H, counts.S);
}

function pickStrongLead(
  legal: readonly Card[],
  hand: readonly Card[],
  trump: Suit | undefined,
): Card {
  const sorted = [...legal].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
  if (trump !== undefined) {
    const nonTrump = sorted.filter((c) => c.suit !== trump);
    if (nonTrump.length > 0) return nonTrump[0]!;
  }
  return sorted[0]!;
}

function pickWeakLead(
  legal: readonly Card[],
  handTypeId: string,
  hand: readonly Card[],
): Card {
  const ranked = [...legal].sort((a, b) => {
    const dangerDiff = cardDanger(a, handTypeId) - cardDanger(b, handTypeId);
    if (dangerDiff !== 0) return dangerDiff;
    return rankValue(a.rank) - rankValue(b.rank);
  });
  return ranked[0]!;
}

function pickFollow(
  legal: readonly Card[],
  trick: Trick,
  trump: Suit | undefined,
  wantToWin: boolean,
  handTypeId: string,
): Card {
  const lead = trick.plays[0]!.card.suit;
  const winningCard = currentWinner(trick, trump);

  const sortedAsc = [...legal].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
  const sortedDesc = [...legal].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));

  if (wantToWin) {
    const winners = legal.filter((c) =>
      isWinningPlay(c, winningCard, lead, trump),
    );
    if (winners.length > 0) {
      return winners.sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0]!;
    }
    return sortedAsc[0]!;
  }

  const safe = legal.filter((c) => !isWinningPlay(c, winningCard, lead, trump));
  if (safe.length > 0) {
    return safe.sort(
      (a, b) =>
        cardDanger(a, handTypeId) - cardDanger(b, handTypeId) ||
        rankValue(b.rank) - rankValue(a.rank),
    )[0]!;
  }
  return sortedAsc.sort(
    (a, b) => cardDanger(a, handTypeId) - cardDanger(b, handTypeId),
  )[0]!;
}

function currentWinner(trick: Trick, trump: Suit | undefined): Card {
  const lead = trick.plays[0]!.card.suit;
  let best = trick.plays[0]!.card;
  for (let i = 1; i < trick.plays.length; i++) {
    const c = trick.plays[i]!.card;
    if (beats(c, best, lead, trump)) best = c;
  }
  return best;
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

function isWinningPlay(
  candidate: Card,
  current: Card,
  lead: Suit,
  trump: Suit | undefined,
): boolean {
  return beats(candidate, current, lead, trump);
}

function cardDanger(card: Card, handTypeId: string): number {
  switch (handTypeId) {
    case "kupa":
      return isHeart(card) ? 5 : 0;
    case "kiz":
      return isQueen(card) ? 20 : 0;
    case "erkek":
      return isJackOrKing(card) ? 10 : 0;
    case "kupa-papazi":
      return isKingOfHearts(card) ? 100 : isHeart(card) ? 1 : 0;
    case "rifki":
    case "son-iki":
    case "altili":
    case "pisli":
      return rankValue(card.rank);
    default:
      return 0;
  }
}
