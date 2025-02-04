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
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
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
    // Načtení článků z DB seřazených podle createdat sestupně
    const result = await pool.query('SELECT * FROM articles ORDER BY createdat DESC');
    const articles = result.rows;

    res.json({
      message: 'Data načtena úspěšně',
      data: articles,
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
    const queryResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = queryResult.rows[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.password !== password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

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
  const userInfo = (req as any).user;
  res.json({
    message: 'This is a secret endpoint!',
    userInfo,
  });
});

app.post(
  '/create-article',
  authorizeMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, coverImage, author, blocks, slug } = req.body;
      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();

      if (!title || !coverImage || !author || !blocks) {
        res.status(400).json({ error: 'Chybí povinné údaje' });
        return;
      }

      const queryText = `
        INSERT INTO articles (title, slug, coverimage, author, createdat, updatedat, blocks)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [title, slug, coverImage, author, createdAt, updatedAt, JSON.stringify(blocks)];

      const result = await pool.query(queryText, values);

      res.status(201).json({
        message: 'Článek byl úspěšně vytvořen',
        article: result.rows[0],
      });
    } catch (error) {
      console.error('Chyba při vytváření článku:', error);
      res.status(500).json({ error: 'Chyba při vytváření článku' });
    }
  }
);


// Start serveru
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
