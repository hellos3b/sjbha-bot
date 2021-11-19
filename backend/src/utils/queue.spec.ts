import { queued } from './queue';

describe ('queued', () => {
  it ('runs a function', () => {
    const callback = jest.fn ();
    const queuedCallback = queued (() => callback ());
    queuedCallback ();

    expect (callback).toHaveBeenCalledTimes (1);
  });

  it ('ignored repeated calls', () => {
    const callback = jest.fn ();
    const slow = () => new Promise<void> ((resolve) => {
      callback ();
      setTimeout (resolve, 200);
    });

    const queuedSlow = queued (() => slow ());

    queuedSlow ();
    queuedSlow ();
    queuedSlow ();
    queuedSlow ();

    expect (callback).toHaveBeenCalledTimes (1);
  })
})