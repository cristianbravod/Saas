// server.js - Restaurant Backend con CORS optimizado para m車viles
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const QRCode = require('qrcode');
const uploadRoutes = require('./src/routes/upload'); // ? Ya exist赤a
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURACI車N DEL RESTAURANTE
// ==========================================
const RESTAURANT_CONFIG = {
  name: "Ooilo Taqueria", // ??? CAMBIAR AQU赤 EL NOMBRE
  description: "Cocina aut谷ntica con los mejores ingredientes",
  phone: "+56912345678",
  hours: "Vier-Sab: 13:00 - 21:00",
  address: "Temuco, Chile"
};

// ==========================================
// CONFIGURACI車N CORS PARA APLICACIONES M車VILES
// ==========================================
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (aplicaciones m車viles nativas)
    if (!origin) {
      console.log('?? Request m車vil sin origin permitido');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19000',
      'http://192.1.1.16:3000',
      'http://192.1.1.16:19000',
      'exp://192.1.1.16:19000',
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log('? Origin permitido:', origin);
      return callback(null, true);
    }
    
    // Permitir para desarrollo
    console.log('?? Origin no listado pero permitido:', origin);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400
};

// Middleware CORS espec赤fico para m車viles
const mobileMiddleware = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  console.log(`?? ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'mobile-app'}`);
  
  if (req.method === 'OPTIONS') {
    console.log('? Preflight OPTIONS manejado correctamente');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }
  
  next();
};

app.use(cors(corsOptions));
app.use(mobileMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// ? ELIMINADA l赤nea duplicada: app.use(express.urlencoded({ extended: true }));

// ? AGREGADO: Servir archivos est芍ticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// ? AGREGADO: Servir archivos est芍ticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Ruta espec赤fica para el men迆 p迆blico
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu', 'index.html'));
});

// ==========================================
// CONFIGURACI車N BASE DE DATOS
// ==========================================
const pool = new Pool({
  user: process.env.DB_USER || 'postgres.ugcrigkvfejqlsoqnxxh',
  host: process.env.DB_HOST || 'aws-0-us-east-2.pooler.supabase.com',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 6543,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test de conexi車n BD
async function testDB() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('? BD conectada:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('? Error BD:', error.message);
    return false;
  }
}

// ==========================================
// MIDDLEWARE DE AUTENTICACI車N
// ==========================================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin required' });
  }
  next();
};

// ==========================================
// ENDPOINTS DE DIAGN車STICO
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.json({ 
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
      server: '192.1.1.16:3000',
      mobile_ready: true,
      // ? AGREGADO: Informaci車n de uploads
      uploads: {
        endpoint: '/api/upload',
        maxSize: '10MB',
        formats: ['image/jpeg', 'image/png', 'image/webp'],
        staticPath: '/uploads'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/api/ping', (req, res) => {
  res.json({
    status: 'PONG',
    timestamp: new Date().toISOString(),
    server: '192.1.1.16:3000'
  });
});

app.get('/api/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS funcionando',
    origin: req.get('Origin') || 'mobile-app',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// AUTENTICACI車N
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;
    console.log('?? Intento login:', email);
    
    const result = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('? Usuario no encontrado:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('? Password incorrecto para:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '24h' }
    );
    
    console.log('? Login exitoso:', email, 'Rol:', user.rol);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('? Error login:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

app.post('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      nombre: req.user.nombre,
      rol: req.user.rol
    }
  });
});

