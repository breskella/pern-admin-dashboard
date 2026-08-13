import 'dotenv/config';
import express from 'express';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import subjectsRouter from './db/routes/subjects.js';
import usersRouter from './db/routes/users.js';
import classesRouter from './db/routes/classes.js';
import cors from 'cors';
import securityMiddleware from "./middleware/security.js"

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is not set in .env file');
}

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}))

app.use(express.json());

app.use(securityMiddleware);

app.use('/api/subjects', subjectsRouter);
app.use('/api/users', usersRouter);
app.use('/api/classes', classesRouter);
app.get('/', (req, res) => {
  res.send('Hello, welcome to the Classroom API!');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});