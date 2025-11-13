import { Router, Request, Response } from 'express';
import { DataGenerator } from '../services/dataGenerator';
import { cacheMiddleware } from '../middleware/cache';

const router: Router = Router();
const dataGenerator = new DataGenerator();

// Cache IoT data for 30 seconds (matches frontend refresh interval)
router.get('/iot', cacheMiddleware(30), (req: Request, res: Response) => {
  try {
    // Allow forcing extreme scenarios via query parameter for testing
    // e.g., ?scenario=extreme_temp_high
    const scenarioParam = req.query.scenario as string;
    const validExtremeScenarios = ['extreme_temp_high', 'extreme_temp_low', 'extreme_air_quality', 'extreme_humidity'];
    const forceExtreme = validExtremeScenarios.includes(scenarioParam) 
      ? scenarioParam as 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity'
      : undefined;
    
    const data = dataGenerator.generateCurrentData(forceExtreme);
    res.json(data);
  } catch (error) {
    console.error('Error generating IoT data:', error);
    res.status(500).json({ error: 'Failed to generate IoT data' });
  }
});

// Cache historical data for 5 minutes (less frequently updated)
router.get('/history', cacheMiddleware(300), (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const history = dataGenerator.generateHistoryData(Math.min(hours, 168)); // Max 7 days
    res.json(history);
  } catch (error) {
    console.error('Error generating history data:', error);
    res.status(500).json({ error: 'Failed to generate history data' });
  }
});

export default router;

