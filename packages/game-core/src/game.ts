import type { Card, Suit } from "./cards.js";
import { sameCard } from "./cards.js";
import { createDeck, deal, shuffle } from "./deck.js";
import {
  type Rng,
  rngFromSeed,
} from "./rng.js";
import {
  type PlayerId,
  type ResolvedTrick,
  type Trick,
  legalPlays,
  nextPlayer,
  resolveTrick,
} from "./trick.js";
import {
  DEFAULT_HAND_TYPES,
  DEFAULT_HAND_TYPES_BY_ID,
} from "./hands/defaults.js";
import { type HandType, type Scores, addScores, zeroScores } from "./hands/types.js";

export const CARDS_PER_PLAYER = 13;
export const NUM_PLAYERS = 4;

export interface GameOptions {
  readonly handTypes: readonly HandType[];
  readonly totalHands: number;
  readonly seed: string;
  readonly firstChooser: PlayerId;
}

export const DEFAULT_GAME_OPTIONS: Omit<GameOptions, "seed"> = {
  handTypes: DEFAULT_HAND_TYPES,
  totalHands: 10,
  firstChooser: 0,
};

export type GamePhase =
  | { readonly kind: "pick-hand" }
  | { readonly kind: "pick-trump"; readonly handTypeId: string }
  | {
      readonly kind: "play";
      readonly handTypeId: string;
      readonly trump?: Suit;
      readonly turn: PlayerId;
      readonly currentTrick: Trick;
      readonly resolvedTricks: readonly ResolvedTrick[];
    }
  | {
      readonly kind: "hand-summary";
      readonly handTypeId: string;
      readonly scores: Scores;
    }
  | { readonly kind: "game-over" };

export interface ScoreSheetEntry {
  readonly handTypeId: string;
  readonly chooser: PlayerId;
  readonly scores: Scores;
}

export interface GameState {
  readonly options: GameOptions;
  readonly handsPlayed: number;
  readonly remainingHandTypeIds: readonly string[];
  readonly chooser: PlayerId;
  readonly playerCards: readonly [
    readonly Card[],
    readonly Card[],
    readonly Card[],
    readonly Card[],
  ];
  readonly phase: GamePhase;
  readonly scoreSheet: readonly ScoreSheetEntry[];
  readonly totals: Scores;
  readonly rngState: number;
}

export type GameAction =
  | { readonly kind: "pick-hand"; readonly handTypeId: string }
  | { readonly kind: "pick-trump"; readonly suit: Suit }
  | { readonly kind: "play-card"; readonly player: PlayerId; readonly card: Card }
  | { readonly kind: "advance-after-hand" };

export class GameError extends Error {}

export function startGame(options: GameOptions): GameState {
  if (options.totalHands <= 0) {
    throw new GameError("totalHands must be positive");
  }
  if (options.totalHands > options.handTypes.length) {
    throw new GameError(
      "totalHands cannot exceed number of distinct hand types",
    );
  }
  const rng = rngFromSeed(options.seed);
  const [cards, nextState] = dealNewHand(rng);
  return {
    options,
    handsPlayed: 0,
    remainingHandTypeIds: options.handTypes.map((h) => h.id),
    chooser: options.firstChooser,
    playerCards: cards,
    phase: { kind: "pick-hand" },
    scoreSheet: [],
    totals: zeroScores(),
    rngState: nextState,
  };
}

function dealNewHand(rng: Rng): [
  readonly [
    readonly Card[],
    readonly Card[],
    readonly Card[],
    readonly Card[],
  ],
  number,
] {
  const shuffled = shuffle(createDeck(), rng);
  const dealt = deal(shuffled, NUM_PLAYERS, CARDS_PER_PLAYER);
  // Capture the rng's next state by sampling once more so reseeds are
  // reproducible across deals within a single game.
  const next = Math.floor(rng() * 0xffffffff);
  return [
    [dealt[0]!, dealt[1]!, dealt[2]!, dealt[3]!] as const,
    next,
  ];
}

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.kind) {
    case "pick-hand":
      return handlePickHand(state, action.handTypeId);
    case "pick-trump":
      return handlePickTrump(state, action.suit);
    case "play-card":
      return handlePlayCard(state, action.player, action.card);
    case "advance-after-hand":
      return advanceAfterHand(state);
  }
}

function handlePickHand(state: GameState, handTypeId: string): GameState {
  if (state.phase.kind !== "pick-hand") {
    throw new GameError(`Cannot pick hand in phase ${state.phase.kind}`);
  }
  if (!state.remainingHandTypeIds.includes(handTypeId)) {
    throw new GameError(`Hand type not available: ${handTypeId}`);
  }
  const handType = lookupHandType(state, handTypeId);
  if (handType.trump.kind === "chooser") {
    return { ...state, phase: { kind: "pick-trump", handTypeId } };
  }
  const trump = handType.trump.kind === "fixed" ? handType.trump.suit : undefined;
  return enterPlayPhase(state, handTypeId, trump);
}

function handlePickTrump(state: GameState, suit: Suit): GameState {
  if (state.phase.kind !== "pick-trump") {
    throw new GameError(`Cannot pick trump in phase ${state.phase.kind}`);
  }
  return enterPlayPhase(state, state.phase.handTypeId, suit);
}

