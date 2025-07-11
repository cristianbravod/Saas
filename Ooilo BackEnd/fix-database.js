// fix-database.js - Corregir problemas de base de datos
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'restaurante_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function diagnosticarYCorregirBD() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS');
    console.log('=====================================\n');

    // 1. Verificar estructura de tablas
    await verificarEstructura(client);
    
    // 2. Verificar datos existentes
    await verificarDatos(client);
    
    // 3. Verificar constraints
    await verificarConstraints(client);
    
    // 4. Corregir problemas encontrados
    await corregirProblemas(client);
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

async function verificarEstructura(client) {
  console.log('📋 1. VERIFICANDO ESTRUCTURA DE TABLAS\n');
  
  // Verificar que las tablas principales existen
  const tablas = ['usuarios', 'categorias', 'menu_items', 'platos_especiales', 'mesas', 'ordenes', 'orden_items'];
  
  for (const tabla of tablas) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tabla]);
      
      const existe = result.rows[0].exists;
      console.log(`   ${existe ? '✅' : '❌'} Tabla ${tabla}: ${existe ? 'EXISTE' : 'NO EXISTE'}`);
      
    } catch (error) {
      console.log(`   ❌ Error verificando tabla ${tabla}:`, error.message);
    }
  }
}

async function verificarDatos(client) {
  console.log('\n📊 2. VERIFICANDO DATOS EXISTENTES\n');
  
  try {
    // Contar registros en tablas principales
    const consultas = [
      { tabla: 'usuarios', query: 'SELECT COUNT(*) as count FROM usuarios' },
      { tabla: 'categorias', query: 'SELECT COUNT(*) as count FROM categorias' },
      { tabla: 'menu_items', query: 'SELECT COUNT(*) as count FROM menu_items' },
      { tabla: 'platos_especiales', query: 'SELECT COUNT(*) as count FROM platos_especiales' },
      { tabla: 'mesas', query: 'SELECT COUNT(*) as count FROM mesas' },
      { tabla: 'ordenes', query: 'SELECT COUNT(*) as count FROM ordenes' }
    ];
    
    for (const consulta of consultas) {
      try {
        const result = await client.query(consulta.query);
        const count = result.rows[0].count;
        console.log(`   📊 ${consulta.tabla}: ${count} registros`);
      } catch (error) {
        console.log(`   ❌ Error en ${consulta.tabla}:`, error.message);
      }
    }
    
    // Verificar categorías específicamente
    console.log('\n   🔍 CATEGORÍAS EXISTENTES:');
    const categorias = await client.query('SELECT id, nombre FROM categorias ORDER BY id');
    categorias.rows.forEach(cat => {
      console.log(`     - ID ${cat.id}: ${cat.nombre}`);
    });
    
    // Verificar menu_items con problemas
    console.log('\n   🔍 MENU_ITEMS CON PROBLEMAS:');
    const itemsProblema = await client.query(`
      SELECT m.id, m.nombre, m.categoria_id, c.nombre as categoria_nombre
      FROM menu_items m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      WHERE c.id IS NULL
    `);
    
    if (itemsProblema.rows.length > 0) {
      console.log('     ⚠️  ITEMS CON CATEGORÍA INVÁLIDA:');
      itemsProblema.rows.forEach(item => {
        console.log(`       - ID ${item.id}: "${item.nombre}" -> categoria_id: ${item.categoria_id} (NO EXISTE)`);
      });
    } else {
      console.log('     ✅ Todos los items tienen categorías válidas');
    }
    
  } catch (error) {
    console.error('   ❌ Error verificando datos:', error.message);
  }
}

