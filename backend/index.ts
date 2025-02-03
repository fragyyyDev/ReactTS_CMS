import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

// Načtení konfigurace z .env
const SECRET_KEY = process.env.JWT_SECRET || 'some_fallback_secret';
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const DB_PASSWORD = process.env.POSTGRES_PASSWORD;
const port = 3000;

// Vytvoření Express aplikace
const app = express();
app.use(express.json());

// Nastavení CORS
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Připojení k PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: DB_PASSWORD,
  database: 'postgres',
});

// -----------------------------
// JWT AUTHORIZAČNÍ MIDDLEWARE
// -----------------------------
const authorizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Očekává hlavičku "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1]; // oddělíme "Bearer"
  try {
    // Ověření tokenu
    const decoded = jwt.verify(token, SECRET_KEY);
    // Uložíme informace o uživateli do requestu
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

// Endpoint pro ověření tokenu
app.get('/verify-token', authorizeMiddleware, (req: Request, res: Response) => {
  res.json({ valid: true });
});

// -----------------------------
// OSTATNÍ ROUTES
// -----------------------------
app.get('/', (req: Request, res: Response): void => {
  res.send('Hello from Express with TypeScript!');
});

app.get('/get-all-articles', async (req: Request, res: Response): Promise<void> => {
  try {
    const allArticles = await pool.query('SELECT * FROM articles');
    res.json({
      message: 'Data received successfully',
      data: allArticles.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Missing email or password' });
    return;
  }

  try {
    // Hledání uživatele v databázi
    const queryResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = queryResult.rows[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Porovnání hesel (plaintext, pro produkci použijte bcrypt)
    if (user.password !== password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generování JWT (platnost 1 hodina)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/secret', authorizeMiddleware, (req: Request, res: Response): void => {
  // Pokud jsme sem došli, token je platný
  const userInfo = (req as any).user;
  res.json({
    message: 'This is a secret endpoint!',
    userInfo,
  });
});

// Start serveru
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
