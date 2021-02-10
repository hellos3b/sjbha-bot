import pino from "pino";

const pretty = {
  prettyPrint: {
    translateTime: "HH:MM",
    ignore: 'service,pid,hostname'
  }
};

const Logger = pino({
  level: process.env.LOG_LEVEL || "debug",

  // Turn on pretty print for dev mode
  ...(process.env.NODE_ENV === "production")
    ? {}
    : pretty
});

const logger = (module: string) => Logger.child({module});
export default logger;