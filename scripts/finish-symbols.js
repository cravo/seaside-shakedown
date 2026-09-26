// Reproducible upgrade of the original hand-drawn SVG reel artwork.
import fs from 'node:fs';
for(const s of ['C','L','I','F','G','B','S']){
 const p='public/art/'+s+'.svg';let svg=fs.readFileSync(p,'utf8');
 if(svg.includes('<defs>'))continue;
 svg=svg.replaceAll('#213f43','#28152d');
 const colors=[...new Set([...svg.matchAll(/fill="(#[a-f0-9]{6})"/g)].map(m=>m[1]))];
 let defs='';
 for(let i=0;i<colors.length;i++){
  const c=colors[i];defs+='<radialGradient id="g'+i+'" cx="32%" cy="24%" r="83%"><stop stop-color="#fff8d4"/><stop offset=".3" stop-color="'+c+'"/><stop offset=".72" stop-color="'+c+'"/><stop offset="1" stop-color="#5b183f"/></radialGradient>';
  svg=svg.replaceAll('fill="'+c+'"','fill="url(#g'+i+')"');
 }
 svg=svg.replace('viewBox="0 0 120 120">','viewBox="0 0 120 120"><defs>'+defs+'</defs>');fs.writeFileSync(p,svg);
}
