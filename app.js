import {STATES, playSequence} from './sequence.js';

const $ = selector => document.querySelector(selector);
const bar = $('.delivery-bar');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let finishTimer;

function fitDevice() {
  const scale = Math.min(1, (innerWidth - 32) / 409, (innerHeight - 32) / 868);
  document.documentElement.style.setProperty('--device-scale', Math.max(0.1, scale));
}
fitDevice();
addEventListener('resize', fitDevice, {passive: true});

function replaceText(element, text) {
  if (element.textContent === text) return;
  element.textContent = text;
  if (!reducedMotion.matches) {
    element.animate(
      [{opacity: 0, transform: 'translateY(4px)'}, {opacity: 1, transform: 'translateY(0)'}],
      {duration: 350, easing: 'cubic-bezier(.22,1,.36,1)'}
    );
  }
}

function render(state, index) {
  clearTimeout(finishTimer);
  $('.device').dataset.nodeId = state.nodeId;
  bar.dataset.stage = index;
  replaceText($('.basket-count'), String(state.count));
  $('#delivery-status').textContent = (state.fee ? 'Доставка ' + state.fee + ' ₽. ' : 'Бесплатная доставка. ') + state.caption;

  if (state.fee === 0) {
    // Finish the thermometer before it folds into the final Figma badge.
    bar.dataset.phase = 'complete';
    const finish = () => {
      bar.dataset.phase = 'free';
      replaceText($('.delivery-caption'), state.caption);
    };
    if (reducedMotion.matches) finish();
    else finishTimer = setTimeout(finish, 650);
    return;
  }

  bar.dataset.phase = 'paid';
  replaceText($('.current-price .price-value'), String(state.fee));
  replaceText($('.next-price .price-value'), String(state.nextFee));
  replaceText($('.delivery-caption'), state.caption);
}

render(STATES[0], 0);
// Start the three-second hold after the original fonts and first frame are ready.
await document.fonts.ready;
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
let stop = playSequence(render);
addEventListener('pagehide', () => { stop(); clearTimeout(finishTimer); });
addEventListener('pageshow', event => {
  if (event.persisted) stop = playSequence(render);
});
