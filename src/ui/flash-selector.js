// Input reads the same side last painted by the frame loop. No random result or
// independent CSS timer can disagree with the multiplier the player sees.
export function createFlashSelector(paint,clock={request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id)}){
 let key=null,side='low',frame=null,last=null,period=450,running=false;
 function tick(now){
  if(!running)return;
  if(last===null)last=now;
  if(now-last>=period){side=side==='low'?'high':'low';last=now;paint(side);}
  frame=clock.request(tick);
 }
 function stop(){running=false;if(frame!==null)clock.cancel(frame);frame=null;last=null;}
 return {
  sync(nextKey,lower,enabled){
   if(nextKey!==key){stop();key=nextKey;side='low';paint(side);}
   period=Math.max(250,450-(lower-1)*25);
   if(!enabled){stop();return;}
   if(!running){running=true;frame=clock.request(tick);}
  },
  capture(){return running?side:null;},
  stop
 };
}
