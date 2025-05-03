import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupRabbitHoleRoutes } from './routes/rabbithole';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Add health check endpoint
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'healthy' });
});

app.use('/api', setupRabbitHoleRoutes(null));

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle any remaining requests by serving the index.html
app.get('*', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
