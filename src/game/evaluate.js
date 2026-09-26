import {PAYOUTS,symbolsAt} from './config.js';
export function evaluate(indices) {
 const [a,b,c]=symbolsAt(indices);
 const multiplier=a===b&&b===c?PAYOUTS[a]:a==='C'?(b==='C'?2:.5):0;
 return {multiplier,bonus:a==='G'&&b==='G'&&c==='G',symbols:[a,b,c]};
}

