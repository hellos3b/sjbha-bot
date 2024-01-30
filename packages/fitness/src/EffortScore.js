export const effortScore = (xp, score = 1) => {
   const needs = score * 5;
   return xp > needs ? effortScore(xp - needs, score + 1) : score + xp / needs;
};
