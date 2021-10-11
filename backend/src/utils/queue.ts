
type Task = () => Promise<void>;

/**
 * HOF that makes sure that a specific promise is debounced to only run one at a time
 * 
 * If you have an async function that works with the DB & discord,
 * and it listens to events that can be fired off
 * you want to make sure the function isn't running twice simultaneously
 * so wrap it with this function to protect that
 * 
 * @param fn 
 * @returns 
 */
export function queued (fn: Task) : () => void {
  let current : Promise<void> | null = null;
  let pending = false;

  const run = async () => {
    if (current && !pending) {
      pending = true;
    }
    else if (!current) {
      current = fn ();
      await current;
      current = null;

      if (pending) {
        pending = false;
        await run ();
      }
    }
  }

  return run;
}