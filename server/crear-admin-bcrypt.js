const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'tienda.db'));

async function crearAdmin() {
    // Eliminar cualquier admin existente
    db.run("DELETE FROM usuarios WHERE usuario = 'admin'");
    
    // Generar una nueva contraseña encriptada para 'admin123'
    const passwordPlano = 'admin123';
    const hash = await bcrypt.hash(passwordPlano, 10);
    
    console.log('📝 Contraseña encriptada generada:', hash);
    console.log('');
    
    // Insertar el nuevo admin
    db.run(`INSERT INTO usuarios (usuario, password) VALUES (?, ?)`,
        ['admin', hash],
        function(err) {
            if (err) {
                console.log('❌ Error:', err.message);
            } else {
                console.log('✅ USUARIO ADMIN CREADO CORRECTAMENTE');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('   Usuario:   admin');
                console.log('   Contraseña: admin123');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
            
            // Verificar
            db.get("SELECT id, usuario, password FROM usuarios WHERE usuario = 'admin'", (err, row) => {
                if (row) {
                    console.log('\n✅ Verificado: Usuario admin existe (ID: ' + row.id + ')');
                }
                db.close();
            });
        });
}

crearAdmin();