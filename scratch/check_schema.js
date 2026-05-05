const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/edoc.sqlite');

db.all("SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('registrar', 'doctor', 'lab_technician', 'pharmacist')", (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    rows.forEach(row => {
        console.log(`Table: ${row.name}\nSQL: ${row.sql}\n`);
    });
    db.close();
});
