import { createServer } from "node:http";
import { Hono } from "hono";
import { collectOnce, getSnapshot } from "./collect.js";
import { config } from "./config.js";

const app = new Hono();

app.get("/health", (c) => {
  const snap = getSnapshot();
  return c.json({
    ok: true,
    mode: snap.mode,
    collectedAtIso: snap.collectedAtIso,
    pieceCount: snap.primary?.pieceCount ?? 0,
    baseCount: snap.primary?.bases.length ?? 0,
  });
});

app.get("/api/snapshot", (c) => c.json(getSnapshot()));

app.post("/api/refresh", async (c) => {
  const snap = await collectOnce();
  return c.json(snap);
});

async function main() {
  console.log(
    JSON.stringify({
      msg: "kottai-collector starting",
      port: config.port,
      dataRoot: config.dataRoot,
      primaryWorld: config.primaryWorld,
      intervalSec: config.intervalSec,
    }),
  );

  await collectOnce();
  setInterval(() => {
    void collectOnce().then((s) => {
      console.log(
        JSON.stringify({
          msg: "collect",
          mode: s.mode,
          pieces: s.primary?.pieceCount ?? 0,
          bases: s.primary?.bases.length ?? 0,
          error: s.error,
        }),
      );
    });
  }, config.intervalSec * 1000);

  createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const response = await app.fetch(new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
    }));
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  }).listen(config.port, () => {
    console.log(`collector listening on :${config.port}`);
  });
}

void main();
