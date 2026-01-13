import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import clientsRoutes from './routes/clients';
import mealsRoutes from './routes/meals';
import exercisesRoutes from './routes/exercises';
import routinesRoutes from './routes/routines';
import dietsRoutes from './routes/diets';
import workoutsRoutes from './routes/workouts';
import recipesRoutes from './routes/recipes';
import progressRoutes from './routes/progress';
import stepsRoutes from './routes/steps';
import './cron/progressCron'; // Iniciar cron job

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// No inicializamos la base de datos automáticamente
// Las tablas deben crearse manualmente en Railway ejecutando create_tables.sql

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'AppFitness API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/routines', routinesRoutes);
app.use('/api/diets', dietsRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/steps', stepsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📱 Make sure your mobile app uses the correct IP address`);
  console.log(`💡 Database tables should be created manually in Railway`);
});
