/* eslint-disable no-console */

import chalk from 'chalk';
import logfmt from 'logfmt';
import { AsyncLocalStorage } from 'async_hooks';
import * as DiscordJs from 'discord.js';
import { IS_PRODUCTION } from './env';

// Used to track logs over a request
const traceContext = new AsyncLocalStorage ();

interface Logger {
  command(message: DiscordJs.Message, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: unknown): void;
}

interface LogData {
  level: 'info' | 'debug' | 'error';
  message: string;
  module: string;
  data: Record<string, unknown>;
}

function prettified ({ level, message, module, data } : LogData) {
  const color =
    (level === 'info') ? chalk.cyan :
    (level === 'debug') ? chalk.hex ('#ffa500') :
    (level === 'error') ? chalk.redBright :
    chalk.white;

  console.log (
    '[' + color (level.toUpperCase ()) + ']',
    chalk.gray (new Date ().toLocaleTimeString ()), 
    chalk.magentaBright (module),
    message
  );

  for (const key of Object.keys (data)) 
    console.log ('    ', key+':', chalk.greenBright (JSON.stringify (data[key])));
}

function formatted ({ level, module, message, data }: LogData) {
  const trace = traceContext.getStore () ?? '';
  console.log (logfmt.stringify ({ 
    level, 
    module,
    message, 
    timestamp: new Date ().toISOString (), 
    trace, 
    ...data 
  }));
}

function log(data: LogData) {
  if (IS_PRODUCTION)
    formatted (data);
  else
    prettified (data);
}

/**
 * Info should just be called for entries/events
 *  Makes it so you can browse a log of info's to find a related one.
 *  Everything else should be in debug
 */
export function make(module: string) : Logger {
  return {
    command(message, data={}) {
      data = {
        content:  message.content,
        userId:   message.author.id,
        username: message.author.username,
        ...data
      };

      log ({ level: 'info', module, message: 'resolve command', data });
    },
    info(message, data = {}) {
      log ({ level: 'info', module, message, data });
    },
    debug(message, data = {}) {
      log ({ level: 'debug', module, message, data });
    },
    error(message, error) {
      let data = {};

      if (error && error instanceof Error) {
        data = { reason: error.message, stack: error.stack }; 
      }

      log ({ level: 'error', module, message, data });
    }
  }
}

function traceId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 4; i++)
    id += characters.charAt (Math.floor (Math.random ()*characters.length));

  return id;
}

/**
 * Generates a trace ID that gets added to any logging inside of `callback`
 * 
 * Can be used to trace a reqeust's lifetime
 */
export function runWithContext(callback: () => void) : void {
  traceContext.run (traceId (), callback);
}