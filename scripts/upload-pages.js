// Upload built static assets with a short-lived, project-scoped Pages upload JWT.
// The token arrives through stdin, never a command argument or file.
import {readFileSync,readdirSync,statSync,writeFileSync,mkdirSync} from 'node:fs';
import {extname,join,relative} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {hash}=wranglerRequire('blake3-wasm');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.resume();
console.log('Ready for project upload token (input is not echoed).');
let input='';
process.stdin.on('data',async chunk=>{
 input+=chunk.toString();if(!/[\r\n]/.test(input)&&!input.trim().endsWith('}'))return;
 process.stdin.pause();
 try{
  const token=JSON.parse(input.trim()).jwt;input='';
  if(!token)throw Error('Missing upload token');
  const files=[];function walk(dir){for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())walk(p);else files.push(p);}}walk('dist');
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript','.svg':'image/svg+xml','.txt':'text/plain'};
  const manifest={},assets=files.filter(p=>!['_headers','_redirects'].includes(p.split(/[\\/]/).pop())).map(p=>{const extension=extname(p).slice(1),value=readFileSync(p).toString('base64'),key=hash(value+extension).toString('hex').slice(0,32);manifest['/'+relative('dist',p).replaceAll('\\','/')]=key;return {key,value,metadata:{contentType:mime[extname(p)]||'application/octet-stream'},base64:true};});
  const response=await fetch('https://api.cloudflare.com/client/v4/pages/assets/upload',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(assets)});
  const result=await response.json();if(!result.success)throw Error('Pages asset upload failed: '+JSON.stringify(result.errors));
  mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/pages-manifest.json',JSON.stringify(manifest));
  console.log('Uploaded '+assets.length+' assets. Manifest saved.');
  process.exit(0);
 }catch(e){console.error(e.message);process.exit(1);}
});
