import assert from "assert";

export const ignore = (): void => { /** noop */ };

export const id = <A>(a: A): A => a;

export const just = <A>(a: A): () => A => () => a;

export const tap = <A>(f: (a: A) => void): (a: A) => A => a => {
   f (a);
   return a;
};

export function assertDefined<a>(value: a | null | undefined, message: string): asserts value is a {
   assert (value !== null && value !== undefined, message);
}

export const sum = (a: number, b: number): number => a + b;

export const mean = (set: number[]): number =>
   (set.length > 0)
      ? set.reduce (sum, 0) / set.length
      : 0;