function enterPlayPhase(
  state: GameState,
  handTypeId: string,
  trump: Suit | undefined,
): GameState {
  const phase: GamePhase = trump !== undefined ? {
    kind: "play",
    handTypeId,
    trump,
    turn: state.chooser,
    currentTrick: { leader: state.chooser, plays: [] },
    resolvedTricks: [],
  } : {
    kind: "play",
    handTypeId,
    turn: state.chooser,
    currentTrick: { leader: state.chooser, plays: [] },
    resolvedTricks: [],
  };
  return { ...state, phase };
}

function handlePlayCard(
  state: GameState,
  player: PlayerId,
  card: Card,
): GameState {
  if (state.phase.kind !== "play") {
    throw new GameError(`Cannot play card in phase ${state.phase.kind}`);
  }
  if (player !== state.phase.turn) {
    throw new GameError(`Not player ${player}'s turn`);
  }
  const hand = state.playerCards[player];
  if (!hand.some((c) => sameCard(c, card))) {
    throw new GameError(`Player ${player} does not hold ${card.rank}${card.suit}`);
  }
  const legal = legalPlays(hand, state.phase.currentTrick);
  if (!legal.some((c) => sameCard(c, card))) {
    throw new GameError(`Illegal play: must follow suit`);
  }

  const newHand = hand.filter((c) => !sameCard(c, card));
  const newPlayerCards: GameState["playerCards"] = [
    player === 0 ? newHand : state.playerCards[0],
    player === 1 ? newHand : state.playerCards[1],
    player === 2 ? newHand : state.playerCards[2],
    player === 3 ? newHand : state.playerCards[3],
  ];

  const updatedTrick: Trick = {
    leader: state.phase.currentTrick.leader,
    plays: [...state.phase.currentTrick.plays, { player, card }],
  };

  if (updatedTrick.plays.length < NUM_PLAYERS) {
    const next: GamePhase = state.phase.trump !== undefined ? {
      kind: "play",
      handTypeId: state.phase.handTypeId,
      trump: state.phase.trump,
      turn: nextPlayer(player),
      currentTrick: updatedTrick,
      resolvedTricks: state.phase.resolvedTricks,
    } : {
      kind: "play",
      handTypeId: state.phase.handTypeId,
      turn: nextPlayer(player),
      currentTrick: updatedTrick,
      resolvedTricks: state.phase.resolvedTricks,
    };
    return {
      ...state,
      playerCards: newPlayerCards,
      phase: next,
    };
  }

  const resolved = resolveTrick(updatedTrick, state.phase.trump);
  const allResolved = [...state.phase.resolvedTricks, resolved];

  if (allResolved.length < CARDS_PER_PLAYER) {
    const next: GamePhase = state.phase.trump !== undefined ? {
      kind: "play",
      handTypeId: state.phase.handTypeId,
      trump: state.phase.trump,
      turn: resolved.winner,
      currentTrick: { leader: resolved.winner, plays: [] },
      resolvedTricks: allResolved,
    } : {
      kind: "play",
      handTypeId: state.phase.handTypeId,
      turn: resolved.winner,
      currentTrick: { leader: resolved.winner, plays: [] },
      resolvedTricks: allResolved,
    };
    return {
      ...state,
      playerCards: newPlayerCards,
      phase: next,
    };
  }

  const handType = lookupHandType(state, state.phase.handTypeId);
  const scores = handType.scoreHand({
    resolvedTricks: allResolved,
    chooser: state.chooser,
    ...(state.phase.trump !== undefined ? { trump: state.phase.trump } : {}),
  });
  return {
    ...state,
    playerCards: newPlayerCards,
    phase: {
      kind: "hand-summary",
      handTypeId: state.phase.handTypeId,
      scores,
    },
  };
}

function advanceAfterHand(state: GameState): GameState {
  const phase = state.phase;
  if (phase.kind !== "hand-summary") {
    throw new GameError(`Cannot advance in phase ${phase.kind}`);
  }
  const entry: ScoreSheetEntry = {
    handTypeId: phase.handTypeId,
    chooser: state.chooser,
    scores: phase.scores,
  };
  const handsPlayed = state.handsPlayed + 1;
  const totals = addScores(state.totals, entry.scores);
  const remaining = state.remainingHandTypeIds.filter(
    (id) => id !== phase.handTypeId,
  );

  if (handsPlayed >= state.options.totalHands || remaining.length === 0) {
    return {
      ...state,
      handsPlayed,
      remainingHandTypeIds: remaining,
      scoreSheet: [...state.scoreSheet, entry],
      totals,
      phase: { kind: "game-over" },
    };
  }

  const rng = rngFromSeed(state.rngState);
  const [cards, nextRng] = dealNewHand(rng);
  return {
    ...state,
    handsPlayed,
    remainingHandTypeIds: remaining,
    chooser: nextPlayer(state.chooser),
    playerCards: cards,
    scoreSheet: [...state.scoreSheet, entry],
    totals,
    phase: { kind: "pick-hand" },
    rngState: nextRng,
  };
}

function lookupHandType(state: GameState, handTypeId: string): HandType {
  const fromOptions = state.options.handTypes.find((h) => h.id === handTypeId);
  if (fromOptions) return fromOptions;
  const fallback = DEFAULT_HAND_TYPES_BY_ID[handTypeId];
  if (!fallback) {
    throw new GameError(`Unknown hand type: ${handTypeId}`);
  }
  return fallback;
}
