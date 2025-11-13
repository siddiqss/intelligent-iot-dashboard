import { TimeSeriesData, IoTData } from '../types';

/**
 * Prediction service for IoT data forecasting
 * Uses simple linear regression and trend analysis for predictions
 */
export class PredictionService {
  /**
   * Predicts future values using linear regression
   * @param points Historical time-series points
   * @param hoursAhead Number of hours to predict ahead
   * @returns Predicted value
   */
  predictValue(points: Array<{ value: number; timestamp: string }>, hoursAhead: number): number {
    if (points.length < 2) {
      // Not enough data, return last value
      return points[points.length - 1]?.value || 0;
    }

    // Simple linear regression
    const n = points.length;
    const xValues = points.map((_, i) => i);
    const yValues = points.map(p => p.value);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future value
    const futureX = n + hoursAhead;
    const predicted = slope * futureX + intercept;

    return Math.max(0, Math.round(predicted * 100) / 100); // Ensure non-negative
  }

  /**
   * Predicts energy consumption for the next N hours
   * @param historicalData Historical time-series data
   * @param hoursAhead Number of hours to predict (default: 24)
   * @returns Predictions for various metrics
   */
  predictEnergyConsumption(
    historicalData: TimeSeriesData,
    hoursAhead: number = 24
  ): {
    powerConsumption: number;
    cost: number;
    efficiency: number;
    timestamp: string;
  }[] {
    const predictions = [];
    const powerPoints = historicalData.energy.powerConsumption;
    const efficiencyPoints = historicalData.energy.efficiency;

    for (let i = 1; i <= hoursAhead; i++) {
      const predictedPower = this.predictValue(powerPoints, i);
      const predictedEfficiency = this.predictValue(efficiencyPoints, i);
      
      // Cost calculation (simplified - uses average rate)
      const hourlyRate = 0.12; // Average rate
      const predictedCost = predictedPower * hourlyRate;

      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + i);

      predictions.push({
        powerConsumption: predictedPower,
        cost: Math.round(predictedCost * 100) / 100,
        efficiency: Math.max(0, Math.min(100, Math.round(predictedEfficiency * 10) / 10)),
        timestamp: futureTime.toISOString(),
      });
    }

