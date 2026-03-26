-- =====================================================
-- BACKUP COMPLETO DE RUTINA - Adrian Estrada
-- Generado: 2026-03-26T16:13:46.418Z
-- Client ID: 5
-- =====================================================
-- INSTRUCCIONES: Ejecutar este script si se borran los datos
-- El script restaura la rutina, días, ejercicios y logs
-- =====================================================

-- === PASO 1: Eliminar datos existentes (si los hay) para evitar duplicados ===
DELETE FROM routines WHERE client_id = 5;

-- === PASO 2: Restaurar rutina ===
INSERT INTO routines (id, client_id, name, created_at, updated_at) VALUES (19, 5, 'Hipertrofia', '2026-03-24 22:33:57', '2026-03-24 22:33:57');

-- === PASO 3: Restaurar días de rutina ===
INSERT INTO routine_days (id, routine_id, day_number, weekday, name, custom_name, notes, created_at, updated_at) VALUES (58, 19, 1, 0, 'TIRONES', 'TIRONES', NULL, '2026-03-24 22:33:57', '2026-03-26 11:31:22');
INSERT INTO routine_days (id, routine_id, day_number, weekday, name, custom_name, notes, created_at, updated_at) VALUES (59, 19, 2, 1, 'Día 2', 'POCU PATA', NULL, '2026-03-24 22:33:57', '2026-03-26 11:20:53');
INSERT INTO routine_days (id, routine_id, day_number, weekday, name, custom_name, notes, created_at, updated_at) VALUES (60, 19, 3, 2, 'Día 3', 'EMPUJES', NULL, '2026-03-24 22:33:57', '2026-03-26 11:20:46');
INSERT INTO routine_days (id, routine_id, day_number, weekday, name, custom_name, notes, created_at, updated_at) VALUES (61, 19, 4, 3, 'Día 4', 'OTRO POCU PATA', NULL, '2026-03-24 22:33:57', '2026-03-26 11:21:11');
INSERT INTO routine_days (id, routine_id, day_number, weekday, name, custom_name, notes, created_at, updated_at) VALUES (62, 19, 5, 4, 'Día 5', 'TREN SUPERIOR', NULL, '2026-03-24 22:33:57', '2026-03-26 11:21:21');

