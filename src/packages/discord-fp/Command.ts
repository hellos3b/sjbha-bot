import {Message, isChannel, isDirect} from "./Message";
import * as RX from "rxjs/operators";
import logger from "@packages/logger";

const log = logger("Command");

/**
 * Checks that the message starts with `t`
 */
export const trigger = (t: string) => RX.filter(<T extends Message>(msg: T) => msg.content.startsWith(t));

/**
 * When a message is sent and has no parameters or extra notation
 *
 * "!ping" is lonely
 * "!ping seb" is not lonely
 */
export const lonely = RX.filter(<T extends Message>(msg: T) => msg.content.split(" ").length === 1);

/**
 * Restricts a command to a set of channels. If used outside of the channel ids,
 * will ignore it
 */
export const restrict = (...channels: string[]) => RX.filter(<T extends Message>(msg: T) => channels.includes(msg.channel.id));

/**
 * Command that only works in direct messages
 */
export const direct = RX.filter(isDirect);

/**
 * Command that only works in servers.
 * Note: This is handy as well for type guarding a message to include the `member` option for roles, nickname, etc
 */
export const channel = RX.filter(isChannel);

// export const commander = (stream: Observable<Message>) => (instigator: string) => {
//   const command$ = stream.pipe(
//     filter(msg =>
//       msg.content
//         .toLowerCase()
//         .startsWith(instigator)
//     ),
//     share()
//   )

//   command$.subscribe(msg => log.debug({content: msg.content}, "Incoming command"));

//   return (routeName: string) => {
//     const r = command$.pipe(filter<Message>(
//       req => pipe(
//         req.args.nth(0),
//         O.map(R.equals(instigator + routeName)),
//         O.getOrElse(R.F)
//       )
//     ));

//     return Command(r);
//   }
// }

// export type Command = ReturnType<typeof Command>;
// export const Command = <T extends Message>(stream: Observable<T>) => {
//   return {
//     stream, 
    
//     subscribe: (callback: (req: T) => void) => 
//       stream.subscribe(callback),

//     /** 
//      * Restricts this command to a set of channels 
//      */
//     restrict: (...channelIds: string[]) => {
//       const s = stream.pipe(filter(req => channelIds.includes(req.channel.id)));
//       return Command(s);
//     },

//     /** 
//      * Create a subcommand based on the 2nd arg of the command 
//      * 
//      * `!{command} {subcommand}`
//      * ex. with `!ping seb` "seb" would be the subcommand
//      */
//     subcommand: (name: string) => {
//       const s = stream.pipe(
//         filter(msg => pipe(
//           msg.args.nth(1),
//           O.map(R.equals(name)),
//           O.getOrElse(R.F)
//         )
//       ));

//       return Command(s);
//     },
    
//     /** 
//      * Only respond to DMs 
//      */
//     dm: () => {
//       return Command(stream.pipe(filter(isDirect)));
//     },

//     /** 
//      * Only respond to public server 
//      */
//     public: () => {
//       return Command(stream.pipe(filter(isServer)));
//     },

//     /** 
//      * When the command was ran with nothing but the base command 
//      */
//     alone: () => {
//       const s = stream.pipe(filter(msg => msg.args.length === 1));

//       return Command(s);
//     }
//   };
// };