export const STATE_DELAY_MS = 3000;

// Values and ordering from the five user-selected Figma frames.
export const STATES = Object.freeze([
  {nodeId: '14112:126206', fee: 499, nextFee: 299, count: 2, caption: 'Ещё 621  ₽ и доставка дешевле '},
  {nodeId: '14112:126634', fee: 299, nextFee: 99, count: 3, caption: 'Ещё 257  ₽ и доставка дешевле '},
  {nodeId: '14129:31977', fee: 99, nextFee: 0, count: 4, caption: 'Ещё 500 ₽ и будет бесплатно'},
  {nodeId: '14112:127002', fee: 99, nextFee: 0, count: 5, caption: 'Ещё 132 ₽ и будет бесплатно'},
  {nodeId: '14112:127381', fee: 0, nextFee: 0, count: 6, caption: 'Привезём от 15 мин'},
].map(Object.freeze));

export function playSequence(render, clock = globalThis) {
  let index = 0;
  let timer;
  function next() {
    render(STATES[index], index);
    if (++index < STATES.length) timer = clock.setTimeout(next, STATE_DELAY_MS);
  }
  next();
  return () => clock.clearTimeout(timer);
}