// ==========================================
// CATEGOR赤AS
// ==========================================
app.get('/api/categorias', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM categorias WHERE activo = true ORDER BY nombre');
    console.log(`?? ${result.rows.length} categor赤as`);
    res.json(result.rows);
  } catch (error) {
    console.error('? Error categor赤as:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// ==========================================
// MEN迆
// ==========================================
app.get('/api/menu', async (req, res) => {
  const client = await pool.connect();
  try {
    const { categoria_id, disponible } = req.query;
    
    let query = `
      SELECT m.*, c.nombre as categoria_nombre 
      FROM menu_items m 
      JOIN categorias c ON m.categoria_id = c.id 
      WHERE c.activo = true
    `;
    const params = [];

    if (categoria_id) {
      query += ` AND m.categoria_id = $1`;
      params.push(categoria_id);
    }

    if (disponible !== undefined) {
      const paramNum = params.length + 1;
      query += ` AND m.disponible = $${paramNum}`;
      params.push(disponible === 'true');
    }

    query += ' ORDER BY c.nombre, m.nombre';

    const result = await client.query(query, params);
    console.log(`??? ${result.rows.length} productos en men迆 (con im芍genes)`);
    res.json(result.rows);
  } catch (error) {
    console.error('? Error men迆:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    client.release();
  }
});

app.get('/api/menu/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('?? Sync men迆 solicitado');
    
    const result = await client.query(`
      SELECT m.*, c.nombre as categoria_nombre 
      FROM menu_items m 
      JOIN categorias c ON m.categoria_id = c.id 
      WHERE m.disponible = true AND c.activo = true
      ORDER BY c.nombre, m.nombre
    `);
    
    console.log(`? Sync men迆: ${result.rows.length} productos`);
    res.json(result.rows);
  } catch (error) {
    console.error('? Error sync men迆:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    client.release();
  }
});

app.get('/api/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('?? Sync completo solicitado');
    
    const [menuResult, categoriasResult, especialesResult] = await Promise.all([
      client.query(`
        SELECT m.*, c.nombre as categoria_nombre 
        FROM menu_items m 
        JOIN categorias c ON m.categoria_id = c.id 
        WHERE c.activo = true ORDER BY c.nombre, m.nombre
      `),
      client.query('SELECT * FROM categorias WHERE activo = true ORDER BY nombre'),
      client.query(`
        SELECT * FROM platos_especiales 
        WHERE disponible = true
		AND vigente = true	
        AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
        ORDER BY created_at DESC
      `)
    ]);
    
    const response = {
      menu: menuResult.rows,
      categorias: categoriasResult.rows,
      especiales: especialesResult.rows,
      offline: false,
      timestamp: new Date().toISOString(),
      server: '192.1.1.16:3000'
    };
    
    console.log(`? Sync completo: ${menuResult.rows.length} men迆, ${categoriasResult.rows.length} categor赤as`);
    res.json(response);
    
  } catch (error) {
    console.error('? Error sync completo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sync', 
      offline: true
    });
  } finally {
    client.release();
  }
});

app.post('/api/menu', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      nombre, 
      precio, 
      categoria_id, 
      descripcion, 
      disponible, 
      vegetariano, 
      picante, 
      ingredientes,
      imagen
    } = req.body;
    
    // Validaci車n b芍sica
    if (!nombre || !precio || parseFloat(precio) <= 0 || !categoria_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, precio v芍lido y categor赤a son requeridos' 
      });
    }
    
    console.log('? Creando producto con imagen:', nombre, imagen ? 'con imagen' : 'sin imagen');
    
    const result = await client.query(
      `INSERT INTO menu_items (
         nombre, precio, categoria_id, descripcion, disponible, 
         vegetariano, picante, ingredientes, imagen, fecha_creacion, fecha_modificacion
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [
        nombre.trim(), 
        parseFloat(precio), 
        parseInt(categoria_id), 
        descripcion?.trim() || null, 
        disponible !== false,
        vegetariano || false,
        picante || false,
        ingredientes || null,
        imagen || null
      ]
    );
    
    console.log('? Producto creado con 谷xito:', result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('? Error creando producto:', error);
    
    if (error.code === '23505') { // Duplicate key
      res.status(409).json({ 
        success: false, 
        message: 'Ya existe un producto con ese nombre' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error del servidor', 
        error: error.message 
      });
    }
  } finally {
    client.release();
  }
});

app.put('/api/menu/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, precio, categoria_id, descripcion, disponible, vegetariano, picante, ingredientes, imagen } = req.body;
    
    // Validaci車n b芍sica
    if (!nombre || !precio || parseFloat(precio) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y precio v芍lido son requeridos' 
      });
    }
	
	console.log('?? Actualizando producto con imagen:', nombre, imagen ? 'con imagen' : 'sin imagen');
    
    const result = await client.query(
      `UPDATE menu_items 
       SET nombre = $1, precio = $2, categoria_id = $3, descripcion = $4, 
           disponible = $5, vegetariano = $6, picante = $7, ingredientes = $8,
			imagen = $9, fecha_modificacion = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [
        nombre.trim(),
        parseFloat(precio),
        categoria_id ? parseInt(categoria_id) : null,
        descripcion?.trim() || null,
        disponible !== false,
        vegetariano || false,
        picante || false,
        ingredientes || null,
        imagen || null,
        req.params.id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    console.log('? Producto actualizado:', result.rows[0].nombre);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('? Error actualizando producto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor', 
      error: error.message 
    });
  } finally {
    client.release();
  }
});

