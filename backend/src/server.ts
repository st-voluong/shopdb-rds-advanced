import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { testDatabaseConnections } from './config/database';
import { swaggerDocument } from './config/swagger';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/swagger.json', (_req: Request, res: Response) => {
  res.status(200).json(swaggerDocument);
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
  });
});

app.use('/api', apiRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const startServer = async (): Promise<void> => {
  try {
    await testDatabaseConnections();

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
      console.log(`Swagger UI is available at http://localhost:${port}/docs`);
      console.log(`Swagger JSON is available at http://localhost:${port}/swagger.json`);
      console.log('Connected to MySQL master and replica pools successfully');
    });
  } catch (error) {
    console.error('Failed to start server or connect to database');
    console.error(error);
    process.exit(1);
  }
};

void startServer();
