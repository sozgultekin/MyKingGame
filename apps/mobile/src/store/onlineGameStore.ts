import {
  type GameAction,
  type PlayerId,
  type PlayerView,
} from "@mykinggame/game-core";
import { Client, type Room } from "colyseus.js";
import { create } from "zustand";

const SERVER_URL =
  process.env.EXPO_PUBLIC_KING_SERVER_URL ?? "ws://localhost:2567";

export type OnlineStatus =
  | "idle"
  | "connecting"
  | "lobby"
  | "playing"
  | "finished"
  | "error";

export interface OnlineGameStore {
  status: OnlineStatus;
  error: string | null;
  code: string | null;
  mySeat: PlayerId | null;
  lobbyOccupied: Readonly<Record<PlayerId, boolean>> | null;
  view: PlayerView | null;
  createRoom: (displayName: string) => Promise<void>;
  joinRoom: (code: string, displayName: string) => Promise<void>;
  sendReady: () => void;
  sendAction: (action: GameAction) => void;
  leave: () => Promise<void>;
  reset: () => void;
}

interface InternalRefs {
  client: Client | null;
  room: Room | null;
}

const refs: InternalRefs = { client: null, room: null };

function getClient(): Client {
  if (!refs.client) refs.client = new Client(SERVER_URL);
  return refs.client;
}

function generateCode(length = 5): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const useOnlineGame = create<OnlineGameStore>((set) => ({
  status: "idle",
  error: null,
  code: null,
  mySeat: null,
  lobbyOccupied: null,
  view: null,

  createRoom: async (displayName) => {
    set({ status: "connecting", error: null });
    try {
      const code = generateCode();
      const room = await getClient().create("king", {
        code,
        displayName,
        fillWithBots: true,
      });
      bindRoom(room, set);
      refs.room = room;
      set({ code, status: "lobby" });
    } catch (e) {
      set({ status: "error", error: errMsg(e) });
    }
  },

  joinRoom: async (code, displayName) => {
    set({ status: "connecting", error: null });
    try {
      const room = await getClient().join("king", {
        code: code.toUpperCase(),
        displayName,
      });
      bindRoom(room, set);
      refs.room = room;
      set({ code: code.toUpperCase(), status: "lobby" });
    } catch (e) {
      set({ status: "error", error: errMsg(e) });
    }
  },

  sendReady: () => {
    refs.room?.send("ready", {});
  },

  sendAction: (action) => {
    refs.room?.send("action", { action });
  },

  leave: async () => {
    if (refs.room) {
      await refs.room.leave();
      refs.room = null;
    }
    set({
      status: "idle",
      code: null,
      mySeat: null,
      lobbyOccupied: null,
      view: null,
      error: null,
    });
  },

  reset: () =>
    set({
      status: "idle",
      code: null,
      mySeat: null,
      lobbyOccupied: null,
      view: null,
      error: null,
    }),
}));

function bindRoom(
  room: Room,
  set: (partial: Partial<OnlineGameStore>) => void,
): void {
  room.onMessage("seat-assigned", (msg: { seat: PlayerId }) => {
    set({ mySeat: msg.seat });
  });

  room.onMessage(
    "lobby",
    (msg: { code: string; occupied: Record<PlayerId, boolean> }) => {
      set({ code: msg.code, lobbyOccupied: msg.occupied, status: "lobby" });
    },
  );

  room.onMessage("game-started", () => {
    set({ status: "playing" });
  });

  room.onMessage("view", (msg: { view: PlayerView }) => {
    const status =
      msg.view.publicState.phase.kind === "game-over" ? "finished" : "playing";
    set({ view: msg.view, status });
  });

  room.onMessage("error", (msg: { message: string }) => {
    set({ error: msg.message });
  });

  room.onLeave(() => {
    set({ status: "idle", view: null, lobbyOccupied: null });
  });
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Bağlantı hatası";
}
