export const sum = (a: number, b: number): number => a + b;

export const mean = (set: number[]): number =>
   (set.length > 0)
      ? set.reduce (sum, 0) / set.length
      : 0;