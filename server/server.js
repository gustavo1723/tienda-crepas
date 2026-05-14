// server/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

// Configuración de CORS para producción
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// ========== CONFIGURACIÓN DE SESIONES ==========
app.use(session({
    secret: 'crepas2026_secret_key_para_produccion',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000, // 1 hora
        httpOnly: true,
        secure: false // Cambiar a true si usas HTTPS
    }
}));

// Crear carpeta de imágenes si no existe
const imagenesDir = path.join(__dirname, 'imagenes');
if (!fs.existsSync(imagenesDir)) {
    fs.mkdirSync(imagenesDir);
    console.log('Carpeta "imagenes" creada');
}

// Configurar multer para guardar imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagenesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo imágenes: JPG, PNG, GIF, WEBP'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Servir archivos estáticos (imágenes)
app.use('/imagenes', express.static(imagenesDir));

// Servir archivos del cliente (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../client')));

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ========== MIDDLEWARE DE AUTENTICACIÓN ==========
function requireAuth(req, res, next) {
    if (!req.session.usuarioId) {
        return res.status(401).json({ error: 'No autorizado. Inicia sesión primero.' });
    }
    next();
}

// ========== ENDPOINTS DE AUTENTICACIÓN ==========
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;
    
    if (!usuario || !password) {
        return res.json({ success: false, error: 'Usuario y contraseña requeridos' });
    }
    
    // Buscar usuario en BD
    db.get('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, user) => {
        if (err) {
            return res.json({ success: false, error: 'Error en el servidor' });
        }
        if (!user) {
            return res.json({ success: false, error: 'Usuario no encontrado' });
        }
        
        // Comparar contraseña con bcrypt
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.json({ success: false, error: 'Contraseña incorrecta' });
        }
        
        req.session.usuarioId = user.id;
        req.session.usuario = user.usuario;
        res.json({ success: true, usuario: user.usuario });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/verificar-sesion', (req, res) => {
    if (req.session.usuarioId) {
        res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
        res.json({ autenticado: false });
    }
});

// ========== RUTAS PRODUCTOS (PÚBLICAS) ==========
app.get('/api/productos', (req, res) => {
    db.all('SELECT id, nombre, descripcion, precio, imagen FROM Producto ORDER BY id', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/producto/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM Producto WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(row);
    });
});

// ========== RUTAS ADMIN (PROTEGIDAS) ==========
app.post('/api/admin/producto/nuevo', requireAuth, upload.single('imagen'), (req, res) => {
    const { nombre, descripcion = '', precio } = req.body;
    
    // Validaciones mejoradas
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (nombre.length > 100) {
        return res.status(400).json({ error: 'El nombre es demasiado largo (máx 100 caracteres)' });
    }
    if (!precio || isNaN(precio) || precio <= 0 || precio > 999999) {
        return res.status(400).json({ error: 'El precio debe ser un número positivo y válido' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'Debes seleccionar una imagen' });
    }

    const imagen = req.file.filename;

    db.run('INSERT INTO Producto (nombre, descripcion, precio, imagen) VALUES (?, ?, ?, ?)',
        [nombre.trim(), descripcion.trim() || '', parseFloat(precio), imagen],
        function(err) {
            if (err) {
                if (req.file) {
                    fs.unlinkSync(path.join(imagenesDir, req.file.filename));
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                id: this.lastID, 
                message: 'Producto creado con imagen',
                imagen: imagen 
            });
        });
});

