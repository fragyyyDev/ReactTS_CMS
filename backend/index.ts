// src/index.ts
import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express with TypeScript!');
});

// A simple POST route example
app.post('/data', (req: Request, res: Response) => {
  const data = req.body;
  res.json({
    message: 'Data received successfully',
    data,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server and sigma is running on http://localhost:${port}`);
});
