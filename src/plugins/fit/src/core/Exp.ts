
export type EXP = {
  readonly _tag: "EXP";
  readonly value: number;
}

export const exp = (value: number): EXP => ({
  _tag: "EXP",
  value
});