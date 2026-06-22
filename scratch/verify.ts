import Database from 'better-sqlite3';

const db = new Database('stocklens.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
console.log('Tables:', tables);

if (tables.some(t => t.name === 'stock_metadata')) {
  const count = db.prepare('SELECT count(*) as count FROM stock_metadata').get() as any;
  console.log('stock_metadata count:', count.count);
  const sample = db.prepare('SELECT * FROM stock_metadata LIMIT 5').all();
  console.log('Sample rows:', sample);
} else {
    for (const t of tables) {
        if (t.name.includes('stock') || t.name.includes('comp')) {
            console.log(`Checking table ${t.name}...`);
            const count = db.prepare(`SELECT count(*) as count FROM ${t.name}`).get() as any;
            console.log(`${t.name} count:`, count.count);
            const sample = db.prepare(`SELECT * FROM ${t.name} LIMIT 5`).all();
            console.log(`Sample ${t.name}:`, sample);
        }
    }
}
