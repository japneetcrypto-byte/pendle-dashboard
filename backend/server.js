const express = require('express');
const cors = require('cors');
require('dotenv').config();

const marketRoutes = require('./src/routes/markets');
const { startPriceSyncJob, triggerManualSync } = require('./src/jobs/priceSync');
const pool = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.1.4:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Pendle Dashboard API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/markets', marketRoutes);

// Manual sync trigger endpoint (for testing)
app.post('/api/sync', async (req, res) => {
    res.json({ message: 'Sync started in background' });
    triggerManualSync();
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 Server started successfully!
    📡 Listening on port ${PORT}
    🌐 Health check: http://localhost:${PORT}/health
    📊 Markets API: http://localhost:${PORT}/api/markets
    ✅ CORS enabled for: localhost:3000, 127.0.0.1:3000, 192.168.1.4:3000
    `);
    
    // Start the automated price sync job
    startPriceSyncJob();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});
