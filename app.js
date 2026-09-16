import {STATES, STATE_TIMES, DURATION_MS, createPlayback} from './sequence.js';
import {MOTION, TEXT_FADES} from './motion.js';

const $ = selector => document.querySelector(selector);
const button = $('#playback-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const animations = [];
let stateIndex = -1;
let autoPaused = false;

function fitDevice() {
  const scale = Math.min(1, (innerWidth - 32) / 409, (innerHeight - 92) / 868);
  document.documentElement.style.setProperty('--device-scale', Math.max(0.1, scale));
}
fitDevice();
addEventListener('resize', fitDevice, {passive:true});

// Persistent text layers crossfade at one baseline; changing labels never reflows the bar.
for (const [index, state] of STATES.entries()) {
  const caption = document.createElement('span');
  caption.className = 'caption-state';
  caption.textContent = state.caption;
  caption.style.opacity = index === 0 ? '1' : '0';
  $('.delivery-caption').append(caption);
  const count = document.createElement('span');
  count.className = 'count-state';
  count.textContent = state.count;
  count.style.opacity = index === 0 ? '1' : '0';
  $('.basket-count').append(count);
}

const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const colors = {
  ink:token('--basic-content-text-primary'),
  secondary:token('--basic-content-text-secondary'),
  green:token('--basic-content-text-success'),
  rail:token('--basic-system-pullindicator'),
  bar:token('--basic-background-bg-secondary'),
  success:token('--progress-bg-success'),
  successRail:token('--progress-track-success'),
};

function track(element, property, points) {
  const full = [...points];
  if (full.at(-1)[0] < DURATION_MS) full.push([DURATION_MS, full.at(-1)[1]]);
  const animation = element.animate(full.map(([time,value]) => ({
    offset:time / DURATION_MS,
    [property]:colors[value] ?? value,
    easing:'cubic-bezier(.4,0,.2,1)',
  })), {duration:DURATION_MS, fill:'both'});
  animation.pause();
  animation.currentTime = 0;
  animations.push(animation);
}
for (const [selector, property, points] of MOTION) track($(selector), property, points);

for (let index = 0; index < STATES.length; index++) {
  const points = [[0,index === 0 ? 1 : 0]];
  if (index > 0) {
    const [start,end] = TEXT_FADES[index-1];
    const middle = (start+end)/2;
    points.push([middle,0],[end,1]);
  }
  if (index < STATES.length-1) {
    const [start,end] = TEXT_FADES[index];
    points.push([start,1],[(start+end)/2,0]);
  }
  track($('.delivery-caption').children[index], 'opacity', points);
  track($('.basket-count').children[index], 'opacity', points);
}

const playback = createPlayback({
  render(time) {
    const index = STATE_TIMES.findLastIndex(at => time >= at);
    const visualTime = reducedMotion.matches ? STATE_TIMES[index] : time;
    for (const animation of animations) animation.currentTime = visualTime;
    $('.delivery').dataset.elapsed = Math.round(time);
    if (index !== stateIndex) {
      stateIndex = index;
      const state = STATES[index];
      $('.device').dataset.nodeId = state.nodeId;
      $('#delivery-status').textContent = (state.fee ? 'Доставка '+state.fee+' ₽. ' : 'Бесплатная доставка. ')+state.caption;
    }
  },
  onStatus(status) {
    button.textContent = status === 'running' ? 'Пауза' : status === 'finished' ? 'Повторить' : 'Продолжить';
    button.setAttribute('aria-pressed', String(status === 'paused'));
    $('.delivery').dataset.playback = status;
  },
});

button.addEventListener('click', () => {
  autoPaused = false;
  if (playback.status === 'running') playback.pause();
  else if (playback.status === 'finished') playback.restart();
  else playback.play();
});

// Keep the prototype on the exact same frame when the user leaves the tab.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && playback.status === 'running') {
    autoPaused = true;
    playback.pause();
  } else if (!document.hidden && autoPaused) {
    autoPaused = false;
    playback.play();
  }
});
addEventListener('pagehide', () => playback.pause());

// Do not start (or show fallback glyphs) before both original YS Text faces are ready.
await Promise.all([
  document.fonts.load('400 13px "YS Text"'),
  document.fonts.load('500 13px "YS Text"'),
]);
button.disabled = false;
if (document.hidden) autoPaused = true;
else playback.play();
