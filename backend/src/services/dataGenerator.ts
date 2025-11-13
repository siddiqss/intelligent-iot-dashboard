import { BuildingKPIs, EnergyKPIs, IoTData, TimeSeriesData, TimeSeriesPoint } from '../types';

/**
 * Data generator for IoT dashboard
 * Simulates realistic building and energy metrics with daily patterns
 * Enhanced with more realistic variations and scenarios for better AI analysis
 */
export class DataGenerator {
  private baseTemperature = 22;
  private baseOccupancy = 50;
  private basePowerConsumption = 150;
  
  // State tracking for realistic scenarios
  private scenarioState: {
    lastScenario: number;
    scenarioStartTime: number;
    currentScenario: 'normal' | 'high_occupancy' | 'energy_spike' | 'hvac_issue' | 'air_quality_alert' | 'efficiency_drop' | 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity';
  } = {
    lastScenario: Date.now(),
    scenarioStartTime: Date.now(),
    currentScenario: 'normal',
  };

  /**
   * Calculates time-of-day factor for daily pattern simulation
   * Uses sine wave to simulate peak hours (higher during day, lower at night)
   */
  private getTimeOfDayFactor(hour: number): number {
    return Math.sin((hour - 6) * Math.PI / 12) * 0.3 + 0.7;
  }

  /**
   * Generates current IoT data with realistic scenarios
   * Includes occasional anomalies and different operational states for varied AI analysis
   * @param forceExtreme Optional: Force an extreme scenario for testing ('extreme_temp_high', 'extreme_temp_low', 'extreme_air_quality', 'extreme_humidity')
   */
  generateCurrentData(forceExtreme?: 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity'): IoTData {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDayFactor = this.getTimeOfDayFactor(hour);
    
    // Determine current scenario (changes every 30-90 seconds for variety and testing)
    // If forceExtreme is provided, use that scenario instead
    const scenario = forceExtreme || this.determineScenario();
    
    return {
      building: this.generateBuildingKPIs(timeOfDayFactor, undefined, scenario),
      energy: this.generateEnergyKPIs(timeOfDayFactor, undefined, scenario),
    };
  }

  /**
   * Determines the current operational scenario for more realistic data variation
   * Scenarios change periodically to provide different analysis results
   * Includes extreme scenarios for testing AI analysis capabilities
   * For testing: Scenarios change more frequently (30-90 seconds) and have higher chance of extreme values
   */
  private determineScenario(): 'normal' | 'high_occupancy' | 'energy_spike' | 'hvac_issue' | 'air_quality_alert' | 'efficiency_drop' | 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity' {
    const now = Date.now();
    const timeSinceLastChange = now - this.scenarioState.scenarioStartTime;
    // Reduced duration for testing: 30-90 seconds (was 5-15 minutes)
    const scenarioDuration = 30 * 1000 + Math.random() * 60 * 1000; // 30-90 seconds

    // Change scenario if enough time has passed OR add randomness for immediate refreshes
    // 20% chance to change scenario even if time hasn't passed (for testing)
    const shouldChange = timeSinceLastChange > scenarioDuration || Math.random() < 0.2;

    if (shouldChange) {
      const allScenarios: Array<'normal' | 'high_occupancy' | 'energy_spike' | 'hvac_issue' | 'air_quality_alert' | 'efficiency_drop' | 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity'> = [
        'normal',
        'high_occupancy',
        'energy_spike',
        'hvac_issue',
        'air_quality_alert',
        'efficiency_drop',
        'extreme_temp_high',
        'extreme_temp_low',
        'extreme_air_quality',
        'extreme_humidity',
      ];
      
      const rand = Math.random();
      // Increased probability of extreme scenarios for testing (40% instead of 30%)
      if (rand < 0.35) {
        // 35% normal operation
        this.scenarioState.currentScenario = 'normal';
      } else if (rand < 0.55) {
        // 20% regular anomalies
        const regularAnomalies = ['high_occupancy', 'energy_spike', 'hvac_issue', 'air_quality_alert', 'efficiency_drop'];
        this.scenarioState.currentScenario = regularAnomalies[Math.floor(Math.random() * regularAnomalies.length)] as any;
      } else {
        // 45% extreme scenarios (for testing AI analysis) - increased from 30%
        const extremeScenarios = ['extreme_temp_high', 'extreme_temp_low', 'extreme_air_quality', 'extreme_humidity'];
        this.scenarioState.currentScenario = extremeScenarios[Math.floor(Math.random() * extremeScenarios.length)] as any;
      }
      
