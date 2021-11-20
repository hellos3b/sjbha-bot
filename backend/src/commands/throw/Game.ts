import { match } from 'ts-pattern';

export enum Hand { Rock=0, Paper=1, Scissors=2 }

export enum Result { Win=0, Tie=1, Lose=2 }

export const checkResult = (a: Hand, b: Hand) : Result => {
  const wins = (a2: Hand, b2: Hand) =>
    match ([a2, b2])
    .with ([Hand.Rock, Hand.Scissors], () => true)
    .with ([Hand.Paper, Hand.Rock], () => true)
    .with ([Hand.Scissors, Hand.Paper], () => true)
    .otherwise (() => false);

  return (wins (a, b)) ? Result.Win
    : (wins (b, a)) ? Result.Lose
    : Result.Tie;
}

export const randomHand = () : Hand => {
  const hands = [Hand.Rock, Hand.Paper, Hand.Scissors];
  const i = Math.floor (Math.random ()*3);
  return hands[i];
}

export const toString = (hand: Hand) : string => ({
  [Hand.Rock]:     'rock',
  [Hand.Paper]:    'paper',
  [Hand.Scissors]: 'scissors'
})[hand];