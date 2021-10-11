export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret: any = {};
  keys.forEach (key => {
    ret[key] = obj[key];
  })
  return ret;
}
