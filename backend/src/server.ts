import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dataRoutes from './routes/dataRoutes';
import aiRoutes from './routes/aiRoutes';
import alertRoutes from './routes/alertRoutes';
import { initializeCache, cacheMiddleware } from './middleware/cache';
import { initializeRateLimiter, rateLimiter } from './middleware/rateLimiter';

dotenv.config();

// Initialize caching and rate limiting
initializeCache();
initializeRateLimiter();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', true);

// Industry-standard rate limiting with per-endpoint limits
// Different endpoints have different limits based on their resource intensity
const isDevelopment = process.env.NODE_ENV !== 'production';

// Global rate limit (more lenient in development)
const globalLimit = isDevelopment ? 1000 : 200; // requests per minute

// Per-endpoint rate limits (industry standard approach)
// Data endpoints: Higher limit (frequently accessed, lightweight)
// AI endpoints: Lower limit (resource-intensive, expensive)
// Alert endpoints: Medium limit (moderate frequency)

// Apply global rate limit to all API routes
app.use('/api', rateLimiter(globalLimit, 60, 'global'));

// Per-endpoint rate limits (applied after route registration)
// These are more restrictive and will override global limit for specific endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/data', dataRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);

// Apply per-endpoint rate limits after routes are registered
// Data endpoints: 300 req/min (high frequency, lightweight)
app.use('/api/data', rateLimiter(isDevelopment ? 600 : 300, 60, 'data'));

// AI endpoints: 20 req/min (resource-intensive, expensive)
app.use('/api/ai', rateLimiter(isDevelopment ? 100 : 20, 60, 'ai'));

// Alert endpoints: 100 req/min (moderate frequency)
app.use('/api/alerts', rateLimiter(isDevelopment ? 300 : 100, 60, 'alerts'));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API endpoints available at /api/data, /api/ai, and /api/alerts`);
  console.log(`⚡ Rate Limits (${isDevelopment ? 'development' : 'production'} mode):`);
  console.log(`   - Global: ${globalLimit} req/min`);
  console.log(`   - Data endpoints: ${isDevelopment ? 600 : 300} req/min`);
  console.log(`   - AI endpoints: ${isDevelopment ? 100 : 20} req/min`);
  console.log(`   - Alert endpoints: ${isDevelopment ? 300 : 100} req/min`);
});

