import {
  type Card,
  DEFAULT_GAME_OPTIONS,
  type GameAction,
  type GameState,
  type PlayerId,
  type Suit,
  applyAction,
  createRuleBasedBot,
  startGame,
} from "@mykinggame/game-core";
import { create } from "zustand";

const bot = createRuleBasedBot();

export const HUMAN: PlayerId = 0;

export interface SingleGameStore {
  game: GameState | null;
  startNewGame: (seed?: string) => void;
  pickHand: (handTypeId: string) => void;
  pickTrump: (suit: Suit) => void;
  playCard: (card: Card) => void;
  advanceAfterHand: () => void;
  stepBot: () => void;
  reset: () => void;
}

function newSeed(): string {
  return `single-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function dispatch(state: SingleGameStore, action: GameAction): Partial<SingleGameStore> {
  if (!state.game) return {};
  return { game: applyAction(state.game, action) };
}

export const useSingleGame = create<SingleGameStore>((set, get) => ({
  game: null,
  startNewGame: (seed) =>
    set({ game: startGame({ ...DEFAULT_GAME_OPTIONS, seed: seed ?? newSeed() }) }),
  pickHand: (handTypeId) => {
    const { game } = get();
    if (!game || game.chooser !== HUMAN || game.phase.kind !== "pick-hand") return;
    set((s) => dispatch(s, { kind: "pick-hand", handTypeId }));
  },
  pickTrump: (suit) => {
    const { game } = get();
    if (!game || game.chooser !== HUMAN || game.phase.kind !== "pick-trump") return;
    set((s) => dispatch(s, { kind: "pick-trump", suit }));
  },
  playCard: (card) => {
    const { game } = get();
    if (!game || game.phase.kind !== "play" || game.phase.turn !== HUMAN) return;
    set((s) => dispatch(s, { kind: "play-card", player: HUMAN, card }));
  },
  advanceAfterHand: () => set((s) => dispatch(s, { kind: "advance-after-hand" })),
  stepBot: () => {
    const { game } = get();
    if (!game) return;
    const action = nextBotAction(game);
    if (!action) return;
    set((s) => dispatch(s, action));
  },
  reset: () => set({ game: null }),
}));

export function nextBotAction(game: GameState): GameAction | null {
  switch (game.phase.kind) {
    case "pick-hand":
      if (game.chooser === HUMAN) return null;
      return { kind: "pick-hand", handTypeId: bot.pickHand(game, game.chooser) };
    case "pick-trump":
      if (game.chooser === HUMAN) return null;
      return { kind: "pick-trump", suit: bot.pickTrump(game, game.chooser) };
    case "play":
      if (game.phase.turn === HUMAN) return null;
      return {
        kind: "play-card",
        player: game.phase.turn,
        card: bot.playCard(game, game.phase.turn),
      };
    default:
      return null;
  }
}