app.delete('/api/menu/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM menu_items WHERE id = $1 RETURNING nombre', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    console.log('??? Producto eliminado:', result.rows[0].nombre);
    res.json({ success: true, message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('? Error eliminando producto:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// ==========================================
// PLATOS ESPECIALES - ENDPOINTS COMPLETOS
// ==========================================
app.get('/api/platos-especiales', async (req, res) => {
  console.log('?? GET /api/platos-especiales - REQUEST RECIBIDO');
  
  const client = await pool.connect();
  try {
    console.log('?? Conexi車n a BD establecida');
    
    const result = await client.query(`
      SELECT * FROM platos_especiales WHERE vigente = true ORDER BY id DESC
    `);
    
    console.log(`? Query ejecutado exitosamente - ${result.rows.length} registros encontrados`);
    
    if (result.rows.length > 0) {
      console.log('?? Primeros registros:', result.rows.slice(0, 2));
    }
    
    if (result.rows.length === 0) {
      console.log('?? ADVERTENCIA: La tabla platos_especiales est芍 vac赤a');
      
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'platos_especiales'
        );
      `);
      
      console.log('?? ?Tabla existe?', tableCheck.rows[0].exists);
      
      if (!tableCheck.rows[0].exists) {
        console.error('? ERROR CR赤TICO: La tabla platos_especiales no existe en la base de datos');
        return res.status(500).json({ 
          success: false, 
          message: 'Tabla platos_especiales no encontrada en la base de datos',
          error: 'TABLE_NOT_EXISTS'
        });
      }
    }
    
    console.log(`?? Enviando respuesta con ${result.rows.length} platos especiales`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('? ERROR EN GET /api/platos-especiales:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor obteniendo platos especiales',
      error: error.message,
      code: error.code
    });
  } finally {
    client.release();
    console.log('?? Conexi車n a BD liberada');
  }
});

app.get('/api/platos-especiales', async (req, res) => {
  console.log('?? GET /api/platos-especiales - REQUEST RECIBIDO');
  
  const client = await pool.connect();
  try {
    console.log('?? Conexion a BD establecida');
    
    // Solo mostrar platos donde vigente = true
    const result = await client.query(`
      SELECT * FROM platos_especiales 
      WHERE vigente = true 
      ORDER BY id DESC
    `);
    
    console.log(`? Query ejecutado exitosamente - ${result.rows.length} registros vigentes encontrados`);
    
    if (result.rows.length > 0) {
      console.log('?? Primeros registros:', result.rows.slice(0, 2));
    }
    
    if (result.rows.length === 0) {
      console.log('?? No hay platos especiales vigentes');
      
      // Verificar si hay platos no vigentes
      const totalCount = await client.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN vigente = true THEN 1 END) as vigentes,
               COUNT(CASE WHEN vigente = false THEN 1 END) as no_vigentes
        FROM platos_especiales
      `);
      
      console.log('?? Estado de platos especiales:', totalCount.rows[0]);
    }
    
    console.log(`?? Enviando respuesta con ${result.rows.length} platos especiales vigentes`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('? ERROR EN GET /api/platos-especiales:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor obteniendo platos especiales',
      error: error.message,
      code: error.code
    });
  } finally {
    client.release();
    console.log('?? Conexion a BD liberada');
  }
});

app.get('/api/platos-especiales/:id/historial', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT nombre, created_at, fecha_modificacion, 
       EXTRACT(EPOCH FROM (fecha_modificacion - created_at))/3600 as horas_desde_creacion
       FROM platos_especiales WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plato especial no encontrado' });
    }
    
    res.json({
      plato: result.rows[0],
      info: {
        creado: result.rows[0].created_at,
        ultima_modificacion: result.rows[0].fecha_modificacion,
        tiempo_desde_creacion: `${Math.round(result.rows[0].horas_desde_creacion)} horas`
      }
    });
  } catch (error) {
    console.error('? Error obteniendo historial:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    client.release();
  }
});

