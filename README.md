# AppFitness - Aplicación de Entrenamiento Personal

Aplicación móvil para entrenadores personales y sus clientes. Permite gestionar rutinas de gimnasio y planes de dieta.

## 🎯 Características

### Para Entrenadores (Admin)
- Ver lista de todos los clientes
- Asignar dietas personalizadas a cada cliente
- Crear rutinas de ejercicios
- Gestionar comidas y ejercicios (agregar, editar, eliminar)

### Para Clientes
- Ver su dieta asignada
- Ver su rutina de ejercicios
- Consultar horarios de comidas
- Acceso móvil desde iOS y Android

## 📱 Tecnologías

- **Frontend**: React Native 0.76, Expo 52, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: MySQL (Railway)
- **Autenticación**: JWT (JSON Web Tokens)

## 📋 Requisitos

- Node.js v16 o superior
- npm o yarn
- Expo Go en tu dispositivo móvil o Android Studio con emulador
- Cuenta en Railway con base de datos MySQL

## 🚀 Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## ⚙️ Configuración

### 1. Base de Datos (Railway)

Edita `backend/.env` con tus credenciales de Railway:

```env
PORT=3000

# MySQL Railway Database
DB_HOST=monorail.proxy.rlwy.net
DB_PORT=37833
DB_USER=root
DB_PASSWORD=jQHAZGKYoSnracqrUpQbqxLfJhAbyIZP
DB_NAME=railway

# JWT Secret
JWT_SECRET=your-secret-key-change-this-in-production-12345
```

Las tablas se crean automáticamente al iniciar el servidor.

### 2. Frontend

Edita la URL de la API en `frontend/src/services/api.ts`:

```typescript
// Para emulador Android
const API_URL = 'http://10.0.2.2:3000/api';

// Para dispositivo físico (reemplaza con tu IP local)
const API_URL = 'http://192.168.1.X:3000/api';

// Para iOS Simulator
const API_URL = 'http://localhost:3000/api';
```

**Obtener tu IP local:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

## 🎮 Ejecución

### 1. Iniciar Backend

```bash
cd backend
npm start
```

El servidor iniciará en `http://localhost:3000`

### 2. Iniciar Frontend

En otra terminal:

```bash
cd frontend
npm start
```

### 3. Abrir en Dispositivo

**Opción A: Emulador Android**
1. Abre Android Studio y inicia un emulador
2. En la terminal de Expo, presiona `a`

**Opción B: Dispositivo Físico**
1. Instala Expo Go desde Play Store / App Store
2. Escanea el QR code
3. Asegúrate de estar en la misma red WiFi

## 👥 Usuarios

### Crear Cuenta de Entrenador (Admin)

Usa la app para registrarte como cliente, luego actualiza el rol directamente en la base de datos:

```sql
UPDATE users SET role = 'admin' WHERE email = 'tu-email@example.com';
```

O registra directamente un admin con herramientas como Postman:

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Entrenador",
  "email": "trainer@fitness.com",
  "password": "password123",
  "role": "admin"
}
```

### Crear Clientes

Los clientes se registran desde la app móvil o puedes crearlos como admin.

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere token)

### Clientes (Admin)
- `GET /api/clients` - Listar todos los clientes
- `GET /api/clients/:clientId` - Detalles de un cliente

### Dietas
- `GET /api/meals/:clientId` - Obtener comidas de un cliente
- `POST /api/meals` - Agregar comida (admin)
- `PUT /api/meals/:mealId` - Actualizar comida (admin)
- `DELETE /api/meals/:mealId` - Eliminar comida (admin)

### Rutinas
- `GET /api/exercises/:clientId` - Obtener ejercicios de un cliente
- `POST /api/exercises` - Agregar ejercicio (admin)
- `PUT /api/exercises/:exerciseId` - Actualizar ejercicio (admin)
- `DELETE /api/exercises/:exerciseId` - Eliminar ejercicio (admin)

## 🗄️ Estructura de Base de Datos

### Tabla `users`
```sql
id, name, email, password, role ('admin'|'client'), created_at
```

### Tabla `meals`
```sql
id, client_id, meal_name, meal_time, description, created_at
```

### Tabla `exercises`
```sql
id, client_id, exercise_name, sets, reps, notes, day, created_at
```

## 🔧 Solución de Problemas

### No se conecta al backend

1. **Verifica que el backend esté corriendo**
```bash
curl http://localhost:3000
```

2. **Dispositivo físico**: Cambia `localhost` por tu IP local en `api.ts`

3. **Emulador Android**: Usa `10.0.2.2` en lugar de `localhost`

4. **Firewall**: Asegúrate de que el puerto 3000 esté abierto

### Error de conexión a Railway

Si ves errores `PROTOCOL_CONNECTION_LOST`:

1. Verifica las credenciales en `.env`
2. Verifica que la base de datos esté activa en Railway
3. Railway puede tardar unos segundos en conectar (el servidor reintenta 3 veces)

### Error en npm start del frontend

Si falta `expo-asset`:
```bash
cd frontend
npm install expo-asset expo-font
```

## 📦 Compilar para Producción

### Android (APK/AAB)

```bash
cd frontend
npx eas build --platform android
```

### iOS (IPA)

```bash
cd frontend
npx eas build --platform ios
```

**Nota**: Necesitas una cuenta de Expo y configurar EAS Build.

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt
- Autenticación JWT con tokens de 30 días
- Middleware de autorización por rol
- CORS habilitado

**Importante**: Cambia `JWT_SECRET` en producción por un valor seguro.

## 📱 Capturas de Pantalla

La app incluye:
- ✅ Pantalla de login y registro
- ✅ Dashboard del entrenador con lista de clientes
- ✅ Pantalla de detalles del cliente
- ✅ Gestión de dietas (agregar/eliminar comidas)
- ✅ Gestión de rutinas (agregar/eliminar ejercicios)
- ✅ Vista del cliente con su dieta y rutina

## 🚀 Próximos Pasos

- [ ] Notificaciones push
- [ ] Subir imágenes de ejercicios
- [ ] Progreso y estadísticas del cliente
- [ ] Chat entre entrenador y cliente
- [ ] Calendario de entrenamientos

## 📄 Licencia

MIT
