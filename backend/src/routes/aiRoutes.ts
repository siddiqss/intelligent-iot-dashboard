import { Router, Request, Response } from 'express';
import { AIService } from '../services/aiService';
import { DataGenerator } from '../services/dataGenerator';

const router: Router = Router();
const aiService = new AIService();
const dataGenerator = new DataGenerator();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { currentData, includeHistory } = req.body;
    
    let data = currentData;
    if (!data) {
      data = dataGenerator.generateCurrentData();
    }

    let historicalData;
    if (includeHistory) {
      historicalData = dataGenerator.generateHistoryData(24);
    }

    const analysis = await aiService.analyzeData(data, historicalData);
    res.json(analysis);
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ error: 'Failed to perform AI analysis' });
  }
});

export default router;

