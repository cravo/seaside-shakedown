export function randomInt(n, fill = a=>crypto.getRandomValues(a)) {
  if (!Number.isInteger(n) || n<1 || n>2**32) throw new RangeError('Invalid random range');
  const limit = Math.floor(2**32/n)*n, buf = new Uint32Array(1);
  do { fill(buf); } while(buf[0]>=limit);
  return buf[0]%n;
}
export function shuffle(values, rng=randomInt) {
  const a=[...values]; for(let i=a.length-1;i>0;i--){const j=rng(i+1);[a[i],a[j]]=[a[j],a[i]];} return a;
}
export function seeded(seed=12345) { return n=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return Math.floor(((t^t>>>14)>>>0)/4294967296*n);}; }