app.post('/api/platos-especiales', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      nombre, 
      precio, 
      descripcion, 
      disponible, 
      vegetariano, 
      picante, 
      fecha_fin, 
      imagen_url
    } = req.body;
    
    if (!nombre || !precio || parseFloat(precio) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y precio v芍lido son requeridos' 
      });
    }
    
    console.log('? Creando plato especial:', nombre, imagen_url ? 'con imagen' : 'sin imagen');
     
    const result = await client.query(
      `INSERT INTO platos_especiales (
         nombre, precio, descripcion, disponible, vegetariano, picante, 
         fecha_fin, imagen_url, fecha_inicio, created_at, fecha_modificacion
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [
        nombre.trim(), 
        parseFloat(precio), 
        descripcion?.trim() || null, 
        disponible !== false, 
        vegetariano || false, 
        picante || false, 
        fecha_fin || null, 
        imagen_url || null
      ]
    );
    
    console.log('? Plato especial creado:', result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('? Error creando plato especial:', error);
    
    if (error.code === '23505') {
      res.status(409).json({ 
        success: false, 
        message: 'Ya existe un plato especial con ese nombre' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error del servidor', 
        error: error.message 
      });
    }
  } finally {
    client.release();
  }
});

app.put('/api/platos-especiales/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      nombre, 
      precio, 
      descripcion, 
      disponible, 
      vegetariano, 
      picante, 
      fecha_fin, 
      imagen_url
    } = req.body;
    
    if (!nombre || !precio || parseFloat(precio) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y precio v芍lido son requeridos' 
      });
    }
    
    console.log('?? Actualizando plato especial:', nombre, imagen_url ? 'con imagen' : 'sin imagen');
    
    const result = await client.query(
      `UPDATE platos_especiales 
       SET nombre = $1, precio = $2, descripcion = $3, disponible = $4, 
           vegetariano = $5, picante = $6, fecha_fin = $7, imagen_url = $8,
           fecha_modificacion = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [
        nombre.trim(), 
        parseFloat(precio), 
        descripcion?.trim() || null, 
        disponible !== false, 
        vegetariano || false, 
        picante || false, 
        fecha_fin || null, 
        imagen_url || null,
        req.params.id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plato especial no encontrado' });
    }
    
    console.log('? Plato especial actualizado:', result.rows[0].nombre);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('? Error actualizando plato especial:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor', 
      error: error.message 
    });
  } finally {
    client.release();
  }
});

app.delete('/api/platos-especiales/:id', authMiddleware, adminMiddleware, async (req, res) => {
	
  console.log('Request recibido');
  const client = await pool.connect();
  try {
    // En lugar de DELETE, hacemos UPDATE del campo vigente
    const result = await client.query(
      `UPDATE platos_especiales 
       SET vigente = false, 
           fecha_modificacion = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING id, nombre`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plato especial no encontrado' 
      });
    }
    
    console.log('? Plato especial marcado como no vigente:', result.rows[0].nombre);
    
    res.json({ 
      success: true, 
      message: 'Plato especial eliminado exitosamente',
      plato: result.rows[0]
    });
    
  } catch (error) {
    console.error('? Error eliminando plato especial:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor', 
      error: error.message 
    });
  } finally {
    client.release();
  }
});

