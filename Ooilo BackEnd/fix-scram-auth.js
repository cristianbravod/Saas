// fix-scram-auth.js - Solución al error SCRAM de Supabase
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Solucionando error SCRAM de Supabase...\n');

// SOLUCIÓN 1: Configuración con workaround para SCRAM
const poolWithFix = new Pool({
  user: process.env.DB_USER || 'postgres.ugcrigkvfejqlsoqnxxh',
  host: process.env.DB_HOST || 'aws-0-us-east-2.pooler.supabase.com',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 6543,
  ssl: {
    rejectUnauthorized: false
  },
  // 🔧 CONFIGURACIONES ESPECÍFICAS PARA SCRAM
  application_name: 'restaurant_app',
  keepAlive: false,
  keepAliveInitialDelayMillis: 0,
  max: 5, // Menos conexiones para evitar problemas SCRAM
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
  query_timeout: 30000
});

// SOLUCIÓN 2: Pool con URL completa (más confiable)
const poolWithURL = new Pool({
  connectionString: `postgresql://${process.env.DB_USER || 'postgres.ugcrigkvfejqlsoqnxxh'}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'aws-0-us-east-2.pooler.supabase.com'}:${process.env.DB_PORT || '6543'}/${process.env.DB_NAME || 'postgres'}`,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  connectionTimeoutMillis: 15000
});

// SOLUCIÓN 3: Pool con configuración simplificada
const poolSimple = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: true, // SSL simplificado
  max: 2
});

async function testSolution(poolName, pool) {
  console.log(`🧪 Probando ${poolName}...`);
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp');
    console.log(`✅ ${poolName}: ¡FUNCIONA!`);
    console.log(`   Timestamp: ${result.rows[0].timestamp}`);
    return true;
  } catch (error) {
    console.log(`❌ ${poolName}: ${error.message}`);
    return false;
  } finally {
    if (client) client.release();
  }
}

async function testAllSolutions() {
  const solutions = [
    ['Solución 1 (Configuración con workaround)', poolWithFix],
    ['Solución 2 (URL completa)', poolWithURL],
    ['Solución 3 (Configuración simplificada)', poolSimple]
  ];

  for (const [name, pool] of solutions) {
    const success = await testSolution(name, pool);
    if (success) {
      console.log(`\n🎉 ¡${name} funciona!`);
      console.log('💡 Usa esta configuración en tu server.js');
      await pool.end();
      return;
    }
    await pool.end();
  }

  console.log('\n❌ Ninguna solución funcionó. Intentemos otras opciones...');
  await testAlternatives();
}

async function testAlternatives() {
  console.log('\n🔄 Probando configuraciones alternativas...');

  // ALTERNATIVA 1: Usar el host directo (no pooler)
  const directPool = new Pool({
    user: 'postgres',
    host: 'db.ugcrigkvfejqlsoqnxxh.supabase.co',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  const directSuccess = await testSolution('Host directo (no pooler)', directPool);
  await directPool.end();

  if (directSuccess) {
    console.log('\n💡 El host directo funciona. Actualiza tu .env:');
    console.log('DB_HOST=db.ugcrigkvfejqlsoqnxxh.supabase.co');
    console.log('DB_PORT=5432');
    console.log('DB_USER=postgres');
    return;
  }

  // ALTERNATIVA 2: Diferentes tipos de SSL
  const sslVariations = [
    { ssl: false }, // Sin SSL
    { ssl: { rejectUnauthorized: true } }, // SSL estricto
    { ssl: { require: true } } // SSL requerido
  ];

  for (const sslConfig of sslVariations) {
    const testPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT),
      ...sslConfig,
      max: 1
    });

    const success = await testSolution(`SSL: ${JSON.stringify(sslConfig.ssl)}`, testPool);
    await testPool.end();

    if (success) {
      console.log(`\n💡 Configuración SSL exitosa: ${JSON.stringify(sslConfig.ssl)}`);
      return;
    }
  }

  console.log('\n🤔 Todas las configuraciones fallaron. Posibles causas:');
  console.log('1. ❌ Contraseña incorrecta');
  console.log('2. ❌ Proyecto Supabase pausado/inactivo');
  console.log('3. ❌ Restricciones de IP en Supabase');
  console.log('4. ❌ Límites de conexión alcanzados');
}

async function showDiagnostics() {
  console.log('\n🔍 DIAGNÓSTICO ADICIONAL:');
  
  console.log('\n1. 🔐 Verificar contraseña:');
  console.log('   Ve a tu Dashboard Supabase → Settings → Database');
  console.log('   Haz click en "Reset database password"');
  console.log('   Copia la nueva contraseña a tu .env');
  
  console.log('\n2. 🌍 Verificar estado del proyecto:');
  console.log('   Ve a tu Dashboard Supabase');
  console.log('   Asegúrate que el proyecto esté "Active" (no "Paused")');
  
  console.log('\n3. 🛡️ Verificar configuración de seguridad:');
  console.log('   Ve a Authentication → Settings → Network');
  console.log('   Verifica que tu IP no esté bloqueada');
  
  console.log('\n4. 📊 Verificar límites:');
  console.log('   Ve a Settings → Billing → Usage');
  console.log('   Verifica que no hayas excedido límites');

  console.log('\n5. 🔗 Probar URL directa:');
  console.log('   Ve a Settings → Database → Connection String');
  console.log('   Copia la URL completa y úsala en DATABASE_URL');
}

async function main() {
  if (!process.env.DB_PASSWORD) {
    console.error('❌ DB_PASSWORD no configurado en .env');
    return;
  }

  console.log('🔑 Password configurado:', process.env.DB_PASSWORD.substring(0, 3) + '***');
  console.log('👤 Usuario:', process.env.DB_USER || 'postgres.ugcrigkvfejqlsoqnxxh');
  console.log('🌐 Host:', process.env.DB_HOST || 'aws-0-us-east-2.pooler.supabase.com');
  console.log('🔌 Puerto:', process.env.DB_PORT || '6543');
  console.log();

  await testAllSolutions();
  await showDiagnostics();
}

if (require.main === module) {
  main();
}