/**
 * Formats variables into a string. Formerly `string-format` from NPM,
 * I got tired of errors that a value isn't a string so here we are.
 * 
 * It calls `toString()` automatically
 * 
 * ```ts
 * format("Hello {0}, welcome to {1}!")
 *        ("world", "earth")
 * // "Hello world, welcome to earth!"
 * ```
 */
export default function format(template: string) {
  return (...args: any) => {
    return template.replace(/{(\d+)}/g, (match, number) =>  
      typeof args[number] != 'undefined'
        ? args[number].toString()
        : match
    );
  }
}