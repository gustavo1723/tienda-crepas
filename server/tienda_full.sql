-- tienda_full.sql
-- Crea las tablas Producto, Pedido, PedidoItem e inserta productos de ejemplo.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS PedidoItem;
DROP TABLE IF EXISTS Pedido;
DROP TABLE IF EXISTS Producto;

CREATE TABLE Producto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    imagen TEXT
);

CREATE TABLE Pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,        -- Fecha y hora juntas
    total REAL NOT NULL,
    numero_pedido TEXT UNIQUE,
    detalle TEXT                -- Lista bonita de productos
);

CREATE TABLE PedidoItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES Pedido(id),
    FOREIGN KEY (producto_id) REFERENCES Producto(id)
);


-- Inserciones de productos 
INSERT INTO Producto (nombre, descripcion, precio, imagen) VALUES
('Nutella', 'La clásica que nunca falla, pura Nutella.', 60, 'nutella.jpg'),
('Mermelada', 'A elegir entre fresa o zarzamora: sencilla frutal y honesta.', 60, 'mermelada.jpg'),
('Cajeta', 'De las que saben a casa, con el sello de Cajeta Coronado.', 60, 'cajeta.jpg'),
('Nutella Fresa', 'Nutella con fresa natural, la combinación más romántica.', 82, 'nutella_fresa.jpg'),
('Mermelada Philadelphia', 'Clásico estilo pan tostado.', 72, 'mermelada_philadelphia.jpg'),
('Cajeta Nuez', 'Dulce y crujiente, puro apapacho con actitud.', 72, 'cajeta_nuez.jpg'),
('Ferrero', 'Philadelphia, Ferrero Rocher, cacahuate y Nutella.', 115, 'ferrero.jpg'),
('KitKat', 'Philadelphia, KitKat, fresa y Nutella.', 115, 'kitkat.jpg'),
('Kinder', 'Philadelphia, Kinder Delice, nuez y Nutella.', 115, 'kinder.jpg'),
('Philadelphia', 'Untuosa, suave y deliciosa.', 72, 'philadelphia.jpg'),
('Queso Manchego', 'Derretida, sencilla y efectiva.', 82, 'manchego.jpg'),
('Manchego Jamón', 'Una combinación infalible.', 92, 'manchego_jamon.jpg'),
('Philadelphia Jamón', 'Cremosa y salada.', 82, 'philadelphia_jamon.jpg'),
('Manchego Peperoni', 'Queso fundido y peperoni.', 92, 'manchego_peperoni.jpg'),
('Philadelphia Manchego Jamón', 'La poderosa: philadelphia, manchego y jamón.', 96, 'poderosa.jpg'),
('Española', 'Salsa de pizza, manchego, jamón, salami y peperoni.', 105, 'espanola.jpg'),
('Hawaiana', 'Salsa de pizza, manchego, jamón y piña.', 105, 'hawaiana.jpg'),
('Italiana', 'Salsa de pizza, manchego, peperoni y champiñones.', 105, 'italiana.jpg'),
('Crepa Oreo', 'Crepa con oreo y relleno a elección.', 45, 'oreocrep.jpg'),
('Crepa Fresa', 'Crepa con fresas naturales.', 40, 'fresacrep.jpg');
