# Instrucciones para Base de Datos

## Crear Usuario Admin de Prueba

Después de registrarte en la app, ejecuta este SQL en Railway para convertir tu usuario en admin:

```sql
-- Ver todos los usuarios
SELECT id, name, email, role FROM users;

-- Cambiar un usuario a admin
UPDATE users SET role = 'admin' WHERE email = 'tu-email@example.com';

-- Verificar el cambio
SELECT id, name, email, role FROM users WHERE email = 'tu-email@example.com';
```

## Crear Usuario Admin Directamente

Si prefieres crear un admin directamente en la base de datos:

```sql
-- La contraseña debe hashearse con bcrypt
-- Puedes usar la API para registrar un admin:
```

### Usando la API (Postman/cURL):

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Entrenador Principal",
  "email": "trainer@fitness.com",
  "password": "password123",
  "role": "admin"
}
```

O con cURL:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Entrenador","email":"trainer@fitness.com","password":"password123","role":"admin"}'
```

## Datos de Ejemplo

### Crear Cliente de Prueba

```sql
-- Primero registra el cliente desde la app o API
-- Luego puedes agregar comidas y ejercicios de ejemplo
```

### Agregar Comidas de Ejemplo (después de tener un cliente)

```sql
-- Reemplaza 1 con el ID de tu cliente
INSERT INTO meals (client_id, meal_name, meal_time, description) VALUES
(1, 'Avena con frutas', 'Desayuno', '200g avena, 1 plátano, fresas'),
(1, 'Pechuga de pollo con arroz', 'Almuerzo', '200g pollo, 150g arroz integral'),
(1, 'Ensalada de atún', 'Cena', 'Atún, lechuga, tomate, aceite de oliva');
```

### Agregar Ejercicios de Ejemplo

```sql
-- Reemplaza 1 con el ID de tu cliente
INSERT INTO exercises (client_id, exercise_name, sets, reps, notes, day) VALUES
(1, 'Press de banca', 4, 10, 'Descanso 90 segundos', 'Lunes'),
(1, 'Sentadillas', 4, 12, 'Mantener espalda recta', 'Lunes'),
(1, 'Peso muerto', 3, 8, 'Peso moderado', 'Miércoles'),
(1, 'Dominadas', 3, 8, 'Agarre ancho', 'Miércoles'),
(1, 'Press militar', 3, 10, '', 'Viernes'),
(1, 'Curl de bíceps', 3, 12, '', 'Viernes');
```

## Verificar Datos

```sql
-- Ver todos los usuarios
SELECT * FROM users;

-- Ver comidas de un cliente
SELECT * FROM meals WHERE client_id = 1;

-- Ver ejercicios de un cliente
SELECT * FROM exercises WHERE client_id = 1;

-- Ver todo junto
SELECT 
    u.name as cliente,
    m.meal_name as comida,
    e.exercise_name as ejercicio
FROM users u
LEFT JOIN meals m ON u.id = m.client_id
LEFT JOIN exercises e ON u.id = e.client_id
WHERE u.role = 'client';
```

## Limpiar Datos

```sql
-- Eliminar todas las comidas
DELETE FROM meals;

-- Eliminar todos los ejercicios
DELETE FROM exercises;

-- Eliminar un cliente específico (esto eliminará sus comidas y ejercicios por CASCADE)
DELETE FROM users WHERE id = 1;

-- CUIDADO: Esto eliminará TODOS los usuarios
-- DELETE FROM users;
```

## Backup

Antes de hacer cambios importantes, haz un backup:

```bash
# Desde Railway, usa su herramienta de backup
# O exporta manualmente las tablas
```

## Notas de Seguridad

- **NUNCA** guardes contraseñas en texto plano
- Las contraseñas en la app se hashean automáticamente con bcrypt
- Cambia el `JWT_SECRET` en producción
- Usa HTTPS en producción
- Limita las conexiones a la base de datos desde IPs conocidas
