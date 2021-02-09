import path from "path";
import Debug from "debug";
import express from "express";

import {HOSTNAME, HTTP_PORT} from "@app/env";

const PUBLIC_DIR = path.join(__dirname, "..", "..", "..", "public");

const debug = Debug("@shared:express");

const app = express();
const api = express.Router();

app.use(express.json({ type: "application/json" }))
app.use(express.static(PUBLIC_DIR));

app.use(api);
app.use("/*", (req, res) => {
  res.sendFile("index.html", {root: PUBLIC_DIR})
});

app.listen(HTTP_PORT, () => debug("Web Server running on %o port %o", HOSTNAME, HTTP_PORT));

export default api;