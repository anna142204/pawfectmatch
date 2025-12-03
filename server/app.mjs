import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { wsServer } from './store/wsStore.mjs';
import apiRouter from './routes/api.mjs';
import mongoose from 'mongoose';
import Admin from './models/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/pawfect_match')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Créer l'admin automatiquement si les variables d'env sont définies
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      try {
        const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
        if (!existingAdmin) {
          const admin = new Admin({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            name: process.env.ADMIN_NAME || 'Administrator',
            role: 'admin'
          });
          await admin.save();
          console.log('Admin créé automatiquement');
        }
      } catch (err) {
        console.error('Erreur création admin:', err.message);
      }
    }
  })
  .catch(err => console.error("MongoDB connection error:", err));

  
const app = express();
const httpServer = http.createServer(app);



app.use(express.json());

app.use('/api', apiRouter);

// Express serve static files from the 'dist' directory (Vite build)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback: redirect all non-API routes to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Start HTTP server and WebSocket server
const port = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT, 10) : 8989;

// Start server only when not running under Jest (or when not imported for tests)
if (!process.env.JEST_WORKER_ID) {
    httpServer.listen(port, () => console.log(`HTTP server listening on ${port}`));
    wsServer.start({ server: httpServer });
}

export default app;