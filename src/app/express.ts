import path from "path";
import express from "express";
import logger from "@packages/logger";

import {HOSTNAME, HTTP_PORT} from "./env";

const PUBLIC_DIR = path.join(__dirname, "..", "..", "..", "public");

const log = logger("express");

const app = express();
const api = express.Router();

app.use(express.json({ type: "application/json" }))
app.use(express.static(PUBLIC_DIR));

app.use(api);

// todo: remove this and use nginx to route /api to here
app.use("/*", (req, res) => {
  res.sendFile("index.html", {root: PUBLIC_DIR})
});

app.listen(HTTP_PORT, () => log.info("Web Server running on %o port %o", HOSTNAME, HTTP_PORT));

export default api;