/** Simple util that just resolves a promise after a certain amount of milliseconds */
export const wait = (ms: number) : Promise<void> => new Promise (resolve => setTimeout (resolve, ms));