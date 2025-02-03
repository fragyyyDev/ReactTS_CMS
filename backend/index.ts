import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

// Load configuration from .env
const SECRET_KEY = process.env.JWT_SECRET || 'some_fallback_secret';
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173'; 
const port = 3000;

// Create Express application
const app = express();
app.use(express.json());

// Setup CORS
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Connect to PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'WasDerSigma01?',
  database: 'postgres',
});

// -----------------------------
//  JWT AUTHORIZATION MIDDLEWARE
// -----------------------------
const authorizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Expect header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1]; // separate "Bearer"
  try {
    // Verify token
    const decoded = jwt.verify(token, SECRET_KEY);
    // Save token info into request (you may want to extend the Request interface)
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

// -----------------------------
//  ROUTES
// -----------------------------

// Basic route
app.get('/', (req: Request, res: Response): void => {
  res.send('Hello from Express with TypeScript!');
});

// Simple POST route
app.post('/data', (req: Request, res: Response): void => {
  const data = req.body;
  res.json({
    message: 'Data received successfully',
    data,
  });
});

// -----------------------------
//  LOGIN ROUTE
// -----------------------------
app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Missing email or password' });
    return;
  }

  try {
    // Find the user in the DB
    const queryResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = queryResult.rows[0];

    if (!user) {
      // User with the given email doesn't exist
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Compare passwords (plaintext for now; use bcrypt.compare in production)
    if (user.password !== password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' } // Expires in 1 hour
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------
//  SECRET ROUTE (protected)
// -----------------------------
app.get('/secret', authorizeMiddleware, (req: Request, res: Response): void => {
  // If we reached here, authorizeMiddleware succeeded and token is valid
  // You can access user info via (req as any).user
  const userInfo = (req as any).user;

  res.json({
    message: 'This is a secret endpoint!',
    userInfo,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server and sigma is running on http://localhost:${port}`);
});
