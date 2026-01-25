# Sistema de Pagos - AppFitness

## Descripción

Sistema completo de control económico para gestionar las cuotas de los clientes. Permite configurar pagos periódicos (mensual, trimestral, semestral o anual), registrar pagos y mantener un histórico completo de transacciones.

## Características

### 1. Configuración de Cuotas
- Definir cantidad a pagar por cada cliente
- Establecer periodicidad: mensual, trimestral, semestral o anual
- El sistema calcula automáticamente la próxima fecha de pago
- Configuración desde ClientDetailsScreen

### 2. Indicadores Visuales en AdminDashboard
- **Aviso de próximo pago**: Muestra cuántos días faltan para el siguiente pago
- **Indicador de pago pendiente**: Botón verde de efectivo cuando el pago está vencido
- **Registro rápido**: Click en el botón para registrar el pago instantáneamente

### 3. Histórico de Pagos (PaymentHistoryScreen)
- Vista completa de todos los pagos realizados
- Total ingresado destacado en la parte superior
- Filtros disponibles:
  - Por cliente
  - Por mes
  - Por año
- Detalles de cada pago:
  - Cantidad
  - Fecha de pago
  - Período cubierto
  - Frecuencia
  - Notas adicionales

## Instalación

### 1. Crear las tablas de base de datos

Opción A - Script TypeScript (recomendado):
```bash
cd backend
npm run ts-node src/setup-payments.ts
```

Opción B - SQL directo:
```bash
# Ejecutar el archivo SQL en tu base de datos
psql -h [host] -U [usuario] -d [database] -f backend/create_payment_tables.sql
```

### 2. Verificar la instalación

El sistema creará dos tablas:
- `payment_config`: Configuración de cuotas por cliente
- `payment_history`: Histórico de todos los pagos

## Uso

### Para el Admin

1. **Configurar el sistema de pagos de un cliente**:
   - Ir a Detalles del Cliente
   - Seleccionar "Sistema de Pagos"
   - Ingresar la cantidad y seleccionar la frecuencia
   - Guardar (esto registrará el primer pago automáticamente)

2. **Ver clientes con pagos pendientes**:
   - En AdminDashboard, los clientes con pagos vencidos mostrarán un botón verde 💰
   - Los próximos pagos se muestran con emoji 💰 y días restantes

3. **Registrar un pago**:
   - Click en el botón verde de efectivo junto al nombre del cliente
   - Confirmar el pago
   - El sistema actualizará automáticamente la próxima fecha de pago

4. **Ver histórico de pagos**:
   - Click en el icono de cartera (wallet) en el header de AdminDashboard
   - Ver total ingresado y lista completa de pagos
   - Aplicar filtros según necesites

## API Endpoints

### POST `/api/payments/config`
Configurar o actualizar el sistema de pagos de un cliente.
```json
{
  "userId": 1,
  "amount": 50.00,
  "frequency": "monthly",
  "startDate": "2026-02-15" // Fecha del primer pago - REQUERIDO
}
```

**Comportamiento de la fecha de inicio:**
- Si `startDate` es una fecha futura, el sistema NO registra ningún pago automático. El primer cobro será en la fecha indicada.
- Si `startDate` es hoy o una fecha pasada, se registra el pago inicial automáticamente.
- Esto permite configurar cuotas que empiecen el día que elijas del mes siguiente (o período correspondiente).

### GET `/api/payments/config/:userId`
Obtener la configuración de pago de un cliente.

### GET `/api/payments/clients-status`
Obtener todos los clientes con su estado de pago (usado en AdminDashboard).

### POST `/api/payments/register`
Registrar un pago realizado.
```json
{
  "userId": 1,
  "paymentDate": "2026-01-23" // opcional, por defecto hoy
}
```

### GET `/api/payments/history`
Obtener histórico de pagos con filtros opcionales.
Query params: `userId`, `month`, `year`, `startDate`, `endDate`

### GET `/api/payments/stats`
Obtener estadísticas de pagos.
Query param: `year` (opcional, por defecto año actual)

### DELETE `/api/payments/config/:userId`
Desactivar el sistema de pagos de un cliente.

## Estructura de Datos

### payment_config
```
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK a users)
- amount: DECIMAL(10, 2)
- frequency: VARCHAR(20) [monthly, quarterly, biannual, annual]
- start_date: DATE
- next_payment_date: DATE
- active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### payment_history
```
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK a users)
- amount: DECIMAL(10, 2)
- payment_date: DATE
- period_start: DATE
- period_end: DATE
- frequency: VARCHAR(20)
- notes: TEXT
- created_at: TIMESTAMP
```

## Notas Importantes

1. **Fecha de inicio personalizable**: Cuando se configura el sistema de pagos, puedes elegir la fecha exacta del primer cobro. Por ejemplo:
   - Si configuras un pago mensual y eliges el día 15 del próximo mes, el primer cobro será ese día
   - Si configuras un pago trimestral y eliges una fecha dentro de 3 meses, el primer cobro será en esa fecha
   - El sistema solo registra un pago inicial si la fecha de inicio es hoy o pasada

2. **Cálculo de próxima fecha**: El sistema calcula automáticamente la próxima fecha de pago basándose en la frecuencia:
   - Monthly: +1 mes desde la fecha de inicio
   - Quarterly: +3 meses desde la fecha de inicio
   - Biannual: +6 meses desde la fecha de inicio  
   - Annual: +1 año desde la fecha de inicio

3. **Indicadores en tiempo real**: Los indicadores se actualizan basándose en la fecha actual vs. la próxima fecha de pago configurada.

4. **Histórico inmutable**: Los pagos registrados en el histórico no se pueden eliminar, solo consultar. Esto garantiza la integridad de los registros financieros.

## Funcionalidades Futuras (Posibles Mejoras)

- Exportar histórico a PDF/Excel
- Envío de recordatorios automáticos por email
- Dashboard de estadísticas más detallado
- Gráficos de ingresos por mes/año
- Configuración de descuentos o promociones
- Sistema de pagos parciales
- Integración con pasarelas de pago