app.patch('/api/platos-especiales/:id/disponibilidad', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { disponible } = req.body;
    
    const result = await client.query(
      `UPDATE platos_especiales 
       SET disponible = $1, fecha_modificacion = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [disponible, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plato especial no encontrado' });
    }
    
    console.log('?? Disponibilidad cambiada:', result.rows[0].nombre, disponible);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('? Error cambiando disponibilidad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor', 
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// ==========================================
// MEN迆 P迆BLICO
// ==========================================
app.get('/api/menu-publico', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('?? Generando men迆 p迆blico para clientes...');
    
    // ??? USAR CONFIGURACI車N CENTRALIZADA
    const infoRestaurante = {
      nombre: RESTAURANT_CONFIG.name,
      descripcion: RESTAURANT_CONFIG.description,
      telefono: RESTAURANT_CONFIG.phone,
      horarios: RESTAURANT_CONFIG.hours,
      direccion: RESTAURANT_CONFIG.address
    };

    const categoriasQuery = `
      SELECT * FROM categorias 
      WHERE activo = true 
      ORDER BY nombre
    `;
    const categorias = await client.query(categoriasQuery);

    const menuQuery = `
      SELECT m.*, c.nombre as categoria_nombre, c.id as categoria_id
      FROM menu_items m 
      JOIN categorias c ON m.categoria_id = c.id 
      WHERE m.disponible = true AND c.activo = true
      ORDER BY c.nombre, m.nombre
    `;
    const menuItems = await client.query(menuQuery);

    const especialesQuery = `
      SELECT * FROM platos_especiales 
      WHERE disponible = true
	  AND vigente = true
      AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
      ORDER BY created_at DESC
    `;
    const platosEspeciales = await client.query(especialesQuery);

    const menuOrganizado = {};
    categorias.rows.forEach(categoria => {
      const itemsCategoria = menuItems.rows.filter(item => 
        item.categoria_id === categoria.id && item.disponible
      );
      
      if (itemsCategoria.length > 0) {
        menuOrganizado[categoria.id] = {
          ...categoria,
          items: itemsCategoria
        };
      }
    });
    
    res.json({
      success: true,
      restaurante: infoRestaurante,
      categorias: Object.values(menuOrganizado),
      platos_especiales: platosEspeciales.rows,
      timestamp: new Date().toISOString(),
      total_items: menuItems.rows.length
    });
    
  } catch (error) {
    console.error('? Error generando men迆 p迆blico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generando men迆 p迆blico',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// ==========================================
// ENDPOINTS QR - POSICI車N CORRECTA (ANTES DEL ERROR HANDLER)
// ==========================================

// QR Menu P迆blico
app.get('/api/qr/menu-publico', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('?? Generando men迆 p迆blico para QR...');
    
    const categorias = await client.query(
      'SELECT * FROM categorias WHERE activo = true ORDER BY nombre'
    );
    
    const menuItems = await client.query(`
      SELECT 
        m.id,
        m.nombre,
        m.descripcion,
        m.precio,
        m.vegetariano,
        m.picante,
        m.tiempo_preparacion,
        m.ingredientes,
        m.imagen,
        c.nombre as categoria_nombre,
        c.id as categoria_id
      FROM menu_items m
      JOIN categorias c ON m.categoria_id = c.id
      WHERE m.disponible = true AND c.activo = true
      ORDER BY c.nombre, m.nombre
    `);
    
    const platosEspeciales = await client.query(`
      SELECT 
        id,
        nombre,
        descripcion,
        precio,
        vegetariano,
        picante,
        tiempo_preparacion,
        fecha_fin
      FROM platos_especiales
      WHERE disponible = true 
      AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
      ORDER BY nombre
    `);
    
    const menuOrganizado = {};
    
    categorias.rows.forEach(categoria => {
      menuOrganizado[categoria.nombre] = {
        id: categoria.id,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        items: []
      };
    });
    
    menuItems.rows.forEach(item => {
      if (menuOrganizado[item.categoria_nombre]) {
        menuOrganizado[item.categoria_nombre].items.push({
          ...item,
          es_especial: false
        });
      }
    });
    
    if (platosEspeciales.rows.length > 0) {
      menuOrganizado['Platos Especiales'] = {
        id: 'especiales',
        nombre: 'Platos Especiales',
        descripcion: 'Especialidades del chef',
        items: platosEspeciales.rows.map(item => ({
          ...item,
          categoria_nombre: 'Platos Especiales',
          es_especial: true
        }))
      };
    }
    
    // ??? USAR CONFIGURACI車N CENTRALIZADA
    const infoRestaurante = {
      nombre: RESTAURANT_CONFIG.name,
      descripcion: RESTAURANT_CONFIG.description,
      telefono: RESTAURANT_CONFIG.phone,
      direccion: RESTAURANT_CONFIG.address,
      horarios: RESTAURANT_CONFIG.hours
    };
    
    res.json({
      success: true,
      restaurante: infoRestaurante,
      categorias: Object.values(menuOrganizado),
      menu_items: menuItems.rows,
      platos_especiales: platosEspeciales.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('? Error generando men迆 p迆blico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generando men迆 p迆blico',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// Endpoint para generar QR real
app.get('/api/qr/generar', async (req, res) => {
  try {
    const { formato = 'png', download = false } = req.query;
    
    const baseUrl = `http://${req.get('host')}`;
    const menuUrl = `${baseUrl}/menu`;
    
    console.log('?? Generando QR real para:', menuUrl);
    
    const qrOptions = {
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#2c3e50',
        light: '#FFFFFF'
      },
      width: 400,
      errorCorrectionLevel: 'M'
    };
    
    if (formato === 'json') {
      const qrDataUrl = await QRCode.toDataURL(menuUrl, qrOptions);
      
      res.json({
        success: true,
        restaurante: RESTAURANT_CONFIG.name, // ??? USAR CONFIGURACI車N CENTRALIZADA
        menu_url: menuUrl,
        qr_data_url: qrDataUrl,
        fecha_generacion: new Date().toISOString(),
        instrucciones: 'C車digo QR escaneable listo para imprimir y usar en las mesas',
        formato: 'base64',
        servidor: req.get('host')
      });
      
    } else if (formato === 'svg') {
      const qrSvg = await QRCode.toString(menuUrl, { 
        ...qrOptions, 
        type: 'svg',
        width: 300
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      if (download === 'true') {
        res.setHeader('Content-Disposition', 'attachment; filename="menu-qr.svg"');
      }
      res.send(qrSvg);
      
    } else {
      const qrBuffer = await QRCode.toBuffer(menuUrl, qrOptions);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      if (download === 'true') {
        res.setHeader('Content-Disposition', 'attachment; filename="menu-qr.png"');
      }
      
      res.send(qrBuffer);
    }
    
    console.log(`? QR generado en formato ${formato} para: ${menuUrl}`);
    
  } catch (error) {
    console.error('? Error generando QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar c車digo QR',
      error: error.message,
      solucion: 'Ejecuta: npm install qrcode'
    });
  }
});

