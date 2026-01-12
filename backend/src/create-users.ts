import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createUsers() {
  console.log('🔄 Conectando a Railway MySQL...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });

    console.log('✅ Conectado a Railway MySQL\n');

    // Hash de contraseñas
    console.log('🔐 Generando contraseñas seguras...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('cliente123', 10);

    // Crear usuario Admin
    console.log('👤 Creando usuario Admin...');
    try {
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin Entrenador', 'admin@appfitness.com', adminPassword, 'admin']
      );
      console.log('✅ Admin creado - Email: admin@appfitness.com | Password: admin123');
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠️  Admin ya existe');
      } else {
        throw error;
      }
    }

    // Crear usuario Cliente
    console.log('👤 Creando usuario Cliente...');
    try {
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Cliente Test', 'cliente@test.com', clientPassword, 'client']
      );
      console.log('✅ Cliente creado - Email: cliente@test.com | Password: cliente123');
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠️  Cliente ya existe');
      } else {
        throw error;
      }
    }

    // Mostrar todos los usuarios
    console.log('\n📋 Usuarios en la base de datos:');
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.table(users);

    await connection.end();
    
    console.log('\n✅ Usuarios creados exitosamente!');
    console.log('\n🎯 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 ADMIN (Entrenador):');
    console.log('   Email: admin@appfitness.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 CLIENTE:');
    console.log('   Email: cliente@test.com');
    console.log('   Password: cliente123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Ahora puedes iniciar la app!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();
