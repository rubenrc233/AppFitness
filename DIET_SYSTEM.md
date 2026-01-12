# Sistema de Dietas - AppFitness

## Resumen del Cambio

Se ha reestructurado completamente el sistema de dietas para seguir la misma lógica que las rutinas de ejercicios:

### Estructura Anterior:
- Tabla `meals` con comidas individuales por cliente
- Información básica: nombre, hora, descripción

### Nueva Estructura:
- **1 Dieta por cliente** (`diets`)
- **X Comidas diarias** por dieta (`diet_meals`): Desayuno, Almuerzo, Cena, etc.
- **2-3 Opciones** por comida (`meal_options`): El cliente puede elegir entre diferentes alternativas
- **Alimentos con cantidad** en cada opción (`option_foods`): Lista de alimentos con gramos o unidades
- **Biblioteca de alimentos** (`food_library`): 25+ categorías predefinidas + opción custom

## Estructura de Base de Datos

```sql
diets (id, client_id, name, created_at, updated_at)
  ↓
diet_meals (id, diet_id, meal_number, meal_name, meal_time, notes)
  ↓
meal_options (id, diet_meal_id, option_number, name)
  ↓
option_foods (id, meal_option_id, food_id, quantity, unit, notes, order_index)
  ↓
food_library (id, name, category, is_custom)
```

## Alimentos Predefinidos

### Categorías:
- **Verduras**: Verdura, Ensalada, Legumbres
- **Carnes**: Pollo, Pavo, Ternera, Cerdo
- **Pescados**: Pescado Blanco, Pescado Azul, Marisco
- **Proteínas**: Huevos
- **Lácteos**: Yogur, Queso, Leche
- **Carbohidratos**: Arroz, Pasta, Pan, Patata, Avena
- **Frutas**: Fruta, Frutos Secos
- **Grasas**: Aceite de Oliva, Aguacate
- **Suplementos**: Proteína en Polvo

### Alimentos Custom:
El admin puede crear alimentos personalizados con nombre y categoría libre.

## Unidades de Medida

Cada alimento puede especificarse en:
- **Gramos**: Para alimentos que se pesan (ej: 150g de pollo)
- **Unidades**: Para alimentos que se cuentan (ej: 2 huevos)

## Archivos Creados/Modificados

### Backend:
1. **`backend/create_diet_tables.sql`** - Script SQL para crear tablas
2. **`backend/populate_foods.sql`** - Script SQL con alimentos predefinidos
3. **`backend/src/routes/diets.ts`** - API endpoints para dietas
4. **`backend/src/setup-diets.ts`** - Script de migración automatizada
5. **`backend/src/index.ts`** - Añadido import de rutas de dietas
6. **`backend/package.json`** - Añadido script `setup-diets`

### Frontend:
1. **`frontend/src/types/index.ts`** - Añadidos tipos: Diet, DietMeal, MealOption, OptionFood, FoodItem
2. **`frontend/src/services/api.ts`** - Añadido `dietService` con todos los endpoints
3. **`frontend/src/screens/DietManagementScreen.tsx`** - Pantalla de gestión para admin (1200+ líneas)
4. **`frontend/src/screens/ClientDietScreen.tsx`** - Reescrita completamente para mostrar nueva estructura
5. **`frontend/src/screens/ClientDetailsScreen.tsx`** - Añadido botón "Gestionar Dieta"
6. **`frontend/App.tsx`** - Añadida ruta DietManagementScreen

### Estética:
- **Minimalista y profesional**: Fondo #0D0D0D, tarjetas #1A1A1A, bordes #333
- **Sin gradientes ni iconos excesivos**: Eliminados colores naranjas/amarillos
- **Consistencia**: Todas las pantallas (Dieta, Ejercicio, Progreso) usan la misma paleta

## Instrucciones de Configuración

### 1. Ejecutar Migración de Base de Datos

Desde el directorio `backend`:

```bash
npm run setup-diets
```

Este script:
- Crea las 5 tablas nuevas (diets, diet_meals, meal_options, option_foods, food_library)
- Crea índices para optimizar consultas
- Puebla la biblioteca con 25+ alimentos predefinidos

### 2. Iniciar Backend

```bash
cd backend
npm start
```

El servidor debe estar corriendo en `http://localhost:3000`

### 3. Iniciar Frontend

```bash
cd frontend
npm start
```