async function verificarConstraints(client) {
  console.log('\n🔗 3. VERIFICANDO CONSTRAINTS\n');
  
  try {
    // Listar constraints de clave foránea
    const constraints = await client.query(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as referenced_table,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE contype = 'f' 
      AND connamespace = 'public'::regnamespace
      ORDER BY conrelid::regclass
    `);
    
    console.log('   🔗 CONSTRAINTS DE CLAVE FORÁNEA:');
    constraints.rows.forEach(constraint => {
      console.log(`     - ${constraint.constraint_name}`);
      console.log(`       Tabla: ${constraint.table_name} -> ${constraint.referenced_table}`);
      console.log(`       Definición: ${constraint.definition}\n`);
    });
    
  } catch (error) {
    console.error('   ❌ Error verificando constraints:', error.message);
  }
}

async function corregirProblemas(client) {
  console.log('\n🔧 4. CORRIGIENDO PROBLEMAS\n');
  
  try {
    await client.query('BEGIN');
    
    // Corrección 1: Asegurar que todas las categorías básicas existen
    console.log('   🔧 Verificando categorías básicas...');
    
    const categoriasBasicas = [
      { id: 1, nombre: 'Entradas', descripcion: 'Platos para comenzar la experiencia gastronómica' },
      { id: 2, nombre: 'Platos Principales', descripcion: 'Nuestros platos estrella y especialidades' },
      { id: 3, nombre: 'Postres', descripcion: 'Dulces tentaciones para finalizar' },
      { id: 4, nombre: 'Bebidas', descripcion: 'Bebidas refrescantes y calientes' },
      { id: 5, nombre: 'Pizzas', descripcion: 'Pizzas artesanales con ingredientes frescos' }
    ];
    
    for (const categoria of categoriasBasicas) {
      const existe = await client.query('SELECT id FROM categorias WHERE id = $1', [categoria.id]);
      
      if (existe.rows.length === 0) {
        await client.query(`
          INSERT INTO categorias (id, nombre, descripcion, activo) 
          VALUES ($1, $2, $3, true)
        `, [categoria.id, categoria.nombre, categoria.descripcion]);
        console.log(`     ✅ Categoría "${categoria.nombre}" creada`);
      } else {
        console.log(`     ✅ Categoría "${categoria.nombre}" ya existe`);
      }
    }
    
    // Corrección 2: Arreglar menu_items con categoria_id inválido
    console.log('\n   🔧 Corrigiendo menu_items con categorías inválidas...');
    
    const itemsProblema = await client.query(`
      SELECT m.id, m.nombre, m.categoria_id
      FROM menu_items m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      WHERE c.id IS NULL
    `);
    
    for (const item of itemsProblema.rows) {
      // Asignar a "Platos Principales" por defecto
      await client.query(`
        UPDATE menu_items 
        SET categoria_id = 2 
        WHERE id = $1
      `, [item.id]);
      
      console.log(`     🔧 Item "${item.nombre}" (ID: ${item.id}) corregido: categoria_id ${item.categoria_id} -> 2`);
    }
    
    // Corrección 3: Actualizar sequence de categorías
    console.log('\n   🔧 Actualizando sequence de categorías...');
    
    await client.query(`
      SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));
    `);
    
    // Corrección 4: Verificar y corregir campos faltantes
    console.log('\n   🔧 Verificando campos faltantes...');
    
    // Agregar campos faltantes a menu_items si no existen
    const camposFaltantes = [
      { nombre: 'vegetariano', tipo: 'BOOLEAN DEFAULT false' },
      { nombre: 'picante', tipo: 'BOOLEAN DEFAULT false' },
      { nombre: 'tiempo_preparacion', tipo: 'INTEGER DEFAULT 0' }
    ];
    
    for (const campo of camposFaltantes) {
      try {
        await client.query(`
          ALTER TABLE menu_items 
          ADD COLUMN IF NOT EXISTS ${campo.nombre} ${campo.tipo}
        `);
        console.log(`     ✅ Campo ${campo.nombre} verificado en menu_items`);
      } catch (error) {
        console.log(`     ⚠️  Campo ${campo.nombre} ya existe o error:`, error.message);
      }
    }
    
    // Corrección 5: Agregar campos faltantes a platos_especiales
    const camposEspeciales = [
      { nombre: 'vegetariano', tipo: 'BOOLEAN DEFAULT false' },
      { nombre: 'picante', tipo: 'BOOLEAN DEFAULT false' }
    ];
    
    for (const campo of camposEspeciales) {
      try {
        await client.query(`
          ALTER TABLE platos_especiales 
          ADD COLUMN IF NOT EXISTS ${campo.nombre} ${campo.tipo}
        `);
        console.log(`     ✅ Campo ${campo.nombre} verificado en platos_especiales`);
      } catch (error) {
        console.log(`     ⚠️  Campo ${campo.nombre} ya existe o error:`, error.message);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n   ✅ TODAS LAS CORRECCIONES APLICADAS EXITOSAMENTE');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n   ❌ Error aplicando correcciones:', error.message);
    throw error;
  }
}

// Función adicional para resetear datos de prueba
async function resetearDatosPrueba() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 RESETEANDO DATOS DE PRUEBA...\n');
    
    await client.query('BEGIN');
    
    // Limpiar tablas en orden para evitar conflictos de FK
    const tablasLimpiar = [
      'orden_items',
      'ordenes', 
      'detalle_pedidos',
      'pedidos',
      'menu_items'
    ];
    
    for (const tabla of tablasLimpiar) {
      try {
        const result = await client.query(`DELETE FROM ${tabla}`);
        console.log(`   🗑️  ${tabla}: ${result.rowCount} registros eliminados`);
      } catch (error) {
        console.log(`   ⚠️  Error limpiando ${tabla}:`, error.message);
      }
    }
    
    // Resetear sequences
    await client.query(`
      SELECT setval('menu_items_id_seq', 1, false);
      SELECT setval('ordenes_id_seq', 1, false);
      SELECT setval('orden_items_id_seq', 1, false);
    `);
    
    await client.query('COMMIT');
    console.log('\n   ✅ DATOS DE PRUEBA RESETEADOS');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n   ❌ Error reseteando datos:', error.message);
  } finally {
    client.release();
  }
}

// Ejecutar según parámetro
const comando = process.argv[2];

if (comando === 'reset') {
  resetearDatosPrueba().then(() => process.exit(0));
} else {
  diagnosticarYCorregirBD().then(() => process.exit(0));
}