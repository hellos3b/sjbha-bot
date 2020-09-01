import Debug from "debug";
import * as express from "express";

const debug = Debug("@sjbha");

const app = express();
app.use(express.json({ type: "application/json" }))

app.get("/status", (req, res) => {
  res.send("Up and running")
});

app.listen(5000, () => debug("Hello World!"));

import Bastion from "@sjbha/bastion";

Bastion();