// Endpoint para informaci車n del QR
app.get('/api/qr/info', async (req, res) => {
  try {
    const baseUrl = `http://${req.get('host')}`;
    const menuUrl = `${baseUrl}/menu`;
    
    const client = await pool.connect();
    let stats = {};
    
    try {
      const [menuCount, categoriaCount] = await Promise.all([
        client.query('SELECT COUNT(*) FROM menu_items WHERE disponible = true'),
        client.query('SELECT COUNT(*) FROM categorias WHERE activo = true')
      ]);
      
      stats = {
        productos_disponibles: parseInt(menuCount.rows[0].count),
        categorias_activas: parseInt(categoriaCount.rows[0].count)
      };
    } catch (dbError) {
      console.log('?? No se pudieron obtener estad赤sticas de la BD');
      stats = { error: 'BD no disponible' };
    } finally {
      client.release();
    }
    
    res.json({
      success: true,
      menu_url: menuUrl,
      qr_endpoints: {
        generar_png: `${baseUrl}/api/qr/generar?formato=png`,
        generar_svg: `${baseUrl}/api/qr/generar?formato=svg`,
        generar_json: `${baseUrl}/api/qr/generar?formato=json`,
        descargar_png: `${baseUrl}/api/qr/generar?formato=png&download=true`
      },
      server_info: {
        host: req.get('host'),
        timestamp: new Date().toISOString()
      },
      estadisticas: stats,
      formatos_disponibles: ['png', 'svg', 'json']
    });
  } catch (error) {
    console.error('? Error obteniendo info QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo informaci車n del QR',
      error: error.message
    });
  }
});

