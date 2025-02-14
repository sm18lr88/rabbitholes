import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupRabbitHoleRoutes } from './routes/rabbithole';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // React app's URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Setup routes - passing null for AgentRuntime since we're ignoring it
app.use('/api', setupRabbitHoleRoutes(null));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 