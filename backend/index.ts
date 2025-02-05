import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

    // Use bcrypt.compare to check if the provided password matches the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
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

app.get('/get-all-users', authorizeMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT id, email, createdat, updatedat FROM users ORDER BY id DESC');
    const users = result.rows;

    res.json({
      message: 'Data načtena úspěšně',
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/delete-user/:id", authorizeMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Smazání uzivatel s daným id
    const queryText = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(queryText, [id]);

    // Pokud uživatel neexistuje, vrátíme 404
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Uživatel nenalezen" });
      return;
    }

    res.status(200).json({
      message: "Uživatel byl úspěšně smazán",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Chyba při mazání uživatele:", error);
    res.status(500).json({ error: "Chyba při mazání uživatele" });
  }
});

app.put('/update-user/:id', authorizeMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    // Validate that email and password are provided
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if the user exists
    const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userQuery.rowCount === 0) {
      res.status(404).json({ error: 'Uživatel nenalezen' });
      return;
    }

    // Hash the new password before updating
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user record. The updatedat field is set to the current timestamp.
    const updateQuery = `
      UPDATE users
      SET email = $1, password = $2, updatedat = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, createdat, updatedat
    `;
    const result = await pool.query(updateQuery, [email, hashedPassword, id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Uživatel nenalezen' });
      return;
    }

    res.status(200).json({
      message: 'Uživatel byl úspěšně aktualizován',
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Chyba při aktualizaci uživatele:", error);
    res.status(500).json({ error: 'Chyba při aktualizaci uživatele' });
  }
});


app.post('/create-user', authorizeMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate that email and password are provided
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Optionally, check if the user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rowCount !== null && existingUser.rowCount > 0) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Hash the password before saving it to the database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const queryText = `
      INSERT INTO users (email, password)
      VALUES ($1, $2)
      RETURNING id, email, createdat, updatedat
    `;
    const result = await pool.query(queryText, [email, hashedPassword]);

    res.status(201).json({
      message: 'Uživatel byl úspěšně vytvořen',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Chyba při vytváření uživatele:', error);
    res.status(500).json({ error: 'Chyba při vytváření uživatele' });
  }
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

app.put(
  '/update-article/:id',
  authorizeMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, coverImage, author, blocks, slug } = req.body;
      const updatedAt = new Date().toISOString();

      // Ověření, že máme ID článku v parametru
      if (!id) {
        res.status(400).json({ error: 'ID článku nebylo zadáno v URL parametru.' });
        return;
      }

      // Ověření, že máme potřebné údaje v těle požadavku
      if (!title || !coverImage || !author || !blocks) {
        res
          .status(400)
          .json({ error: 'Chybí některé z povinných údajů (title, coverImage, author, blocks).' });
        return;
      }

      // Pokud se mění slug, ověřit, zda slug neexistuje u jiného článku
      if (slug) {
        const slugCheckQuery = 'SELECT id FROM articles WHERE slug = $1 AND id <> $2';
        const slugCheckResult = await pool.query(slugCheckQuery, [slug, id]);
        if (slugCheckResult.rowCount !== null && slugCheckResult.rowCount > 0) {
          res.status(403).json({ error: 'Článek s tímto slugem již existuje.' });
          return;
        }
      }

      // Aktualizační dotaz
      const updateQuery = `
        UPDATE articles
        SET 
          title = $1,
          slug = $2,
          coverimage = $3,
          author = $4,
          updatedat = $5,
          blocks = $6
        WHERE id = $7
        RETURNING *
      `;

      const values = [
        title,
        // Pokud slug nechceš vždy měnit, můžeš si tu ošetřit situaci, 
        // kdy nepřijde slug - a ponechat starý slug v DB.
        // Pro jednoduchost ho sem ale posíláme tak, jak přišel z klienta.
        slug,
        coverImage,
        author,
        updatedAt,
        JSON.stringify(blocks),
        id,
      ];

      const result = await pool.query(updateQuery, values);

      if (result.rowCount === 0) {
        // Nikdo se neaktualizoval -> článek s daným ID neexistuje
        res.status(404).json({ error: 'Článek s daným ID neexistuje.' });
        return;
      }

      res.status(200).json({
        message: 'Článek byl úspěšně aktualizován',
        article: result.rows[0],
      });
    } catch (error) {
      console.error('Chyba při aktualizaci článku:', error);
      res.status(500).json({ error: 'Došlo k chybě při aktualizaci článku.' });
    }
  }
);

// Start serveru
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
