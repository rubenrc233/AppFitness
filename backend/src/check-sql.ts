import * as fs from 'fs';
import * as path from 'path';

const sqlFile = path.join(__dirname, '..', 'create_progress_tables.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('Total statements:', statements.length);
console.log('\nStatements found:');
statements.forEach((s, i) => {
  console.log(`\n${i + 1}. ${s.substring(0, 80)}...`);
  console.log(`   Type: ${s.includes('CREATE TABLE') ? 'CREATE TABLE' : s.includes('CREATE INDEX') ? 'CREATE INDEX' : 'OTHER'}`);
});
