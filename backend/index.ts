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

app.get("/get-article-data/:slug", async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  try {
    const queryText = "SELECT * FROM articles WHERE slug = $1";
    const result = await pool.query(queryText, [slug]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Článek nenalezen" });
      return;
    }
    // Vracíme celý řádek článku
    res.status(200).json({ article: result.rows[0] });
  } catch (error) {
    console.error("Chyba při načítání článku:", error);
    res.status(500).json({ error: "Chyba při načítání článku" });
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

      // Validate required fields
      if (!title || !coverImage || !author || !blocks) {
        res.status(400).json({ error: 'Chybí povinné údaje' });
        return;
      }

      // Check if slug already exists
      if (slug) {
        const slugCheckQuery = 'SELECT 1 FROM articles WHERE slug = $1';
        const slugCheckResult = await pool.query(slugCheckQuery, [slug]);
        if (slugCheckResult.rowCount && slugCheckResult.rowCount > 0) {
          res.status(403).json({ error: 'Článek s tímto slugem již existuje' });
          return;
        }
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

app.delete("/delete-article/:id", authorizeMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Smazání článku s daným id
    const queryText = 'DELETE FROM articles WHERE id = $1 RETURNING *';
    const result = await pool.query(queryText, [id]);

    // Pokud článek neexistuje, vrátíme 404
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Článek nenalezen" });
      return;
    }

    res.status(200).json({
      message: "Článek byl úspěšně smazán",
      article: result.rows[0]
    });
  } catch (error) {
    console.error("Chyba při mazání článku:", error);
    res.status(500).json({ error: "Chyba při mazání článku" });
  }
});

// Start serveru
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
