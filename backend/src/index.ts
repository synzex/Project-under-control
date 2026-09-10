import express from 'express';
import cors from 'cors';
import projectsRoutes from './routes/projects';
import tasksRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(` Server started on port ${PORT} `);
  console.log(` API available at http://localhost:${PORT}/api`);
  console.log(`=================================`);
});
