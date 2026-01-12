-- Biblioteca completa de ejercicios por grupo muscular

-- PECHO
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Press Banca Plano', 'pecho', 'Ejercicio básico de empuje horizontal para pectoral mayor'),
('Press Banca Inclinado', 'pecho', 'Enfoque en pectoral superior con banca inclinada 30-45°'),
('Press Banca Declinado', 'pecho', 'Trabaja la porción inferior del pectoral'),
('Aperturas con Mancuernas', 'pecho', 'Aislamiento de pectoral con movimiento de apertura'),
('Fondos en Paralelas', 'pecho', 'Ejercicio de peso corporal para pecho y tríceps'),
('Cruces en Polea Alta', 'pecho', 'Aislamiento con polea, enfoque en contracción'),
('Press con Mancuernas Plano', 'pecho', 'Mayor rango de movimiento que barra'),
('Press con Mancuernas Inclinado', 'pecho', 'Desarrollo del pectoral superior'),
('Flexiones', 'pecho', 'Ejercicio básico de peso corporal'),
('Contractor o Peck Deck', 'pecho', 'Máquina de aislamiento para pectoral');

-- ESPALDA
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Dominadas', 'espalda', 'Ejercicio rey para dorsal ancho'),
('Remo con Barra', 'espalda', 'Desarrollo completo de la espalda media'),
('Peso Muerto', 'espalda', 'Ejercicio compuesto para toda la cadena posterior'),
('Jalones al Pecho', 'espalda', 'Alternativa a dominadas, enfoque en dorsal'),
('Remo con Mancuerna', 'espalda', 'Trabajo unilateral de la espalda'),
('Remo en Polea Baja', 'espalda', 'Aislamiento de espalda media y baja'),
('Pullover con Mancuerna', 'espalda', 'Expansión de caja torácica y dorsal'),
('Face Pulls', 'espalda', 'Deltoides posterior y trapecio'),
('Encogimientos con Barra', 'espalda', 'Desarrollo de trapecio superior'),
('Hiperextensiones', 'espalda', 'Fortalecimiento lumbar y glúteos');

-- PIERNAS
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Sentadilla con Barra', 'piernas', 'Ejercicio rey para desarrollo de piernas'),
('Prensa de Piernas', 'piernas', 'Máquina para cuádriceps y glúteos'),
('Peso Muerto Rumano', 'piernas', 'Enfoque en femorales y glúteos'),
('Zancadas con Mancuernas', 'piernas', 'Trabajo unilateral de piernas'),
('Curl Femoral Tumbado', 'piernas', 'Aislamiento de femorales'),
('Extensión de Cuádriceps', 'piernas', 'Aislamiento de cuádriceps'),
('Sentadilla Búlgara', 'piernas', 'Variación unilateral de sentadilla'),
('Hip Thrust', 'piernas', 'Desarrollo de glúteos'),
('Elevaciones de Gemelos de Pie', 'piernas', 'Desarrollo de pantorrillas'),
('Sentadilla Frontal', 'piernas', 'Mayor énfasis en cuádriceps');

-- HOMBROS
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Press Militar con Barra', 'hombros', 'Desarrollo completo de hombros'),
('Press con Mancuernas Sentado', 'hombros', 'Mayor rango de movimiento'),
('Elevaciones Laterales', 'hombros', 'Aislamiento de deltoides lateral'),
('Elevaciones Frontales', 'hombros', 'Enfoque en deltoides anterior'),
('Pájaros con Mancuernas', 'hombros', 'Deltoides posterior'),
('Press Arnold', 'hombros', 'Variación con rotación para desarrollo completo'),
('Remo al Mentón', 'hombros', 'Deltoides y trapecio superior'),
('Elevaciones Laterales en Polea', 'hombros', 'Tensión constante en deltoides lateral'),
('Face Pulls', 'hombros', 'Deltoides posterior y salud del hombro'),
('Press con Kettlebell', 'hombros', 'Variación para estabilidad');

-- BÍCEPS
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Curl con Barra Z', 'biceps', 'Desarrollo general del bíceps'),
('Curl con Mancuernas Alternado', 'biceps', 'Trabajo unilateral con supinación'),
('Curl Martillo', 'biceps', 'Enfoque en braquial y braquiorradial'),
('Curl en Banco Scott', 'biceps', 'Aislamiento del bíceps'),
('Curl Concentrado', 'biceps', 'Máximo aislamiento del bíceps'),
('Curl en Polea Baja', 'biceps', 'Tensión constante'),
('Curl 21s', 'biceps', 'Técnica avanzada de 21 repeticiones'),
('Curl Inclinado con Mancuernas', 'biceps', 'Estiramiento máximo del bíceps'),
('Curl Invertido', 'biceps', 'Desarrollo de antebrazos y braquiorradial'),
('Curl en Polea Alta', 'biceps', 'Variación para pico del bíceps');

-- TRÍCEPS
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Press Francés', 'triceps', 'Aislamiento de tríceps tumbado'),
('Fondos en Paralelas', 'triceps', 'Ejercicio compuesto para tríceps y pecho'),
('Extensiones en Polea Alta', 'triceps', 'Aislamiento con agarre de cuerda'),
('Patada de Tríceps', 'triceps', 'Trabajo unilateral de tríceps'),
('Press Cerrado', 'triceps', 'Variación de press para tríceps'),
('Extensiones sobre la Cabeza', 'triceps', 'Desarrollo de la cabeza larga del tríceps'),
('Fondos en Banco', 'triceps', 'Ejercicio de peso corporal'),
('Crush Press', 'triceps', 'Variación con mancuernas juntas'),
('Extensiones con Mancuerna a Una Mano', 'triceps', 'Trabajo unilateral overhead'),
('JM Press', 'triceps', 'Híbrido entre press cerrado y francés');

-- ABDOMEN
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Crunch Abdominal', 'abdomen', 'Ejercicio básico de abdomen'),
('Plancha Frontal', 'abdomen', 'Isométrico para core'),
('Elevación de Piernas', 'abdomen', 'Trabajo del abdomen inferior'),
('Bicicleta Abdominal', 'abdomen', 'Rotación para oblicuos'),
('Plancha Lateral', 'abdomen', 'Isométrico para oblicuos'),
('Mountain Climbers', 'abdomen', 'Dinámico para core y cardio'),
('Russian Twist', 'abdomen', 'Rotación con peso para oblicuos'),
('Crunch Inverso', 'abdomen', 'Enfoque en abdomen bajo'),
('Dead Bug', 'abdomen', 'Control y estabilidad del core'),
('Ab Wheel Rollout', 'abdomen', 'Ejercicio avanzado de core completo');

-- CARDIO
INSERT INTO exercise_library (name, muscle_group, description) VALUES
('Carrera Continua', 'cardio', 'Trote a ritmo constante'),
('HIIT en Cinta', 'cardio', 'Intervalos de alta intensidad'),
('Bicicleta Estática', 'cardio', 'Bajo impacto cardiovascular'),
('Remo en Máquina', 'cardio', 'Cardio de cuerpo completo'),
('Elíptica', 'cardio', 'Bajo impacto, movimiento natural'),
('Saltos de Comba', 'cardio', 'Cardio intenso y coordinación'),
('Burpees', 'cardio', 'Ejercicio de cuerpo completo'),
('Battle Ropes', 'cardio', 'Ondas con cuerdas para cardio y brazos'),
('Box Jumps', 'cardio', 'Saltos pliométricos'),
('Sprint en Cinta', 'cardio', 'Carreras de alta velocidad');
