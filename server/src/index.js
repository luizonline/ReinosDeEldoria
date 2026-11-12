// Esqueleto inicial. O cliente ainda não se conecta a este servidor.
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

const gameServer = new Server({
  transport: new WebSocketTransport({}),
});

gameServer.define("eldoria_world", class {});

const port = Number(process.env.PORT || 2567);
await gameServer.listen(port);
console.log(`Eldoria server listening on :${port}`);
