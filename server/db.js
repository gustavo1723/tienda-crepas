// server/db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'tienda.db');
const SQL_INIT = path.join(__dirname, 'tienda_full.sql');

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error al abrir DB:', err);
        return;
    }
    console.log('Conectado a tienda.db');

    // Si la DB no existía (archivo nuevo) y existe tienda_full.sql, ejecútalo
    fs.stat(DB_FILE, (errStat) => {
        // Always ensure tables exist (run the SQL script if available)
        if (fs.existsSync(SQL_INIT)) {
            const sql = fs.readFileSync(SQL_INIT, 'utf8');
            db.exec(sql, (errExec) => {
                if (errExec) {
                    // if there was an error but tables might already exist, log it
                    console.log('Nota: ejecución de tienda_full.sql terminó (puede que ya exista la estructura).', errExec && errExec.message);
                } else {
                    console.log('Estructura y datos iniciales ejecutados desde tienda_full.sql');
                }
            });
        }
    });
});

module.exports = db;