Luego presiona `a` para abrir en Android emulator.

## Uso del Sistema

### Como Admin:

1. **Ir a Cliente** → Hacer clic en un cliente
2. **Gestionar Dieta** → Abre pantalla de gestión de dietas
3. **Crear Comidas** → Añadir "Desayuno", "Almuerzo", "Cena", etc.
4. **Añadir Opciones** → Para cada comida, crear 2-3 opciones (Opción A, B, C)
5. **Añadir Alimentos** → En cada opción, seleccionar alimentos de la biblioteca
6. **Especificar Cantidad** → Gramos o unidades para cada alimento
7. **Alimento Custom** (opcional) → Crear alimentos personalizados si es necesario

### Como Cliente:

1. **Ir a pestaña Dieta** → Ver todas las comidas del día
2. **Expandir comida** → Click para ver las opciones disponibles
3. **Ver alimentos** → Cada opción muestra los alimentos con cantidades

## API Endpoints

### Food Library
- `GET /api/diets/foods` - Obtener biblioteca de alimentos
- `POST /api/diets/foods` - Crear alimento custom

### Diets
- `GET /api/diets/:clientId` - Obtener dieta del cliente (crea una si no existe)
- `PUT /api/diets/:dietId` - Actualizar nombre de dieta

### Diet Meals
- `POST /api/diets/meals/:dietId` - Crear comida
- `PUT /api/diets/meals/:mealId` - Actualizar comida
- `DELETE /api/diets/meals/:mealId` - Eliminar comida
- `GET /api/diets/meals/:mealId/options` - Obtener opciones de comida

### Meal Options
- `POST /api/diets/options/:mealId` - Crear opción (máx 3)
- `PUT /api/diets/options/:optionId` - Actualizar opción
- `DELETE /api/diets/options/:optionId` - Eliminar opción
- `GET /api/diets/options/:optionId/foods` - Obtener alimentos de opción

### Option Foods
- `POST /api/diets/foods/:optionId` - Añadir alimento a opción
- `PUT /api/diets/foods/:foodId` - Actualizar alimento
- `DELETE /api/diets/foods/:foodId` - Eliminar alimento

## Ejemplo de Flujo

**Admin crea dieta para Juan:**

1. Comida 1: "Desayuno" (08:00)
   - Opción A:
     * Avena: 60g
     * Leche: 200ml (200g)
     * Fruta: 150g
   - Opción B:
     * Huevos: 3 unidades
     * Pan: 80g
     * Aguacate: 50g

2. Comida 2: "Almuerzo" (14:00)
   - Opción A:
     * Pollo: 200g
     * Arroz: 100g
     * Verdura: 150g
   - Opción B:
     * Pescado Blanco: 250g
     * Patata: 150g
     * Ensalada: 100g

**Cliente Juan ve su dieta:**

- Ve "Desayuno" y "Almuerzo"
- Puede expandir cada comida
- Ve las 2 opciones con todos los alimentos y cantidades
- Puede elegir qué opción hacer cada día

## Ventajas del Nuevo Sistema

1. ✅ **Flexibilidad**: El cliente tiene opciones para variar su dieta
2. ✅ **Precisión**: Cantidades exactas en gramos o unidades
3. ✅ **Escalabilidad**: Fácil añadir más comidas u opciones
4. ✅ **Organización**: Toda la info estructurada por comida/opción
5. ✅ **Biblioteca**: No hay que escribir "Pollo" 100 veces, se selecciona de lista
6. ✅ **Custom**: Alimentos personalizados cuando se necesite algo específico

## Próximos Pasos (Opcional)

- Añadir información nutricional (calorías, macros) a cada alimento
- Calcular totales nutricionales por opción/comida/día
- Permitir duplicar opciones entre comidas
- Historial de cambios en la dieta
- Notificaciones para recordar comidas

## Notas Técnicas

- **Relaciones CASCADE**: Al eliminar comida, se eliminan opciones y alimentos
- **order_index**: Los alimentos se ordenan en el orden que se añadieron
- **option_number**: Numeración automática (1, 2, 3)
- **meal_number**: Numeración automática para comidas
- **Índices**: Optimización en foreign keys y categorías

---

**Fecha**: 11 de enero de 2026  
**Sistema**: AppFitness Mobile App  
**Stack**: React Native + Express + MySQL
