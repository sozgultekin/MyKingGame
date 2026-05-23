import {
  type Card,
  DEFAULT_GAME_OPTIONS,
  type GameAction,
  type GameState,
  type PlayerId,
  type Suit,
  applyAction,
  startGame,
} from "@mykinggame/game-core";
import { create } from "zustand";

export interface LocalGameStore {
  game: GameState | null;
  startNewGame: (seed?: string) => void;
  pickHand: (handTypeId: string) => void;
  pickTrump: (suit: Suit) => void;
  playCard: (player: PlayerId, card: Card) => void;
  advanceAfterHand: () => void;
  reset: () => void;
}

function newSeed(): string {
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function dispatch(state: LocalGameStore, action: GameAction): Partial<LocalGameStore> {
  if (!state.game) return {};
  return { game: applyAction(state.game, action) };
}

export const useLocalGame = create<LocalGameStore>((set) => ({
  game: null,
  startNewGame: (seed) =>
    set({ game: startGame({ ...DEFAULT_GAME_OPTIONS, seed: seed ?? newSeed() }) }),
  pickHand: (handTypeId) =>
    set((state) => dispatch(state, { kind: "pick-hand", handTypeId })),
  pickTrump: (suit) =>
    set((state) => dispatch(state, { kind: "pick-trump", suit })),
  playCard: (player, card) =>
    set((state) => dispatch(state, { kind: "play-card", player, card })),
  advanceAfterHand: () =>
    set((state) => dispatch(state, { kind: "advance-after-hand" })),
  reset: () => set({ game: null }),
}));
