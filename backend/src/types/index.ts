export interface BuildingKPIs {
  temperature: number; // Celsius
  occupancy: number; // Number of people
  hvacStatus: 'active' | 'idle' | 'maintenance';
  airQuality: number; // AQI (0-500)
  humidity: number; // Percentage
  timestamp: string;
}

export interface EnergyKPIs {
  powerConsumption: number; // kW
  efficiency: number; // Percentage
  cost: number; // USD
  peakUsage: number; // kW
  renewablePercentage: number; // Percentage
  carbonFootprint: number; // kg CO2
  timestamp: string;
}

export interface IoTData {
  building: BuildingKPIs;
  energy: EnergyKPIs;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface TimeSeriesData {
  building: {
    temperature: TimeSeriesPoint[];
    occupancy: TimeSeriesPoint[];
    airQuality: TimeSeriesPoint[];
    humidity: TimeSeriesPoint[];
  };
  energy: {
    powerConsumption: TimeSeriesPoint[];
    efficiency: TimeSeriesPoint[];
    cost: TimeSeriesPoint[];
    peakUsage: TimeSeriesPoint[];
    renewablePercentage: TimeSeriesPoint[];
  };
}

export interface AIAnalysis {
  insights: string[];
  trends: string;
  anomalies?: string[];
  recommendations: string[];
}