-- === PASO 4: Restaurar ejercicios por día ===
-- Formato: (id, routine_day_id, exercise_id, sets, reps, notes, order_index)
-- --- TIRONES (day_id=58) ---
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (117, 58, 10, 3, '2x6-8 + 1x8-10', 'Cuidado con la espalda y el peso', 0, '2026-03-26 11:30:40'); -- Remo con Barra (espalda)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (116, 58, 12, 3, '8-10', 'Agarre a la anchura de los hombros ', 1, '2026-03-26 11:30:28'); -- Jalones al Pecho (espalda)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (118, 58, 51, 2, '8-10', 'Controla el giro del cuerpo', 2, '2026-03-26 11:31:29'); -- Remo unilateral en polea baja (espalda)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (119, 58, 15, 3, '10-12', NULL, 3, '2026-03-26 11:32:46'); -- Face Pulls (espalda)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (120, 58, 29, 3, '8-10', 'Cuidado con el balanceo', 4, '2026-03-26 11:32:54'); -- Curl con Barra Z (biceps)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (122, 58, 52, 2, '10-12', NULL, 5, '2026-03-26 11:34:21'); -- Curl en Bando Inclinado (biceps)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (127, 58, 53, 3, '12-15', 'Con kettlebell o mancuerna', 6, '2026-03-26 11:36:30'); -- Side Bend con Peso (abdomen)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (128, 58, 39, 3, '10-12', 'Sin levantar lumbar del suelo, puedes hacerlo con peso', 7, '2026-03-26 11:36:59'); -- Crunch Abdominal (abdomen)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (123, 58, 44, 1, '20-30\'', 'Andar con inclinación ', 8, '2026-03-26 11:35:04'); -- Carrera Continua (cardio)
-- --- POCU PATA (day_id=59) ---
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (131, 59, 40, 3, '30"', NULL, 0, '2026-03-26 11:43:15'); -- Plancha Frontal (abdomen)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (132, 59, 43, 3, '20-20"', NULL, 1, '2026-03-26 11:43:16'); -- Plancha Lateral (abdomen)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (133, 59, 17, 3, '6-8', NULL, 2, '2026-03-26 11:43:52'); -- Prensa de Piernas (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (134, 59, 22, 3, '8-10', 'Máquina o barra', 3, '2026-03-26 11:43:55'); -- Hip Thrust (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (136, 59, 55, 3, '8-10', 'Con empeine sobre banco', 5, '2026-03-26 11:44:43'); -- Sentadilla Búlgara (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (137, 59, 21, 3, '2x8-10 + DS', 'Haz la bajada lenta', 6, '2026-03-26 11:44:57'); -- Extensión de Cuádriceps (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (138, 59, 20, 3, '2x8-10 + DS', 'Haz la bajada lenta', 7, '2026-03-26 11:44:57'); -- Curl Femoral (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (139, 59, 56, 3, '10-15', NULL, 8, '2026-03-26 11:45:41'); -- Elevaciones de Gemelo (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (140, 59, 44, 1, '20-30\'', 'Ya sabes', 9, '2026-03-26 11:46:04'); -- Carrera Continua (cardio)
-- --- EMPUJES (day_id=60) ---
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (108, 60, 1, 3, '2x6-8 + 1x10', 'Baja bien hasta el pecho', 0, '2026-03-25 17:47:07'); -- Press Banca Plano (pecho)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (109, 60, 2, 3, '8-10', 'Con mancuernas, acuérdate lo de los codos', 1, '2026-03-25 17:47:09'); -- Press Banca Inclinado (pecho)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (110, 60, 26, 3, '10-8-6', 'En biserie con laterales', 3, '2026-03-25 17:47:17'); -- Elevaciones Frontales (hombros)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (111, 60, 25, 3, '10-8-6', 'En biserie con frontales y sin subir más allá del hombro', 4, '2026-03-25 17:47:21'); -- Elevaciones Laterales (hombros)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (113, 60, 50, 3, '6-10', NULL, 5, '2026-03-26 11:22:45'); -- Skullcrushers (triceps)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (112, 60, 36, 2, '10-12', 'Con cuerda o barra en V', 6, '2026-03-25 17:47:31'); -- Extensiones en Polea (triceps)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (129, 60, 54, 3, '8-12', 'Evita el balanceo', 7, '2026-03-26 11:38:49'); -- Elevación de Piernas Colgado (abdomen)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (130, 60, 42, 3, '8-12', 'Lleva codos a rodillas', 8, '2026-03-26 11:39:01'); -- Bicicleta Abdominal (abdomen)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (114, 60, 44, 1, '20-30\'', 'Como siempre', 9, '2026-03-26 11:23:27'); -- Carrera Continua (cardio)
-- --- OTRO POCU PATA (day_id=61) ---
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (143, 61, 19, 2, '8-10', NULL, 0, '2026-03-26 11:59:00'); -- Zancadas con Mancuernas (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (142, 61, 18, 3, '8-10', 'Unilat con mancuernas, cuidado con la técnica, poco a poco con el peso', 1, '2026-03-26 11:58:57'); -- Peso Muerto Rumano (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (145, 61, 57, 3, '10-12', NULL, 2, '2026-03-26 11:59:49'); -- Abducción de Cadera en Máquina (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (148, 61, 56, 3, '8-10', 'Unilateral', 3, '2026-03-26 12:02:25'); -- Elevaciones de Gemelo (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (146, 61, 58, 3, '20-30" arriba', NULL, 4, '2026-03-26 12:00:45'); -- Plancha Copenhague (piernas)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (149, 61, 59, 3, '10-12', 'SIN PESO', 5, '2026-03-26 12:04:05'); -- Hiper Extensión de Columna (abdomen)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (147, 61, 44, 1, '20-30\'', 'Yatusabe', 6, '2026-03-26 12:01:01'); -- Carrera Continua (cardio)
-- --- TREN SUPERIOR (day_id=62) ---
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (150, 62, 1, 3, '2x6-8 + 1x8-10', 'En Smith o guiada', 0, '2026-03-26 12:37:40'); -- Press Banca Plano (pecho)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (152, 62, 60, 3, '8-10', NULL, 0, '2026-03-26 12:38:11'); -- Press Militar con Mancuernas (hombros)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (153, 62, 6, 3, '2x10-12 + DS', 'O en máquina ', 0, '2026-03-26 12:38:18'); -- Cruces en Polea Alta (pecho)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (154, 62, 13, 3, '8-10', NULL, 0, '2026-03-26 12:39:30'); -- Remo con Mancuerna (espalda)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (155, 62, 61, 3, '2X10-12 + DS', 'Con barra o cuerda', 0, '2026-03-26 12:39:54'); -- Pullover en Polea (espalda)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (156, 62, 25, 3, '10-12', 'EN POLEA, altura de la cadera el enganche', 0, '2026-03-26 12:42:11'); -- Elevaciones Laterales (hombros)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (157, 62, 36, 3, '10-12', NULL, 0, '2026-03-26 12:42:17'); -- Extensiones en Polea (triceps)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (158, 62, 62, 3, '12', NULL, 0, '2026-03-26 12:42:55'); -- Curl en Polea (biceps)
INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (159, 62, 44, 1, '20-30\'', 'Yts', 0, '2026-03-26 12:44:27'); -- Carrera Continua (cardio)

-- === PASO 5: Restaurar historial de entrenamientos (workout_logs) ===
-- Total: 15 registros
INSERT INTO workout_logs (id, client_id, day_id, day_exercise_id, set_number, weight, completed_at) VALUES
  (313, 5, 60, 108, 1, 40.00, '2026-03-25 22:50:16'),
  (314, 5, 60, 108, 2, 40.00, '2026-03-25 22:50:16'),
  (315, 5, 60, 108, 3, 40.00, '2026-03-25 22:50:16'),
  (316, 5, 60, 109, 1, 17.50, '2026-03-25 22:50:16'),
  (317, 5, 60, 109, 2, 17.50, '2026-03-25 22:50:16'),
  (318, 5, 60, 109, 3, 17.50, '2026-03-25 22:50:16'),
  (319, 5, 60, 110, 1, 7.50, '2026-03-25 22:50:16'),
  (320, 5, 60, 110, 2, 7.50, '2026-03-25 22:50:16'),
  (321, 5, 60, 110, 3, 7.50, '2026-03-25 22:50:16'),
  (322, 5, 60, 111, 1, 7.50, '2026-03-25 22:50:16'),
  (323, 5, 60, 111, 2, 7.50, '2026-03-25 22:50:16'),
  (324, 5, 60, 111, 3, 7.00, '2026-03-25 22:50:16'),
  (325, 5, 60, 112, 1, 30.00, '2026-03-25 22:50:16'),
  (326, 5, 60, 112, 2, 30.00, '2026-03-25 22:50:16'),
  (327, 5, 60, 112, 3, 25.00, '2026-03-25 22:50:16');

-- === REFERENCIA: Ejercicios de la biblioteca usados ===
-- (Solo como referencia, NO ejecutar si la biblioteca ya existe)
-- Si algún ejercicio fue borrado de la biblioteca, descomenta las líneas necesarias
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (1, 'Press Banca Plano', 'pecho', 'Ejercicio básico de empuje horizontal para pectoral mayor');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (2, 'Press Banca Inclinado', 'pecho', 'Enfoque en pectoral superior con banca inclinada 30-45°');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (6, 'Cruces en Polea Alta', 'pecho', 'Aislamiento con polea, enfoque en contracción');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (10, 'Remo con Barra', 'espalda', 'Desarrollo completo de la espalda media');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (12, 'Jalones al Pecho', 'espalda', 'Alternativa a dominadas, enfoque en dorsal');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (13, 'Remo con Mancuerna', 'espalda', 'Trabajo unilateral de la espalda');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (15, 'Face Pulls', 'espalda', 'Deltoides posterior y trapecio');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (17, 'Prensa de Piernas', 'piernas', 'Máquina para cuádriceps y glúteos');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (18, 'Peso Muerto Rumano', 'piernas', 'Enfoque en femorales y glúteos');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (19, 'Zancadas con Mancuernas', 'piernas', 'Trabajo unilateral de piernas');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (20, 'Curl Femoral', 'piernas', 'Aislamiento de femorales');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (21, 'Extensión de Cuádriceps', 'piernas', 'Aislamiento de cuádriceps');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (22, 'Hip Thrust', 'piernas', 'Desarrollo de glúteos');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (25, 'Elevaciones Laterales', 'hombros', 'Aislamiento de deltoides lateral');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (26, 'Elevaciones Frontales', 'hombros', 'Enfoque en deltoides anterior');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (29, 'Curl con Barra Z', 'biceps', 'Desarrollo general del bíceps');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (36, 'Extensiones en Polea', 'triceps', 'Aislamiento con agarre de cuerda');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (39, 'Crunch Abdominal', 'abdomen', 'Ejercicio básico de abdomen');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (40, 'Plancha Frontal', 'abdomen', 'Isométrico para core');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (42, 'Bicicleta Abdominal', 'abdomen', 'Rotación para oblicuos');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (43, 'Plancha Lateral', 'abdomen', 'Isométrico para oblicuos');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (44, 'Carrera Continua', 'cardio', 'Trote a ritmo constante');
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (50, 'Skullcrushers', 'triceps', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (51, 'Remo unilateral en polea baja', 'espalda', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (52, 'Curl en Bando Inclinado', 'biceps', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (53, 'Side Bend con Peso', 'abdomen', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (54, 'Elevación de Piernas Colgado', 'abdomen', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (55, 'Sentadilla Búlgara', 'piernas', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (56, 'Elevaciones de Gemelo', 'piernas', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (57, 'Abducción de Cadera en Máquina', 'piernas', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (58, 'Plancha Copenhague', 'piernas', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (59, 'Hiper Extensión de Columna', 'abdomen', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (60, 'Press Militar con Mancuernas', 'hombros', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (61, 'Pullover en Polea', 'espalda', NULL);
-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (62, 'Curl en Polea', 'biceps', NULL);

-- =====================================================
-- FIN DEL BACKUP
-- =====================================================