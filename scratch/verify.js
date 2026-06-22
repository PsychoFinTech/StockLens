const db = require('better-sqlite3')('stocklens.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

if (tables.some(t => t.name === 'stock_metadata')) {
  const count = db.prepare('SELECT count(*) as count FROM stock_metadata').get();
  console.log('stock_metadata count:', count.count);
  const sample = db.prepare('SELECT * FROM stock_metadata LIMIT 5').all();
  console.log('Sample rows:', sample);
}
