export const STATE_DELAY_MS = 3000;
export const DURATION_MS = 19600;
export const STATE_TIMES = Object.freeze([0, 4800, 9600, 14200, DURATION_MS]);
export const STATES = Object.freeze([
  {nodeId:'14112:126206',fee:499,count:2,caption:'Ещё 621  ₽ и доставка дешевле '},
  {nodeId:'14112:126634',fee:299,count:3,caption:'Ещё 257  ₽ и доставка дешевле '},
  {nodeId:'14129:31977',fee:99,count:4,caption:'Ещё 500 ₽ и будет бесплатно'},
  {nodeId:'14112:127002',fee:99,count:5,caption:'Ещё 132 ₽ и будет бесплатно'},
  {nodeId:'14112:127381',fee:0,count:6,caption:'Привезём от 15 мин'},
].map(Object.freeze));

// One clock drives every visual property, text crossfade, and three-second hold.
export function createPlayback({render, onStatus = () => {}, duration = DURATION_MS, clock = {
  now: () => performance.now(),
  request: callback => requestAnimationFrame(callback),
  cancel: id => cancelAnimationFrame(id),
}}) {
  let time = 0, last = 0, frame = null, status = 'paused';
  const publish = next => {status = next; onStatus(status);};
  function sample(now) {
    time = Math.min(duration, time + Math.max(0, now - last));
    last = now;
    render(time);
  }
  function tick(now) {
    frame = null;
    if (status !== 'running') return;
    sample(now);
    if (time === duration) publish('finished');
    else frame = clock.request(tick);
  }
  const controller = {
    get time() {return time;},
    get status() {return status;},
    play() {
      if (status === 'running' || status === 'finished') return;
      last = clock.now();
      publish('running');
      frame = clock.request(tick);
    },
    pause() {
      if (status !== 'running') return;
      clock.cancel(frame);
      frame = null;
      sample(clock.now());
      publish(time === duration ? 'finished' : 'paused');
    },
    restart() {
      if (frame !== null) clock.cancel(frame);
      frame = null; time = 0;
      render(time);
      publish('paused');
      controller.play();
    },
    dispose() {
      if (frame !== null) clock.cancel(frame);
      frame = null;
      publish('paused');
    },
  };
  render(0);
  return controller;
}
