import type { Card } from "./cards.js";
import type {
  GameAction,
  GamePhase,
  GameState,
  ScoreSheetEntry,
} from "./game.js";
import type { PlayerId } from "./trick.js";
import type { Scores } from "./hands/types.js";

export interface PublicGameState {
  readonly handsPlayed: number;
  readonly totalHands: number;
  readonly remainingHandTypeIds: readonly string[];
  readonly chooser: PlayerId;
  readonly cardCounts: Readonly<Record<PlayerId, number>>;
  readonly phase: GamePhase;
  readonly scoreSheet: readonly ScoreSheetEntry[];
  readonly totals: Scores;
}

export interface PlayerView {
  readonly publicState: PublicGameState;
  readonly yourSeat: PlayerId;
  readonly yourHand: readonly Card[];
}

export function toPublicState(state: GameState): PublicGameState {
  return {
    handsPlayed: state.handsPlayed,
    totalHands: state.options.totalHands,
    remainingHandTypeIds: state.remainingHandTypeIds,
    chooser: state.chooser,
    cardCounts: {
      0: state.playerCards[0].length,
      1: state.playerCards[1].length,
      2: state.playerCards[2].length,
      3: state.playerCards[3].length,
    },
    phase: state.phase,
    scoreSheet: state.scoreSheet,
    totals: state.totals,
  };
}

export function toPlayerView(state: GameState, seat: PlayerId): PlayerView {
  return {
    publicState: toPublicState(state),
    yourSeat: seat,
    yourHand: state.playerCards[seat],
  };
}

export type ClientMessage =
  | { readonly kind: "action"; readonly action: GameAction }
  | { readonly kind: "ready" };

export type ServerMessage =
  | { readonly kind: "view"; readonly view: PlayerView }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "seat-assigned"; readonly seat: PlayerId }
  | {
      readonly kind: "lobby";
      readonly code: string;
      readonly occupied: Readonly<Record<PlayerId, boolean>>;
      readonly fillWithBots: boolean;
    }
  | { readonly kind: "game-started" };
