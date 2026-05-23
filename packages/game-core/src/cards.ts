export const SUITS = ["C", "D", "H", "S"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [
  "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A",
] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

const RANK_VALUE: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};

export function rankValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

export function isQueen(card: Card): boolean {
  return card.rank === "Q";
}

export function isJackOrKing(card: Card): boolean {
  return card.rank === "J" || card.rank === "K";
}

export function isHeart(card: Card): boolean {
  return card.suit === "H";
}

export function isKingOfHearts(card: Card): boolean {
  return card.suit === "H" && card.rank === "K";
}

export function cardId(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function parseCard(id: string): Card {
  if (id.length < 2 || id.length > 3) {
    throw new Error(`Invalid card id: ${id}`);
  }
  const suit = id.slice(-1) as Suit;
  const rank = id.slice(0, -1) as Rank;
  if (!SUITS.includes(suit)) throw new Error(`Invalid suit in: ${id}`);
  if (!RANKS.includes(rank)) throw new Error(`Invalid rank in: ${id}`);
  return { suit, rank };
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}
