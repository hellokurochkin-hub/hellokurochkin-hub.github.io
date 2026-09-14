import {DELIVERY,deliveryForSubtotal} from './cart-model.js';
const $=selector=>document.querySelector(selector);
const money=value=>new Intl.NumberFormat('ru-RU').format(Math.round(value))+' ₽';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const MAX_AMOUNT=2000,STEP=100;
let amount=0,visualAmount=0,numberFrame=0,motionTimers=[],demoController=null;
function fitDevice(){const mobile=innerWidth<=760;document.documentElement.style.setProperty('--device-scale',Math.min(1,(innerWidth-24)/409,mobile?1:Math.max(.4,(innerHeight-48)/868)));}
fitDevice();addEventListener('resize',fitDevice,{passive:true});
const bar=$('.delivery-bar');
function later(action,ms){motionTimers.push(setTimeout(action,reduced.matches?0:ms));}
function readState(){return {amount,count:amount/STEP,...deliveryForSubtotal(amount)};}
function animateNumber(){cancelAnimationFrame(numberFrame);const start=visualAmount,target=amount,began=performance.now(),duration=reduced.matches?0:500;const frame=now=>{const p=duration?Math.min(1,(now-began)/duration):1;visualAmount=start+(target-start)*(1-Math.pow(1-p,3));$('#summary-sum').textContent=money(visualAmount);if(p<1)numberFrame=requestAnimationFrame(frame);};numberFrame=requestAnimationFrame(frame);}
function render(message){
  const state=readState();motionTimers.forEach(clearTimeout);motionTimers=[];
  const oldPhase=bar.dataset.phase;
  if(state.stage==='free'){
    if(oldPhase!=='free'){bar.dataset.phase='complete';later(()=>{bar.dataset.phase='free';},oldPhase==='complete'?400:720);}
  }else{bar.dataset.phase=state.stage;}
  $('.first-fill').style.transform=`scaleX(${state.first})`;
  $('.last-fill').style.transform=`scaleX(${state.last})`;
  $('.delivery-caption').textContent=state.stage==='free'?'Привезём от 15 мин':`Ещё ${money(state.remaining)} и ${state.stage==='paid'?'доставка дешевле':'будет бесплатно'}`;
  $('#delivery-progress').setAttribute('aria-valuenow',Math.min(amount,DELIVERY.freeAt));
  $('#delivery-progress').setAttribute('aria-valuetext',`В корзине ${money(amount)}. Доставка ${state.fee?money(state.fee):'бесплатная'}.`);
  $('#summary-delivery').textContent=state.fee?money(state.fee):'Бесплатно';$('#summary-delivery').style.color=state.fee?'':'var(--green)';
  $('#basket-amount').value=amount;$('#basket-amount').setAttribute('aria-valuetext',money(amount));
  $('.basket-count').hidden=amount===0;$('.basket-count').textContent=state.count;
  $('#remove').disabled=amount===0;$('#add').disabled=amount===MAX_AMOUNT;
  animateNumber();if(message)$('#activity').textContent=message;return state;
}
function stopDemo(){if(demoController){demoController.abort();demoController=null;}$('#demo').textContent='Показать анимацию';}
function setAmount(value,{demo=false}={}){if(!Number.isInteger(value)||value<0||value>MAX_AMOUNT||value%STEP!==0)throw new RangeError('Сумма от 0 до 2000 ₽ с шагом 100 ₽');if(!demo)stopDemo();amount=value;const state=render();$('#activity').textContent=state.stage==='free'?'Бесплатная доставка. Уменьшите сумму для обратной анимации.':state.stage==='discount'?'Доставка стала дешевле — 99 ₽.':'Добавляйте товары — доставка станет дешевле.';return state;}
$('#basket-amount').addEventListener('input',event=>setAmount(Number(event.target.value)));
$('#add').addEventListener('click',()=>setAmount(Math.min(MAX_AMOUNT,amount+STEP)));
$('#remove').addEventListener('click',()=>setAmount(Math.max(0,amount-STEP)));
$('#reset').addEventListener('click',()=>setAmount(0));
function pause(ms,signal){return new Promise((resolve,reject)=>{if(signal.aborted)return reject(new DOMException('Stopped','AbortError'));const done=()=>{signal.removeEventListener('abort',abort);resolve();};const timer=setTimeout(done,ms);const abort=()=>{clearTimeout(timer);reject(new DOMException('Stopped','AbortError'));};signal.addEventListener('abort',abort,{once:true});});}
$('#demo').addEventListener('click',async()=>{if(demoController){stopDemo();return;}setAmount(0);const controller=new AbortController();demoController=controller;$('#demo').textContent='Остановить анимацию';try{for(const target of [200,400,600,800,1000]){await pause(1200,controller.signal);setAmount(target,{demo:true});}await pause(1500,controller.signal);}catch(error){if(error.name!=='AbortError')throw error;}finally{if(demoController===controller)stopDemo();}});
addEventListener('keydown',event=>{if(event.key==='Escape')stopDemo();});
render();
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[{name:'get_delivery_state',title:'Прогресс доставки',description:'Читает сумму демонстрационной корзины и состояние анимации доставки.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:readState},
    {name:'set_basket_amount',title:'Изменить сумму корзины',description:'Меняет сумму в локальном прототипе и проигрывает переход доставки. Реальный заказ не создаётся.',inputSchema:{type:'object',properties:{amount:{type:'integer',minimum:0,maximum:2000,multipleOf:100}},required:['amount'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(key=>key!=='amount'))throw new TypeError('Ожидается amount');setAmount(input.amount);await new Promise(resolve=>setTimeout(resolve,reduced.matches?0:1450));return readState();}}];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
