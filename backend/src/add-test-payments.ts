import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addTestPayments() {
  console.log('🔄 Conectando a la base de datos...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000,
    });

    console.log('✅ Conectado a la base de datos\n');

    // Buscar el usuario "charro" o similar
    console.log('🔍 Buscando usuarios...');
    const [users] = await connection.query(
      `SELECT id, name, email FROM users WHERE role = 'client' ORDER BY id`
    );
    
    console.log('📋 Usuarios encontrados:');
    console.table(users);

    if (!Array.isArray(users) || users.length === 0) {
      console.log('❌ No se encontraron clientes');
      await connection.end();
      return;
    }

    // Buscar al cliente "charro" por nombre o usar el primero
    let targetUser: any = (users as any[]).find(u => 
      u.name.toLowerCase().includes('charro') || 
      u.email.toLowerCase().includes('charro')
    );

    if (!targetUser) {
      console.log('⚠️  No se encontró usuario "charro", usando el primer cliente disponible');
      targetUser = (users as any[])[0];
    }

    console.log(`\n🎯 Usuario seleccionado: ${targetUser.name} (ID: ${targetUser.id})`);

    // Verificar si ya tiene configuración de pagos
    const [existingConfig] = await connection.query(
      'SELECT * FROM payment_config WHERE user_id = ?',
      [targetUser.id]
    );

    const paymentAmount = 50.00;
    const frequency = 'monthly';

    if (!Array.isArray(existingConfig) || existingConfig.length === 0) {
      // Crear configuración de pagos
      console.log('\n📝 Creando configuración de pagos...');
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      
      await connection.query(
        `INSERT INTO payment_config (user_id, amount, frequency, start_date, next_payment_date)
         VALUES (?, ?, ?, CURDATE(), ?)`,
        [targetUser.id, paymentAmount, frequency, nextPaymentDate]
      );
      console.log('✅ Configuración de pagos creada');
    } else {
      console.log('\n✅ Ya existe configuración de pagos');
    }

    // Eliminar pagos existentes para empezar limpio
    console.log('\n🗑️  Limpiando pagos anteriores...');
    await connection.query(
      'DELETE FROM payment_history WHERE user_id = ?',
      [targetUser.id]
    );

    // Crear 6 pagos históricos (últimos 6 meses)
    console.log('\n💰 Insertando historial de pagos de prueba...');
    
    const payments = [
      { monthsAgo: 6, notes: 'Pago mensual - Septiembre 2025' },
      { monthsAgo: 5, notes: 'Pago mensual - Octubre 2025' },
      { monthsAgo: 4, notes: 'Pago mensual - Noviembre 2025' },
      { monthsAgo: 3, notes: 'Pago mensual - Diciembre 2025' },
      { monthsAgo: 2, notes: 'Pago mensual - Enero 2026' },
      { monthsAgo: 1, notes: null }, // Pago más reciente sin notas
    ];

    for (const payment of payments) {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() - payment.monthsAgo);
      paymentDate.setDate(1); // Primer día del mes
      
      const periodStart = new Date(paymentDate);
      const periodEnd = new Date(paymentDate);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0); // Último día del período
      
      await connection.query(
        `INSERT INTO payment_history (user_id, amount, payment_date, period_start, period_end, frequency, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          targetUser.id,
          paymentAmount,
          paymentDate.toISOString().split('T')[0],
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0],
          frequency,
          payment.notes
        ]
      );
      
      console.log(`  ✅ Pago registrado: ${paymentDate.toISOString().split('T')[0]} - €${paymentAmount}`);
    }

    // Mostrar el historial final
    console.log('\n📋 Historial de pagos insertado:');
    const [history] = await connection.query(
      `SELECT id, amount, payment_date, period_start, period_end, notes 
       FROM payment_history 
       WHERE user_id = ? 
       ORDER BY payment_date DESC`,
      [targetUser.id]
    );
    console.table(history);

    await connection.end();
    
    console.log('\n✅ ¡Pagos de prueba agregados exitosamente!');
    console.log(`📊 Se agregaron 6 pagos para el cliente "${targetUser.name}"`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTestPayments();