// Endpoint de prueba para QR
app.get('/api/qr/test', async (req, res) => {
  try {
    console.log('?? Probando generaci車n de QR...');
    
    const testUrl = 'https://google.com';
    const qrDataUrl = await QRCode.toDataURL(testUrl, {
      width: 200,
      margin: 2
    });
    
    res.json({
      success: true,
      message: 'QR generado correctamente',
      test_url: testUrl,
      qr_data_url: qrDataUrl,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('? Error en test QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test de QR',
      error: error.message,
      solucion: 'Ejecuta: npm install qrcode'
    });
  }
});

// ==========================================
// 車RDENES
// ==========================================
app.post('/api/ordenes', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { mesa, items, total, metodo_pago } = req.body;
    const usuario_id = req.user?.id || 1;
    
    const ordenResult = await client.query(
      `INSERT INTO ordenes (usuario_id, total, estado, metodo_pago, mesa, tipo_orden) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuario_id, total, 'entregada', metodo_pago || 'efectivo', mesa, 'mesa']
    );
    
    const orden = ordenResult.rows[0];
    
    for (const item of items) {
      if (item.es_plato_especial) {
        await client.query(
          `INSERT INTO orden_items (orden_id, plato_especial_id, cantidad, precio_unitario) 
           VALUES ($1, $2, $3, $4)`,
          [orden.id, item.id, item.cantidad, item.precio]
        );
      } else {
        await client.query(
          `INSERT INTO orden_items (orden_id, menu_item_id, cantidad, precio_unitario) 
           VALUES ($1, $2, $3, $4)`,
          [orden.id, item.id, item.cantidad, item.precio]
        );
      }
    }
    
    await client.query('COMMIT');
    
    console.log('? Orden creada:', orden.id);
    res.status(201).json({ success: true, orden });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('? Error creando orden:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// ==========================================
// MESAS
// ==========================================
app.get('/api/mesas', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT m.*, 
             COALESCE(activas.ordenes_activas, 0) as ordenes_activas,
             COALESCE(activas.total_pendiente, 0) as total_pendiente
      FROM mesas m
      LEFT JOIN (
        SELECT mesa, 
               COUNT(*) as ordenes_activas,
               SUM(total) as total_pendiente
        FROM ordenes 
        WHERE estado IN ('pendiente', 'confirmada', 'preparando')
        GROUP BY mesa
      ) activas ON m.numero = activas.mesa::text
      ORDER BY m.numero
    `);
    
    console.log(`?? ${result.rows.length} mesas`);
    res.json(result.rows);
  } catch (error) {
    console.error('? Error mesas:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// ==========================================
// REPORTES
// ==========================================
app.get('/api/reportes/ventas', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { fecha_inicio, fecha_fin, mesa, metodo_pago } = req.query;
    
    let query = `
      SELECT DATE(fecha_creacion) as fecha,
             COUNT(*) as total_ordenes,
             SUM(total) as total_ventas,
             AVG(total) as promedio_orden,
             array_agg(DISTINCT mesa) as mesas_activas
      FROM ordenes 
      WHERE estado = 'entregada'
    `;
    const params = [];
    let paramCount = 0;

    if (fecha_inicio) {
      paramCount++;
      query += ` AND fecha_creacion >= ${paramCount}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      query += ` AND fecha_creacion <= ${paramCount}`;
      params.push(fecha_fin);
    }

    if (mesa) {
      paramCount++;
      query += ` AND mesa = ${paramCount}`;
      params.push(mesa);
    }

    if (metodo_pago) {
      paramCount++;
      query += ` AND metodo_pago = ${paramCount}`;
      params.push(metodo_pago);
    }

    query += ' GROUP BY DATE(fecha_creacion) ORDER BY fecha DESC';

    const result = await client.query(query, params);
    
    const totales = result.rows.reduce((acc, row) => ({
      ordenes: acc.ordenes + parseInt(row.total_ordenes),
      ventas: acc.ventas + parseFloat(row.total_ventas)
    }), { ordenes: 0, ventas: 0 });
    
    res.json({
      success: true,
      datos: result.rows.map(row => ({
        fecha: row.fecha,
        total_ordenes: parseInt(row.total_ordenes),
        total_ventas: parseFloat(row.total_ventas),
        promedio_orden: parseFloat(row.promedio_orden),
        mesas_activas: row.mesas_activas
      })),
      resumen: {
        total_ordenes: totales.ordenes,
        total_ventas: totales.ventas,
        promedio_general: totales.ordenes > 0 ? (totales.ventas / totales.ordenes) : 0
      }
    });
    
  } catch (error) {
    console.error('? Error reporte ventas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generando reporte de ventas', 
      error: error.message 
    });
  } finally {
    client.release();
  }
});

app.get('/api/reportes/productos-populares', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { fecha_inicio, fecha_fin, limite = 10 } = req.query;
    
    let query = `
      SELECT 
        COALESCE(m.nombre, pe.nombre) as nombre,
        COALESCE(m.precio, pe.precio) as precio,
        SUM(oi.cantidad) as total_vendido,
        SUM(oi.cantidad * oi.precio_unitario) as ingresos_totales,
        COUNT(DISTINCT o.id) as ordenes_count,
        AVG(oi.precio_unitario) as precio_promedio,
        CASE 
          WHEN m.id IS NOT NULL THEN 'menu' 
          ELSE 'especial' 
        END as tipo
      FROM orden_items oi
      JOIN ordenes o ON oi.orden_id = o.id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      LEFT JOIN platos_especiales pe ON oi.plato_especial_id = pe.id
      WHERE o.estado = 'entregada'
    `;
    const params = [];
    let paramCount = 0;

    if (fecha_inicio) {
      paramCount++;
      query += ` AND o.fecha_creacion >= ${paramCount}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      query += ` AND o.fecha_creacion <= ${paramCount}`;
      params.push(fecha_fin);
    }

    query += `
      GROUP BY COALESCE(m.nombre, pe.nombre), COALESCE(m.precio, pe.precio), 
               CASE WHEN m.id IS NOT NULL THEN 'menu' ELSE 'especial' END
      ORDER BY total_vendido DESC
      LIMIT ${paramCount + 1}
    `;
    params.push(parseInt(limite));

    const result = await client.query(query, params);
    
    res.json({
      success: true,
      productos: result.rows.map(row => ({
        ...row,
        total_vendido: parseInt(row.total_vendido),
        ingresos_totales: parseFloat(row.ingresos_totales),
        ordenes_count: parseInt(row.ordenes_count),
        precio_promedio: parseFloat(row.precio_promedio)
      }))
    });
    
  } catch (error) {
    console.error('? Error obteniendo productos populares:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo productos populares', 
      error: error.message 
    });
  } finally {
    client.release();
  }
});

