# 📸 Sistema de Progreso - Guía de Configuración

## ✅ Implementación Completada

Se ha implementado exitosamente el sistema de progreso automático con las siguientes características:

### 🎯 Funcionalidades
- ✅ **Configuración de periodicidad por cliente** (cada X semanas, día específico)
- ✅ **Activación automática mediante cron job** (diariamente a las 6:00 AM)
- ✅ **Subida de 3 fotos** (frontal, lateral, espalda) + peso
- ✅ **Almacenamiento en Cloudinary** (optimizado automáticamente)
- ✅ **Historial completo** con todas las actualizaciones
- ✅ **Comparación de pesos** entre actualizaciones
- ✅ **Bloqueo automático** tras subir fotos

---

## 🚀 Pasos de Configuración

### 1. Crear Tablas en Railway

Ejecuta el siguiente SQL en tu Railway Dashboard:

```sql
-- Copiar y ejecutar el contenido de: backend/create_progress_tables.sql
```

### 2. Configurar Cloudinary (GRATIS)

1. Crear cuenta en [Cloudinary](https://cloudinary.com/users/register_free)
2. Ir al [Dashboard](https://cloudinary.com/console)
3. Copiar las credenciales:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

4. Añadir al archivo `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 3. Instalar Dependencias

#### Backend:
```bash
cd backend
npm install
```

Nuevos paquetes instalados:
- `cloudinary` - SDK para subir fotos
- `multer` - Manejo de uploads multipart
- `node-cron` - Cron jobs para activación automática

#### Frontend:
```bash
cd frontend
npm install
```

Nuevos paquetes instalados:
- `expo-image-picker` - Tomar/elegir fotos
- `@react-native-picker/picker` - Selector de opciones

### 4. Reiniciar Servidores

```bash
# Backend
cd backend
npm start

# Frontend (en otra terminal)
cd frontend
npm start
```

---

## 📋 Uso del Sistema

### **Admin (Entrenador)**

1. **Configurar Progreso:**
   - Dashboard → Click en cliente
   - "Ver Progreso"
   - Click en ⚙️ (Configuración)
   - Seleccionar frecuencia (ej: cada 2 semanas)
   - Seleccionar día (ej: Lunes)
   - Guardar

2. **Ver Historial:**
   - Dashboard → Cliente → "Ver Progreso"
   - Ver todas las actualizaciones con fotos y peso
   - Comparar evolución automática

### **Cliente**

1. **Cuando está activo:**
   - Tab "Progreso" → Formulario activo
   - Introducir peso
   - Tomar/seleccionar 3 fotos
   - "Guardar Progreso"
   - Se bloquea automáticamente

2. **Cuando está bloqueado:**
   - Ver mensaje: "Progreso bloqueado"
   - Ver fecha de próxima actualización
   - Ver historial completo

---

## 🤖 Cron Job Automático

El sistema ejecuta diariamente a las **6:00 AM**:

```typescript
// backend/src/cron/progressCron.ts
cron.schedule('0 6 * * *', async () => {
  // 1. Buscar clientes con next_due_date <= HOY
  // 2. Crear registro en active_progress
  // 3. Calcular próxima fecha (hoy + frequency_weeks)
  // 4. Actualizar next_due_date
});
```

**Logs en consola:**
```
⏰ Cron job de progreso configurado
🔄 [CRON] Verificando progresos pendientes...
✅ [CRON] Progreso activado para Juan (ID: 5)
   Próxima fecha: 2026-01-25
```

---

## 📊 Estructura de Base de Datos

### `progress_settings`
- `client_id` - Cliente único
- `frequency_weeks` - Cada cuántas semanas (1, 2, 3...)
- `day_of_week` - Día específico (monday, tuesday...)
- `next_due_date` - Próxima fecha calculada
- `is_enabled` - Sistema activo/inactivo

### `progress_updates`
- `client_id` - Cliente
- `weight` - Peso en kg
- `front_photo_url` - URL de Cloudinary
- `side_photo_url` - URL de Cloudinary
- `back_photo_url` - URL de Cloudinary
- `created_at` - Fecha de actualización

### `active_progress`
- `client_id` - Único (solo 1 activo por cliente)
- `activated_at` - Cuándo se activó

---

## 🎨 UI/UX

### ClientProgressScreen (Cliente)
- **Activo**: Formulario con 3 botones de foto + input peso
- **Bloqueado**: Mensaje + próxima fecha + historial
- **Historial**: Cards con fotos en grid + peso + fecha

### ProgressHistoryScreen (Admin)
- **Config Card**: Muestra configuración actual + botón editar
- **Historial**: Cards con fotos grandes + diferencia de peso
- **Modal**: Configurar frecuencia y día

---

## 🔒 Seguridad

- ✅ Todas las rutas requieren autenticación JWT
- ✅ Fotos subidas a carpeta privada en Cloudinary
- ✅ Límite de 5MB por foto
- ✅ Validación de progreso activo antes de subir
- ✅ Solo el cliente puede subir su progreso
- ✅ Admin puede ver progreso de cualquier cliente

---

## 🌐 Almacenamiento en Cloudinary

### Ventajas:
- ✅ **10GB gratis** de almacenamiento
- ✅ **25,000 transformaciones/mes** gratis
- ✅ Optimización automática de imágenes
- ✅ CDN global (carga rápida)
- ✅ URLs permanentes y seguras

### Organización:
```
appfitness/
  progress/
    {clientId}/
      {timestamp}_front.jpg
      {timestamp}_side.jpg
      {timestamp}_back.jpg
```

### Optimización automática:
- Redimensionado: máx 800x1000px
- Calidad: auto (best compression)
- Formato: auto (WebP cuando sea posible)

---

## 🐛 Troubleshooting

### Cron no se ejecuta
```bash
# Verificar logs del backend al iniciar
⏰ Cron job de progreso configurado
```

### Fotos no se suben
1. Verificar credenciales de Cloudinary en `.env`
2. Verificar límite de tamaño (5MB)
3. Ver logs del backend: `📤 Subiendo fotos a Cloudinary...`

### Cliente no puede subir
1. Verificar que exista progreso activo en DB:
```sql
SELECT * FROM active_progress WHERE client_id = X;
```
2. Verificar configuración del cliente:
```sql
SELECT * FROM progress_settings WHERE client_id = X;
```

---

## 📱 Permisos de la App

El sistema solicitará automáticamente:
- ✅ Acceso a la cámara (para tomar fotos)
- ✅ Acceso a la galería (para elegir fotos)

---

## 🎯 Próximas Mejoras (Opcional)

- [ ] Notificaciones push cuando se activa progreso
- [ ] Gráficas de evolución de peso
- [ ] Comparación lado a lado de 2 actualizaciones
- [ ] Medidas corporales (pecho, cintura, brazo, etc.)
- [ ] Exportar progreso a PDF
- [ ] Comentarios del entrenador en cada actualización

---

## ✅ Testing

### Admin:
1. Ir a cliente
2. Click "Ver Progreso"
3. Configurar: "Cada 1 semana, Lunes"
4. Si hoy es antes del próximo lunes, activar manualmente (POST /api/progress/activate/:clientId)

### Cliente:
1. Tab "Progreso"
2. Subir 3 fotos + peso
3. Verificar que se bloquea
4. Ver historial con la actualización

---

**Fecha de implementación:** Enero 2026  
**Estado:** ✅ Completado y listo para producción
