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
  toPlayerView,
} from "@mykinggame/game-core";
import { Client, Room } from "@colyseus/core";
import { Schema, type } from "@colyseus/schema";

const BOT_DELAY_MS = 600;
const SEATS: PlayerId[] = [0, 1, 2, 3];

class KingRoomState extends Schema {
  @type("string") status: "lobby" | "playing" | "finished" = "lobby";
  @type("string") code = "";
}

interface OccupiedSeat {
  readonly kind: "human";
  readonly client: Client;
  readonly displayName: string;
}

interface BotSeat {
  readonly kind: "bot";
  readonly displayName: string;
}

type Seat = OccupiedSeat | BotSeat | null;

export interface CreateOptions {
  readonly code?: string;
  readonly displayName?: string;
  readonly fillWithBots?: boolean;
}

export class KingRoom extends Room<KingRoomState> {
  override maxClients = 4;
  private seats: Seat[] = [null, null, null, null];
  private game: GameState | null = null;
  private fillWithBots = true;
  private readonly bot = createRuleBasedBot();
  private botTimer: NodeJS.Timeout | null = null;

  override onCreate(options: CreateOptions): void {
    const state = new KingRoomState();
    state.code = (options.code ?? generateCode()).toUpperCase();
    this.setState(state);
    this.fillWithBots = options.fillWithBots ?? true;
    this.setMetadata({ code: state.code });

    this.onMessage("action", (client, payload: { action: GameAction }) => {
      this.handleAction(client, payload?.action);
    });
    this.onMessage("ready", (client) => {
      this.handleReady(client);
    });
  }

  override onJoin(client: Client, options: CreateOptions = {}): void {
    if (this.state.status !== "lobby") {
      throw new Error("Room is already playing or finished");
    }
    const seat = this.seats.findIndex((s) => s === null);
    if (seat === -1) throw new Error("Room is full");

    this.seats[seat] = {
      kind: "human",
      client,
      displayName: options.displayName ?? `Oyuncu ${seat + 1}`,
    };
    client.userData = { seat };

    client.send("seat-assigned", { seat });
    this.broadcastLobby();
  }

  override onLeave(client: Client, consented: boolean): void {
    const seat = (client.userData as { seat?: PlayerId } | undefined)?.seat;
    if (seat === undefined) return;
    if (this.state.status === "playing") {
      // Replace with a bot so the game can continue.
      this.seats[seat] = {
        kind: "bot",
        displayName: this.seats[seat] && this.seats[seat]!.kind === "human"
          ? `${(this.seats[seat] as OccupiedSeat).displayName} (bot)`
          : "Bot",
      };
      this.scheduleBotIfNeeded();
    } else {
      this.seats[seat] = null;
      this.broadcastLobby();
    }
  }

  override onDispose(): void {
    if (this.botTimer) clearTimeout(this.botTimer);
  }

  private handleReady(client: Client): void {
    const seat = (client.userData as { seat?: PlayerId } | undefined)?.seat;
    if (seat !== 0) return;
    if (this.state.status !== "lobby") return;
    if (this.fillWithBots) {
      for (let i = 0; i < SEATS.length; i++) {
        if (!this.seats[i]) {
          this.seats[i] = { kind: "bot", displayName: `Bot ${i}` };
        }
      }
    } else if (this.seats.some((s) => s === null)) {
      client.send("error", { message: "4 oyuncu hazır olmadan başlanamaz" });
      return;
    }
    this.startGame();
  }

  private startGame(): void {
    const seed = `room-${this.state.code}-${Date.now()}`;
    this.game = startGame({ ...DEFAULT_GAME_OPTIONS, seed });
    this.state.status = "playing";
    this.broadcast("game-started", {});
    this.broadcastViews();
    this.scheduleBotIfNeeded();
  }

