import express from 'express';
import cors from 'cors';
import mediaRoutes from './routes/media.routes';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', mediaRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(` Server running on http://localhost:${PORT}`);
});