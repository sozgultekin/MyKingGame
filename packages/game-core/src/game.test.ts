import { describe, expect, it } from "vitest";
import { sameCard } from "./cards.js";
import {
  CARDS_PER_PLAYER,
  DEFAULT_GAME_OPTIONS,
  type GameState,
  applyAction,
  startGame,
} from "./game.js";
import { type PlayerId, legalPlays } from "./trick.js";

function makeGame(overrides: Partial<{ seed: string; totalHands: number }> = {}) {
  return startGame({
    ...DEFAULT_GAME_OPTIONS,
    seed: overrides.seed ?? "test-seed",
    ...(overrides.totalHands !== undefined
      ? { totalHands: overrides.totalHands }
      : {}),
  });
}

function autoplayHand(state: GameState): GameState {
  while (state.phase.kind === "play") {
    const player = state.phase.turn as PlayerId;
    const hand = state.playerCards[player];
    const legal = legalPlays(hand, state.phase.currentTrick);
    const card = legal[0]!;
    state = applyAction(state, { kind: "play-card", player, card });
  }
  return state;
}

describe("game state machine", () => {
  it("starts in pick-hand phase with 13 cards per player", () => {
    const g = makeGame();
    expect(g.phase.kind).toBe("pick-hand");
    expect(g.handsPlayed).toBe(0);
    for (const cards of g.playerCards) {
      expect(cards).toHaveLength(CARDS_PER_PLAYER);
    }
  });

  it("rejects picking an unknown hand type", () => {
    const g = makeGame();
    expect(() => applyAction(g, { kind: "pick-hand", handTypeId: "nope" }))
      .toThrow();
  });

  it("moves to pick-trump when hand requires it", () => {
    const g = applyAction(makeGame(), { kind: "pick-hand", handTypeId: "kozlu" });
    expect(g.phase.kind).toBe("pick-trump");
  });

  it("plays a full hand and produces scores", () => {
    let g = makeGame({ totalHands: 1 });
    g = applyAction(g, { kind: "pick-hand", handTypeId: "kiz" });
    expect(g.phase.kind).toBe("play");
    g = autoplayHand(g);
    expect(g.phase.kind).toBe("hand-summary");
    if (g.phase.kind !== "hand-summary") throw new Error("unreachable");
    // Exactly 4 queens worth of penalty distributed.
    const total = g.phase.scores[0] + g.phase.scores[1] + g.phase.scores[2] + g.phase.scores[3];
    expect(total).toBe(4 * -100);
  });

  it("ends after totalHands hands", () => {
    let g = makeGame({ totalHands: 3 });
    for (let i = 0; i < 3; i++) {
      const next = g.remainingHandTypeIds[0];
      if (!next) throw new Error("no hand types left");
      g = applyAction(g, { kind: "pick-hand", handTypeId: next });
      if (g.phase.kind === "pick-trump") {
        g = applyAction(g, { kind: "pick-trump", suit: "S" });
      }
      g = autoplayHand(g);
      expect(g.phase.kind).toBe("hand-summary");
      g = applyAction(g, { kind: "advance-after-hand" });
    }
    expect(g.phase.kind).toBe("game-over");
    expect(g.handsPlayed).toBe(3);
    expect(g.scoreSheet).toHaveLength(3);
  });

  it("enforces follow-suit", () => {
    let g = makeGame({ totalHands: 1 });
    g = applyAction(g, { kind: "pick-hand", handTypeId: "kiz" });
    if (g.phase.kind !== "play") throw new Error("expected play phase");
    const leader = g.phase.turn;
    const leadHand = g.playerCards[leader];
    const leadCard = leadHand[0]!;
    g = applyAction(g, { kind: "play-card", player: leader, card: leadCard });
    if (g.phase.kind !== "play") throw new Error("expected play phase");
    const second = g.phase.turn;
    const secondHand = g.playerCards[second];
    const offSuit = secondHand.find((c) => c.suit !== leadCard.suit);
    const onSuit = secondHand.find((c) => c.suit === leadCard.suit);
    if (offSuit && onSuit) {
      expect(() =>
        applyAction(g, { kind: "play-card", player: second, card: offSuit }),
      ).toThrow();
    }
  });

  it("rotates chooser between hands", () => {
    let g = makeGame({ totalHands: 2 });
    const firstChooser = g.chooser;
    const nextId = g.remainingHandTypeIds[0]!;
    g = applyAction(g, { kind: "pick-hand", handTypeId: nextId });
    if (g.phase.kind === "pick-trump") {
      g = applyAction(g, { kind: "pick-trump", suit: "S" });
    }
    g = autoplayHand(g);
    g = applyAction(g, { kind: "advance-after-hand" });
    expect(g.chooser).toBe(((firstChooser + 1) % 4) as PlayerId);
  });

  it("produces the same hands for the same seed", () => {
    const a = makeGame({ seed: "fixed" });
    const b = makeGame({ seed: "fixed" });
    for (let p = 0; p < 4; p++) {
      const handA = a.playerCards[p as PlayerId];
      const handB = b.playerCards[p as PlayerId];
      expect(handA.length).toBe(handB.length);
      for (let i = 0; i < handA.length; i++) {
        expect(sameCard(handA[i]!, handB[i]!)).toBe(true);
      }
    }
  });
});