    return predictions;
  }

  /**
   * Predicts building metrics for the next N hours
   * @param historicalData Historical time-series data
   * @param hoursAhead Number of hours to predict (default: 24)
   * @returns Predictions for building metrics
   */
  predictBuildingMetrics(
    historicalData: TimeSeriesData,
    hoursAhead: number = 24
  ): {
    temperature: number;
    occupancy: number;
    airQuality: number;
    timestamp: string;
  }[] {
    const predictions = [];
    const tempPoints = historicalData.building.temperature;
    const occPoints = historicalData.building.occupancy;
    const aqPoints = historicalData.building.airQuality;

    for (let i = 1; i <= hoursAhead; i++) {
      const predictedTemp = this.predictValue(tempPoints, i);
      const predictedOcc = Math.max(0, Math.round(this.predictValue(occPoints, i)));
      const predictedAQ = Math.max(0, Math.min(500, Math.round(this.predictValue(aqPoints, i))));

      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + i);

      predictions.push({
        temperature: Math.round(predictedTemp * 10) / 10,
        occupancy: predictedOcc,
        airQuality: predictedAQ,
        timestamp: futureTime.toISOString(),
      });
    }

    return predictions;
  }

  /**
   * Detects anomalies in current data compared to historical patterns
   * @param currentData Current IoT data
   * @param historicalData Historical time-series data
   * @returns Array of detected anomalies
   */
  detectAnomalies(currentData: IoTData, historicalData: TimeSeriesData): string[] {
    const anomalies: string[] = [];

    // Calculate historical averages and standard deviations
    const calculateStats = (points: Array<{ value: number }>) => {
      if (points.length === 0) return { avg: 0, stdDev: 0 };
      const values = points.map(p => p.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      return { avg, stdDev };
    };

    // Temperature anomaly (outside 2 standard deviations)
    const tempStats = calculateStats(historicalData.building.temperature);
    if (Math.abs(currentData.building.temperature - tempStats.avg) > 2 * tempStats.stdDev) {
      anomalies.push(
        `Temperature anomaly: ${currentData.building.temperature}°C (avg: ${tempStats.avg.toFixed(1)}°C)`
      );
    }

    // Power consumption anomaly
    const powerStats = calculateStats(historicalData.energy.powerConsumption);
    if (Math.abs(currentData.energy.powerConsumption - powerStats.avg) > 2 * powerStats.stdDev) {
      anomalies.push(
        `Power consumption anomaly: ${currentData.energy.powerConsumption} kW (avg: ${powerStats.avg.toFixed(1)} kW)`
      );
    }

    // Efficiency anomaly (below threshold)
    const effStats = calculateStats(historicalData.energy.efficiency);
    if (currentData.energy.efficiency < effStats.avg - 2 * effStats.stdDev) {
      anomalies.push(
        `Energy efficiency below normal: ${currentData.energy.efficiency}% (avg: ${effStats.avg.toFixed(1)}%)`
      );
    }

    // Air quality anomaly
    const aqStats = calculateStats(historicalData.building.airQuality);
    if (currentData.building.airQuality > aqStats.avg + 2 * aqStats.stdDev) {
      anomalies.push(
        `Air quality concern: ${currentData.building.airQuality} AQI (avg: ${aqStats.avg.toFixed(1)} AQI)`
      );
    }

    return anomalies;
  }

  /**
   * Generates alerts based on thresholds and predictions
   * @param currentData Current IoT data
   * @param predictions Predicted future values
   * @returns Array of alerts
   */
  generateAlerts(
    currentData: IoTData,
    predictions: ReturnType<typeof this.predictEnergyConsumption>
  ): Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }> {
    const alerts: Array<{
      type: 'warning' | 'critical' | 'info';
      message: string;
      timestamp: string;
    }> = [];

    // Temperature alerts
    if (currentData.building.temperature > 26) {
      alerts.push({
        type: 'warning',
        message: `High temperature detected: ${currentData.building.temperature}°C. Consider adjusting HVAC.`,
        timestamp: new Date().toISOString(),
      });
    } else if (currentData.building.temperature < 18) {
      alerts.push({
        type: 'warning',
        message: `Low temperature detected: ${currentData.building.temperature}°C. Consider increasing heating.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Energy efficiency alerts
    if (currentData.energy.efficiency < 80) {
      alerts.push({
        type: 'critical',
        message: `Energy efficiency is critically low: ${currentData.energy.efficiency}%. Review equipment performance.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Power consumption alerts
    const avgPredictedPower = predictions.reduce((sum, p) => sum + p.powerConsumption, 0) / predictions.length;
    if (avgPredictedPower > currentData.energy.powerConsumption * 1.2) {
      alerts.push({
        type: 'warning',
        message: `Predicted power consumption increase: ${avgPredictedPower.toFixed(1)} kW (current: ${currentData.energy.powerConsumption} kW)`,
        timestamp: new Date().toISOString(),
      });
    }

    // Air quality alerts
    if (currentData.building.airQuality > 150) {
      alerts.push({
        type: 'critical',
        message: `Poor air quality detected: ${currentData.building.airQuality} AQI. Increase ventilation.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Cost prediction alerts
    const predictedDailyCost = predictions.reduce((sum, p) => sum + p.cost, 0);
    const currentDailyCost = currentData.energy.cost * 24;
    if (predictedDailyCost > currentDailyCost * 1.15) {
      alerts.push({
        type: 'info',
        message: `Predicted daily energy cost: $${predictedDailyCost.toFixed(2)} (current: $${currentDailyCost.toFixed(2)})`,
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }
}

