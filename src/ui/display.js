// Seven-segment glass display. Keep the real text available to assistive technology.
const digits={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg','—':'g','-':'g'};
const segments={a:'4,1 14,1 16,3 14,5 4,5 2,3',b:'15,5 17,3 17,13 15,15 13,13 13,7',c:'15,16 17,18 17,28 15,30 13,28 13,18',d:'4,28 12,28 14,30 12,32 2,32 0,30',e:'2,16 4,18 4,26 2,28 0,26 0,18',f:'3,4 5,6 5,13 3,15 1,13 1,6',g:'5,14 12,14 14,16 12,18 4,18 2,16'};
export function setDisplay(element,value){
 const text=String(value);if(element.dataset.display===text)return;
 element.dataset.display=text;element.textContent=text;element.classList.add('led-display');
 let offset=0;
 const glass=[...text].map(char=>{const x=offset;offset+=char==='.'?6:21;return char==='.'?'<circle cx="'+(x+1)+'" cy="30" r="2" fill="#ff2744"/>':'<g transform="translate('+x+' 0)">'+Object.entries(segments).map(([key,points])=>'<polygon points="'+points+'" fill="'+(digits[char]?.includes(key)?'#ff2744':'#35101d')+'"/>').join('')+'</g>';}).join('');
 element.style.backgroundImage='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+offset+' 34">'+glass+'</svg>')+'")';
}
