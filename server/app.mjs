import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { wsServer } from './store/wsStore.mjs';
import apiRouter from './routes/api.mjs';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/pawfect_match')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error("MongoDB connection error:", err));

  
const app = express();
const httpServer = http.createServer(app);



app.use(express.json());

app.use('/api', apiRouter);

// Express serve static files from the 'dist' directory (Vite build)
app.use(express.static(path.join(__dirname, '../dist')));


// Start HTTP server and WebSocket server
const port = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT, 10) : 8989;

// Start server only when not running under Jest (or when not imported for tests)
if (!process.env.JEST_WORKER_ID) {
    httpServer.listen(port, () => console.log(`HTTP server listening on ${port}`));
    wsServer.start({ server: httpServer });
}

export default app;