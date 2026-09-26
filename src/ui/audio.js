let context;
export function sound(kind,enabled=true) {
 if(!enabled)return;
 try{
  context??=new (window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});
  const notes={click:[280],stop:[120],nudge:[380],letter:[740],win:[523,659,784],jackpot:[523,659,784,1047,784,1047],gull:[880,660,990],chips:[659,880]};
  (notes[kind]||notes.click).forEach((f,i)=>{const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.09;o.type=kind==='stop'?'triangle':'sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.8,t+.1);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g).connect(context.destination);o.start(t);o.stop(t+.17);});
 }catch{}
}
