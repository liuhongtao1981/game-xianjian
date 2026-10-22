const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
require('../prototype/account-model');
const {openDatabase}=require('../server/accounts/local-db.cjs');
async function createAccountTestServer({database=':memory:'}={}){
  const root=path.resolve(__dirname,'../prototype'),DB=openDatabase(database),worker=(await import('../server/accounts/worker.mjs')).default;
  if(database===':memory:')DB.exec(fs.readFileSync(path.join(__dirname,'../server/accounts/migrations/0000_accounts.sql'),'utf8'));
  const server=http.createServer(async(q,r)=>{
    try{
      if(q.url.startsWith('/api/')||q.url==='/health'){
        const chunks=[];let length=0;for await(const chunk of q){length+=chunk.length;if(length>1600000){r.writeHead(413).end();return;}chunks.push(chunk);}
        const headers=new Headers(q.headers);headers.set('CF-Connecting-IP',q.socket.remoteAddress||'local');
        const response=await worker.fetch(new Request('http://127.0.0.1'+q.url,{method:q.method,headers,body:['GET','HEAD'].includes(q.method)?undefined:Buffer.concat(chunks)}),{DB});r.writeHead(response.status,Object.fromEntries(response.headers));r.end(Buffer.from(await response.arrayBuffer()));return;
      }
      const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0])),p=file===root?path.join(root,'index.html'):file;if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}
      fs.readFile(p,(error,content)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(error?404:200);r.end(error?'missing':content);});
    }catch(error){r.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:error.message}));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {url:'http://127.0.0.1:'+server.address().port,DB,close:()=>new Promise(resolve=>server.close(()=>{DB.close();resolve();}))};
}
module.exports={createAccountTestServer};
