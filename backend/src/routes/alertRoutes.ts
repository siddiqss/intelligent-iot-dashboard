import { Router, Request, Response } from 'express';
import { PredictionService } from '../services/predictionService';
import { DataGenerator } from '../services/dataGenerator';

const router: Router = Router();
const predictionService = new PredictionService();
const dataGenerator = new DataGenerator();

/**
 * GET /api/alerts/predictions
 * Get predictions for energy consumption and building metrics
 */
router.get('/predictions', (req: Request, res: Response) => {
  try {
    const hoursAhead = parseInt(req.query.hours as string) || 24;
    const historicalData = dataGenerator.generateHistoryData(168); // Use 7 days for better predictions
    const currentData = dataGenerator.generateCurrentData();

    const energyPredictions = predictionService.predictEnergyConsumption(historicalData, hoursAhead);
    const buildingPredictions = predictionService.predictBuildingMetrics(historicalData, hoursAhead);

    res.json({
      energy: energyPredictions,
      building: buildingPredictions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

/**
 * GET /api/alerts/anomalies
 * Detect anomalies in current data
 */
router.get('/anomalies', (req: Request, res: Response) => {
  try {
    const currentData = dataGenerator.generateCurrentData();
    const historicalData = dataGenerator.generateHistoryData(168);

    const anomalies = predictionService.detectAnomalies(currentData, historicalData);

    res.json({
      anomalies,
      detectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

/**
 * GET /api/alerts
 * Get all alerts (anomalies + threshold-based alerts)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const currentData = dataGenerator.generateCurrentData();
    const historicalData = dataGenerator.generateHistoryData(168);
    const predictions = predictionService.predictEnergyConsumption(historicalData, 24);

    const anomalies = predictionService.detectAnomalies(currentData, historicalData);
    const alerts = predictionService.generateAlerts(currentData, predictions);

    // Combine anomalies and alerts
    const allAlerts = [
      ...anomalies.map(msg => ({
        type: 'warning' as const,
        message: msg,
        timestamp: new Date().toISOString(),
      })),
      ...alerts,
    ];

    res.json({
      alerts: allAlerts,
      count: allAlerts.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating alerts:', error);
    res.status(500).json({ error: 'Failed to generate alerts' });
  }
});

export default router;

