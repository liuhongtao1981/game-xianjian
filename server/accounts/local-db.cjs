/* D1-compatible SQLite adapter for isolated integration tests and local preview. */
const {DatabaseSync}=require('node:sqlite');
function openDatabase(filename=':memory:'){
  const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA foreign_keys=ON');
  function prepare(sql){let values=[];return {bind(...next){values=next;return this;},first(){return sqlite.prepare(sql).get(...values)||null;},all(){return {results:sqlite.prepare(sql).all(...values),success:true};},run(){const result=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(result.changes)}};}};}
  return {prepare,batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(statement=>statement.run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}},exec:sql=>sqlite.exec(sql),close:()=>sqlite.close()};
}
module.exports={openDatabase};