app.get('/api/reportes/test-connection', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const tests = [
      {
        name: '車rdenes totales',
        query: 'SELECT COUNT(*) as count FROM ordenes'
      },
      {
        name: '車rdenes entregadas',
        query: "SELECT COUNT(*) as count FROM ordenes WHERE estado = 'entregada'"
      },
      {
        name: 'Items del men迆',
        query: 'SELECT COUNT(*) as count FROM menu_items'
      },
      {
        name: 'Estructura ejemplo',
        query: `SELECT o.id, o.mesa, o.total, o.fecha_creacion 
                FROM ordenes o
                WHERE o.estado = 'entregada'
                LIMIT 3`
      }
    ];
    
    const results = {};
    
    for (const test of tests) {
      try {
        const result = await client.query(test.query);
        results[test.name] = {
          success: true,
          data: result.rows
        };
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      message: 'Test de conectividad completado',
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error('? Error en test de conectividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando test de conectividad',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ? AGREGADO: Registrar ruta de upload
app.use('/api/upload', uploadRoutes);

// ? AGREGADO: Middleware de error para uploads (ANTES del error handler '*')
app.use((error, req, res, next) => {
  // Errores espec赤ficos de multer
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Archivo demasiado grande (m芍ximo 10MB)',
      error: 'FILE_TOO_LARGE'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Demasiados archivos (m芍ximo 1)',
      error: 'TOO_MANY_FILES'
    });
  }
  
  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido. Solo im芍genes.',
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  // Pasar al siguiente middleware de error
  next(error);
});

// ==========================================
// INICIALIZACI車N Y ARRANQUE DEL SERVIDOR
// ==========================================

// Test inicial de conexi車n BD
testDB().then(connected => {
  if (connected) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log('?? Servidor Restaurant Backend iniciado');
      console.log(`?? Puerto: ${PORT}`);
      console.log(`??? Restaurante: ${RESTAURANT_CONFIG.name}`); // ??? MOSTRAR NOMBRE DEL RESTAURANTE
      console.log(`?? URLs disponibles:`);
      console.log(`   - Local: http://localhost:${PORT}`);
      console.log(`   - Red:   http://192.1.1.16:${PORT}`);
      console.log(`   - M車vil: http://192.1.1.16:${PORT}/api/health`);
      console.log('?? CORS configurado para aplicaciones m車viles');
      console.log('? Listo para recibir peticiones de la app');
    });
  } else {
    console.error('? No se pudo conectar a la base de datos. Servidor no iniciado.');
    process.exit(1);
  }
});

// ==========================================
// ERROR HANDLERS GLOBALES (DEBE IR AL FINAL)
// ==========================================
app.use('*', (req, res) => {
  console.log(`?? Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found`,
    server: '192.1.1.16:3000',
    availableRoutes: [
      // Diagn車stico
      'GET /api/health',
      'GET /api/ping',
      'GET /api/test-cors',
      
      // Autenticaci車n
      'POST /api/auth/login',
      'POST /api/auth/verify',
      
      // Categor赤as
      'GET /api/categorias',
      
      // Men迆
      'GET /api/menu',
      'GET /api/menu/sync',
      'GET /api/sync',
      'POST /api/menu',
      'PUT /api/menu/:id',
      'DELETE /api/menu/:id',
      'GET /api/menu-publico',
      
      // Platos Especiales
      'GET /api/platos-especiales',
      'POST /api/platos-especiales',
      'PUT /api/platos-especiales/:id',
      'DELETE /api/platos-especiales/:id',
      'PATCH /api/platos-especiales/:id/disponibilidad',
      'GET /api/platos-especiales/:id/historial',
      'GET /api/debug/platos-especiales',
      
      // QR y Men迆 P迆blico
      'GET /api/qr/menu-publico',
      'GET /api/qr/generar',
      'GET /api/qr/info',
      'GET /api/qr/test',
      
      // 車rdenes
      'POST /api/ordenes',
      
      // Mesas
      'GET /api/mesas',
      
      // Reportes
      'GET /api/reportes/ventas',
      'GET /api/reportes/productos-populares',
      'GET /api/reportes/test-connection',
      
      // ? AGREGADO: Upload de im芍genes
      'GET /api/upload/list',
      'POST /api/upload/image', 
      'POST /api/upload/base64',
      'GET /api/upload/info/:fileName',
      'DELETE /api/upload/:fileName'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('? Error del servidor:', err);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Manejo de se?ales para cierre limpio
process.on('SIGINT', async () => {
  console.log('?? Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('?? Cerrando servidor...');
  await pool.end();
  process.exit(0);
});

module.exports = app;