app.put('/api/admin/producto/editar/:id', requireAuth, upload.single('imagen'), (req, res) => {
    const id = req.params.id;
    const { nombre, descripcion = '', precio, imagenActual } = req.body;
    
    // Validaciones mejoradas
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (nombre.length > 100) {
        return res.status(400).json({ error: 'El nombre es demasiado largo (máx 100 caracteres)' });
    }
    if (!precio || isNaN(precio) || precio <= 0 || precio > 999999) {
        return res.status(400).json({ error: 'El precio debe ser un número positivo y válido' });
    }
    
    db.get('SELECT imagen FROM Producto WHERE id = ?', [id], (err, producto) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        let imagen = imagenActual || '';
        
        if (req.file) {
            imagen = req.file.filename;
            if (producto.imagen && producto.imagen !== imagenActual) {
                const oldImagePath = path.join(imagenesDir, producto.imagen);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        db.run('UPDATE Producto SET nombre = ?, descripcion = ?, precio = ?, imagen = ? WHERE id = ?',
            [nombre.trim(), descripcion.trim() || '', parseFloat(precio), imagen, id],
            function(err) {
                if (err) {
                    if (req.file) {
                        fs.unlinkSync(path.join(imagenesDir, req.file.filename));
                    }
                    return res.status(500).json({ error: err.message });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Producto no encontrado' });
                }
                res.json({ message: 'Producto actualizado', imagen: imagen });
            }
        );
    });
});

app.delete('/api/admin/producto/eliminar/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    
    db.get('SELECT imagen FROM Producto WHERE id = ?', [id], (err, producto) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run('DELETE FROM Producto WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
            
            if (producto && producto.imagen) {
                const imagePath = path.join(imagenesDir, producto.imagen);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            
            res.json({ message: 'Producto eliminado' });
        });
    });
});

// ========== RUTAS PEDIDO ==========
app.post('/api/pedido/finalizar', (req, res) => {
    const { items, total } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Pedido vacío' });
    }

    const fechaBonita = new Date()
        .toLocaleString('es-MX', { hour12: false })
        .replace(',', '');

    const obtenerNombres = items.map(it => {
        return new Promise(resolve => {
            db.get("SELECT nombre FROM Producto WHERE id = ?", [it.productoId], (err, row) => {
                if (err || !row) return resolve(`${it.cantidad}x ???`);
                resolve(`${it.cantidad}x ${row.nombre}`);
            });
        });
    });

    Promise.all(obtenerNombres).then(lista => {
        const detalle = lista.join(", ");

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.run(
                'INSERT INTO Pedido (fecha, total, numero_pedido, detalle) VALUES (?, ?, ?, ?)',
                [fechaBonita, total, '', detalle],
                function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    const pedidoId = this.lastID;
                    const numeroPedido = 'PED' + String(pedidoId).padStart(6, '0');

                    db.run(
                        'UPDATE Pedido SET numero_pedido = ? WHERE id = ?',
                        [numeroPedido, pedidoId],
                        function (err2) {
                            if (err2) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: err2.message });
                            }

                            const stmt = db.prepare(
                                'INSERT INTO PedidoItem (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)'
                            );

                            for (const it of items) {
                                db.get(
                                    'SELECT precio FROM Producto WHERE id = ?',
                                    [it.productoId],
                                    (errP, rowP) => {
                                        if (errP || !rowP) {
                                            stmt.finalize();
                                            db.run('ROLLBACK');
                                            return res
                                                .status(400)
                                                .json({ error: 'Producto no encontrado' });
                                        }
                                        stmt.run(pedidoId, it.productoId, it.cantidad, rowP.precio);
                                    }
                                );
                            }

                            setTimeout(() => {
                                stmt.finalize(errF => {
                                    if (errF) {
                                        db.run('ROLLBACK');
                                        return res.status(500).json({ error: errF.message });
                                    }

                                    db.run('COMMIT', errC => {
                                        if (errC)
                                            return res.status(500).json({ error: errC.message });

                                        res.json({ pedidoId, numeroPedido });
                                    });
                                });
                            }, 150);
                        }
                    );
                }
            );
        });
    });
});

app.get('/api/admin/pedidos', requireAuth, (req, res) => {
    db.all('SELECT * FROM Pedido ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/admin/pedido/:id/items', requireAuth, (req, res) => {
    const id = req.params.id;
    db.all(`SELECT pi.id, pi.cantidad, pi.precio_unitario, p.nombre
            FROM PedidoItem pi JOIN Producto p ON pi.producto_id = p.id
            WHERE pi.pedido_id = ?`, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Manejo de errores de multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));