      this.scenarioState.scenarioStartTime = now;
    }

    return this.scenarioState.currentScenario;
  }

  /**
   * Generates building metrics based on time factor and scenario
   * Temperature, occupancy, and air quality follow realistic patterns
   */
  private generateBuildingKPIs(
    timeFactor: number, 
    timestamp?: Date,
    scenario: 'normal' | 'high_occupancy' | 'energy_spike' | 'hvac_issue' | 'air_quality_alert' | 'efficiency_drop' | 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity' = 'normal'
  ): BuildingKPIs {
    let temp = this.calculateTemperature(timeFactor);
    let occ = this.calculateOccupancy(timeFactor);
    let airQuality = this.calculateAirQuality(occ);
    let humidity = this.calculateHumidity();

    // Apply scenario-based modifications for more varied analysis
    switch (scenario) {
      case 'high_occupancy':
        occ = Math.min(100, Math.floor(occ * 1.8 + Math.random() * 20)); // 80-100% occupancy
        airQuality = Math.min(500, airQuality + 40 + Math.random() * 30); // Worse air quality
        temp = temp + 1.5 + Math.random() * 1.5; // Slightly warmer
        break;
      
      case 'hvac_issue':
        temp = temp + (Math.random() > 0.5 ? 4 : -4) + (Math.random() - 0.5) * 2; // ±4°C variation
        humidity = humidity + (Math.random() - 0.5) * 15; // More variable humidity
        break;
      
      case 'air_quality_alert':
        airQuality = Math.min(500, 120 + Math.random() * 80); // 120-200 AQI (unhealthy range)
        occ = Math.min(100, occ + Math.random() * 15); // Slightly higher occupancy
        break;
      
      case 'extreme_temp_high':
        // Very high temperature: 28-32°C (critical overheating)
        temp = 28 + Math.random() * 4;
        humidity = Math.max(30, humidity - 5 - Math.random() * 5); // Lower humidity with high temp
        airQuality = Math.min(500, airQuality + 20 + Math.random() * 20); // Slightly worse air quality
        break;
      
      case 'extreme_temp_low':
        // Very low temperature: 14-18°C (critical cold)
        temp = 14 + Math.random() * 4;
        humidity = Math.min(70, humidity + 5 + Math.random() * 5); // Higher humidity with low temp
        break;
      
      case 'extreme_air_quality':
        // Extreme air quality: Very high (250-400 AQI) or very low (20-40 AQI)
        if (Math.random() > 0.5) {
          airQuality = 250 + Math.random() * 150; // 250-400 AQI (very unhealthy to hazardous)
          occ = Math.min(100, occ + 10 + Math.random() * 10); // Higher occupancy contributes
        } else {
          airQuality = 20 + Math.random() * 20; // 20-40 AQI (excellent air quality)
        }
        break;
      
      case 'extreme_humidity':
        // Extreme humidity: Very high (75-90%) or very low (25-35%)
        if (Math.random() > 0.5) {
          humidity = 75 + Math.random() * 15; // 75-90% (very high, risk of mold)
          temp = temp - 1 - Math.random() * 1; // Slightly cooler with high humidity
        } else {
          humidity = 25 + Math.random() * 10; // 25-35% (very low, dry air)
          temp = temp + 1 + Math.random() * 1; // Slightly warmer with low humidity
        }
        break;
      
      case 'normal':
      case 'energy_spike':
      case 'efficiency_drop':
        // Normal building metrics, energy scenarios affect energy KPIs
        break;
    }

    const hvacStatus = this.determineHVACStatus(temp, scenario);

    return {
      temperature: Math.round(temp * 10) / 10,
      occupancy: occ,
      hvacStatus,
      airQuality: Math.round(airQuality),
      // Allow extreme humidity values for extreme scenarios (25-90%), otherwise clamp to 30-70%
      humidity: scenario === 'extreme_humidity' 
        ? Math.round(Math.max(25, Math.min(90, humidity)) * 10) / 10
        : Math.round(Math.max(30, Math.min(70, humidity)) * 10) / 10,
      timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Calculates temperature with daily variation and randomness
   */
  private calculateTemperature(timeFactor: number): number {
    return this.baseTemperature + 
      (timeFactor - 0.7) * 8 + 
      (Math.random() - 0.5) * 3;
  }

  /**
   * Calculates occupancy with daily patterns
   */
  private calculateOccupancy(timeFactor: number): number {
    return Math.max(10, Math.floor(
      this.baseOccupancy * timeFactor + 
      (Math.random() - 0.5) * 20
    ));
  }

  /**
   * Determines HVAC status based on temperature deviation and scenario
   */
  private determineHVACStatus(
    temperature: number,
    scenario: 'normal' | 'high_occupancy' | 'energy_spike' | 'hvac_issue' | 'air_quality_alert' | 'efficiency_drop' | 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity' = 'normal'
  ): 'active' | 'idle' | 'maintenance' {
    // Extreme temperature scenarios - HVAC should be active
    if (scenario === 'extreme_temp_high' || scenario === 'extreme_temp_low') {
      return 'active'; // HVAC working hard to correct extreme temperatures
    }
    
    // HVAC issue scenario - more likely to be in maintenance
    if (scenario === 'hvac_issue' && Math.random() < 0.3) {
      return 'maintenance';
    }
    
    // Normal maintenance probability
    if (Math.random() < 0.05) {
      return 'maintenance';
    } else if (Math.abs(temperature - this.baseTemperature) > 2) {
      return 'active';
    } else {
      return 'idle';
    }
  }

  /**
   * Calculates air quality index (better when occupancy is lower)
   */
  private calculateAirQuality(occupancy: number): number {
    return Math.max(0, Math.min(500, 
      50 + (occupancy / 10) + (Math.random() - 0.5) * 30
    ));
  }

  /**
   * Calculates humidity in 40-60% range
   */
  private calculateHumidity(): number {
    return 40 + (Math.random() * 20);
  }

  /**
   * Generates energy metrics based on time factor and scenario
   * Power consumption, efficiency, and costs follow realistic patterns
   */
  private generateEnergyKPIs(
    timeFactor: number, 
    timestamp?: Date,
    scenario: 'normal' | 'high_occupancy' | 'energy_spike' | 'hvac_issue' | 'air_quality_alert' | 'efficiency_drop' | 'extreme_temp_high' | 'extreme_temp_low' | 'extreme_air_quality' | 'extreme_humidity' = 'normal'
  ): EnergyKPIs {
    let powerConsumption = this.calculatePowerConsumption(timeFactor);
    let efficiency = this.calculateEfficiency();
    let renewablePercentage = this.calculateRenewablePercentage();

    // Apply scenario-based modifications for more varied analysis
    switch (scenario) {
      case 'energy_spike':
        powerConsumption = powerConsumption * (1.4 + Math.random() * 0.3); // 40-70% increase
        efficiency = efficiency - 5 - Math.random() * 5; // Lower efficiency during spike
        break;
      
      case 'efficiency_drop':
        efficiency = Math.max(70, efficiency - 15 - Math.random() * 10); // 70-85% efficiency
        powerConsumption = powerConsumption * (1.1 + Math.random() * 0.1); // Slightly higher consumption
        break;
      
      case 'high_occupancy':
        powerConsumption = powerConsumption * (1.2 + Math.random() * 0.15); // 20-35% increase
        break;
      
      case 'hvac_issue':
        powerConsumption = powerConsumption * (1.15 + Math.random() * 0.2); // 15-35% increase
        efficiency = efficiency - 3 - Math.random() * 4; // Slightly lower efficiency
        break;
      
      case 'air_quality_alert':
        // Air quality issues might require more ventilation, increasing energy
        powerConsumption = powerConsumption * (1.1 + Math.random() * 0.1);
        break;
      
      case 'extreme_temp_high':
      case 'extreme_temp_low':
        // Extreme temperatures require HVAC to work harder
        powerConsumption = powerConsumption * (1.5 + Math.random() * 0.3); // 50-80% increase
        efficiency = efficiency - 8 - Math.random() * 7; // Lower efficiency (72-87%)
        break;
      
      case 'extreme_air_quality':
        // Extreme air quality issues require intensive ventilation
        // High AQI (250-400) requires more ventilation, increasing energy
        powerConsumption = powerConsumption * (1.3 + Math.random() * 0.2); // 30-50% increase
        break;
      
      case 'extreme_humidity':
        // Extreme humidity requires dehumidification/humidification
        powerConsumption = powerConsumption * (1.2 + Math.random() * 0.15); // 20-35% increase
        break;
      
      case 'normal':
        // Normal operation
        break;
    }

    const hourlyRate = this.calculateHourlyRate(timeFactor);
    const cost = this.calculateCost(powerConsumption, hourlyRate);
    const peakUsage = this.calculatePeakUsage(powerConsumption);
    const carbonFootprint = this.calculateCarbonFootprint(powerConsumption, renewablePercentage);

    return {
      powerConsumption: Math.round(powerConsumption * 100) / 100,
      efficiency: Math.max(70, Math.min(100, Math.round(efficiency * 10) / 10)),
      cost: Math.round(cost * 100) / 100,
      peakUsage: Math.round(peakUsage * 100) / 100,
      renewablePercentage: Math.round(renewablePercentage * 10) / 10,
      carbonFootprint: Math.round(carbonFootprint * 100) / 100,
      timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Calculates power consumption with daily variation
   */
  private calculatePowerConsumption(timeFactor: number): number {
    return this.basePowerConsumption * timeFactor + 
      (Math.random() - 0.5) * 30;
  }

  /**
   * Calculates efficiency in 80-95% range
   */
  private calculateEfficiency(): number {
    return 80 + Math.random() * 15;
  }

  /**
   * Calculates hourly rate based on peak hours
   */
  private calculateHourlyRate(timeFactor: number): number {
    return timeFactor > 0.8 ? 0.15 : 0.10;
  }

  /**
   * Calculates cost based on consumption and rate
   */
  private calculateCost(powerConsumption: number, hourlyRate: number): number {
    return powerConsumption * hourlyRate;
  }

  /**
   * Calculates peak usage (slightly higher than current)
   */
  private calculatePeakUsage(powerConsumption: number): number {
    return powerConsumption * (1 + Math.random() * 0.2);
  }

  /**
   * Calculates renewable percentage in 30-50% range
   */
  private calculateRenewablePercentage(): number {
    return 30 + Math.random() * 20;
  }

  /**
   * Calculates carbon footprint based on consumption and renewable percentage
   */
  private calculateCarbonFootprint(powerConsumption: number, renewablePercentage: number): number {
    return powerConsumption * 0.5 * (1 - renewablePercentage / 100);
  }

  /**
   * Generates historical time-series data for the specified number of hours
   * Reuses the same calculation methods as current data for consistency
   */
  generateHistoryData(hours: number = 24): TimeSeriesData {
    const now = new Date();
    const points: TimeSeriesData = {
      building: {
        temperature: [],
        occupancy: [],
        airQuality: [],
        humidity: [],
      },
      energy: {
        powerConsumption: [],
        efficiency: [],
        cost: [],
        peakUsage: [],
        renewablePercentage: [],
      },
    };

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();
      const timeFactor = this.getTimeOfDayFactor(hour);

      // For historical data, use normal scenario to maintain consistency
      // (scenarios are for current data variation)
      const buildingKPIs = this.generateBuildingKPIs(timeFactor, timestamp, 'normal');
      const energyKPIs = this.generateEnergyKPIs(timeFactor, timestamp, 'normal');

      // Convert to time-series points
      points.building.temperature.push({
        timestamp: timestamp.toISOString(),
        value: buildingKPIs.temperature,
      });
      points.building.occupancy.push({
        timestamp: timestamp.toISOString(),
        value: buildingKPIs.occupancy,
      });
      points.building.airQuality.push({
        timestamp: timestamp.toISOString(),
        value: buildingKPIs.airQuality,
      });
      points.building.humidity.push({
        timestamp: timestamp.toISOString(),
        value: buildingKPIs.humidity,
      });

      points.energy.powerConsumption.push({
        timestamp: timestamp.toISOString(),
        value: energyKPIs.powerConsumption,
      });
      points.energy.efficiency.push({
        timestamp: timestamp.toISOString(),
        value: energyKPIs.efficiency,
      });
      points.energy.cost.push({
        timestamp: timestamp.toISOString(),
        value: energyKPIs.cost,
      });
      points.energy.peakUsage.push({
        timestamp: timestamp.toISOString(),
        value: energyKPIs.peakUsage,
      });
      points.energy.renewablePercentage.push({
        timestamp: timestamp.toISOString(),
        value: energyKPIs.renewablePercentage,
      });
    }

    return points;
  }
}

