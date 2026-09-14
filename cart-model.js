// Figma defines delivery fees; basket thresholds are demonstration values.
export const DELIVERY=Object.freeze({discountAt:500,freeAt:1000,paidFee:149,discountFee:99});
export function deliveryForSubtotal(subtotal){
  if(!Number.isInteger(subtotal)||subtotal<0)throw new RangeError('Сумма должна быть неотрицательным целым числом');
  const stage=subtotal>=DELIVERY.freeAt?'free':subtotal>=DELIVERY.discountAt?'discount':'paid';
  const fee=stage==='free'?0:stage==='discount'?DELIVERY.discountFee:DELIVERY.paidFee;
  return {stage,fee,remaining:Math.max(0,(stage==='paid'?DELIVERY.discountAt:DELIVERY.freeAt)-subtotal),first:Math.min(1,subtotal/DELIVERY.discountAt),last:Math.max(0,Math.min(1,(subtotal-DELIVERY.discountAt)/(DELIVERY.freeAt-DELIVERY.discountAt)))};
}