  private handleAction(client: Client, action: GameAction | undefined): void {
    if (!action) return;
    if (!this.game || this.state.status !== "playing") {
      client.send("error", { message: "Oyun aktif değil" });
      return;
    }
    const seat = (client.userData as { seat?: PlayerId } | undefined)?.seat;
    if (seat === undefined) {
      client.send("error", { message: "Koltuk atanmamış" });
      return;
    }
    if (!isActionForSeat(this.game, action, seat)) {
      client.send("error", { message: "Bu hamleyi şu an yapamazsın" });
      return;
    }
    try {
      this.game = applyAction(this.game, action);
    } catch (e) {
      client.send("error", {
        message: e instanceof Error ? e.message : "Geçersiz hamle",
      });
      return;
    }
    this.broadcastViews();
    if (this.game.phase.kind === "game-over") {
      this.state.status = "finished";
    }
    this.scheduleBotIfNeeded();
  }

  private scheduleBotIfNeeded(): void {
    if (this.botTimer) clearTimeout(this.botTimer);
    this.botTimer = null;
    if (!this.game) return;
    const action = this.nextBotAction();
    if (!action) return;
    this.botTimer = setTimeout(() => this.runBotStep(), BOT_DELAY_MS);
  }

  private runBotStep(): void {
    this.botTimer = null;
    if (!this.game) return;
    const action = this.nextBotAction();
    if (!action) return;
    try {
      this.game = applyAction(this.game, action);
    } catch (e) {
      console.error("Bot action failed", e);
      return;
    }
    this.broadcastViews();
    if (this.game.phase.kind === "game-over") {
      this.state.status = "finished";
    }
    if (this.game.phase.kind === "hand-summary") {
      // Auto-advance after a short pause so humans can read scores.
      this.botTimer = setTimeout(() => {
        if (!this.game) return;
        this.game = applyAction(this.game, { kind: "advance-after-hand" });
        this.broadcastViews();
        this.scheduleBotIfNeeded();
      }, 2500);
      return;
    }
    this.scheduleBotIfNeeded();
  }

  private nextBotAction(): GameAction | null {
    if (!this.game) return null;
    const phase = this.game.phase;
    switch (phase.kind) {
      case "pick-hand":
        if (!this.seatIsBot(this.game.chooser)) return null;
        return {
          kind: "pick-hand",
          handTypeId: this.bot.pickHand(this.game, this.game.chooser),
        };
      case "pick-trump":
        if (!this.seatIsBot(this.game.chooser)) return null;
        return {
          kind: "pick-trump",
          suit: this.bot.pickTrump(this.game, this.game.chooser),
        };
      case "play":
        if (!this.seatIsBot(phase.turn)) return null;
        return {
          kind: "play-card",
          player: phase.turn,
          card: this.bot.playCard(this.game, phase.turn),
        };
      default:
        return null;
    }
  }

  private seatIsBot(seat: PlayerId): boolean {
    return this.seats[seat]?.kind === "bot";
  }

  private broadcastViews(): void {
    if (!this.game) return;
    for (const seatIdx of SEATS) {
      const occupant = this.seats[seatIdx];
      if (occupant?.kind === "human") {
        const view = toPlayerView(this.game, seatIdx);
        occupant.client.send("view", { view });
      }
    }
  }

  private broadcastLobby(): void {
    const occupied: Record<PlayerId, boolean> = {
      0: this.seats[0] !== null,
      1: this.seats[1] !== null,
      2: this.seats[2] !== null,
      3: this.seats[3] !== null,
    };
    this.broadcast("lobby", {
      code: this.state.code,
      occupied,
      fillWithBots: this.fillWithBots,
    });
  }
}

function isActionForSeat(
  game: GameState,
  action: GameAction,
  seat: PlayerId,
): boolean {
  switch (action.kind) {
    case "pick-hand":
      return game.phase.kind === "pick-hand" && game.chooser === seat;
    case "pick-trump":
      return game.phase.kind === "pick-trump" && game.chooser === seat;
    case "play-card":
      return (
        game.phase.kind === "play" &&
        game.phase.turn === seat &&
        action.player === seat
      );
    case "advance-after-hand":
      return game.phase.kind === "hand-summary";
  }
}

function generateCode(length = 5): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const __testing__ = {
  isActionForSeat,
  generateCode,
};

// Suppress unused-imports in declarations.
export type _CardRef = Card;
export type _SuitRef = Suit;
