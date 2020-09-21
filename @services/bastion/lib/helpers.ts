import Request from "./Request";

export type ErrorHandler = (error: Error, req: Request) => string|Promise<string>;
export type ErrorHandlers = Record<string, ErrorHandler>;

/**
 * Wraps the command in a `try/catch`, and lets you pass in an Error Handler for dealing with thrown errors
 */
export const request = (runner: (req: Request)=>void, errors: ErrorHandlers = {}) => async (req: Request) => {
  try {
    await runner(req);
  } catch (err) {
    const handler = errors[err.name];
    if (!handler) throw err;

    const msg = await handler(err, req);
    msg && req.reply(msg);
  }
}

/**
 * Send back a message
 */
export const echo = (msg: string|(()=>Promise<string>)) => async (req: Request) => {
  if (typeof msg === 'string') {
    await req.reply(msg);
    return;
  }
  
  await msg().then(content => req.reply(content));
}

/**
 * Format text into inline code
 */
export const pre = (msg: string) => "`" + msg + "`";

export const bold = (msg: string) => "**" + msg + "**";