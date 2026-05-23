import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { KingRoom } from "./KingRoom.js";

const PORT = Number(process.env.PORT ?? 2567);

const gameServer = new Server({
  transport: new WebSocketTransport({}),
});

gameServer.define("king", KingRoom).filterBy(["code"]);

gameServer.listen(PORT);
console.log(`[king-server] listening on :${PORT}`);
