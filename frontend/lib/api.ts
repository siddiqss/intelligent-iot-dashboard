const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface BuildingKPIs {
  temperature: number;
  occupancy: number;
  hvacStatus: 'active' | 'idle' | 'maintenance';
  airQuality: number;
  humidity: number;
  timestamp: string;
}

export interface EnergyKPIs {
  powerConsumption: number;
  efficiency: number;
  cost: number;
  peakUsage: number;
  renewablePercentage: number;
  carbonFootprint: number;
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

export interface Prediction {
  powerConsumption?: number;
  cost?: number;
  efficiency?: number;
  temperature?: number;
  occupancy?: number;
  airQuality?: number;
  timestamp: string;
}

export interface Predictions {
  energy: Prediction[];
  building: Prediction[];
  generatedAt: string;
}

export interface Alert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  count: number;
  generatedAt: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async getCurrentData(cacheBuster: string = ''): Promise<IoTData> {
    return this.request<IoTData>(`/api/data/iot${cacheBuster}`);
  }

  async getHistoryData(hours: number = 24, cacheBuster: string = ''): Promise<TimeSeriesData> {
    // If cacheBuster is provided, it already includes '?t=', so we use '&' to append
    // If not provided, we just use the hours parameter
    if (cacheBuster) {
      return this.request<TimeSeriesData>(`/api/data/history?hours=${hours}&${cacheBuster.substring(2)}`);
    }
    return this.request<TimeSeriesData>(`/api/data/history?hours=${hours}`);
  }

  async analyzeData(currentData?: IoTData, includeHistory: boolean = false): Promise<AIAnalysis> {
    return this.request<AIAnalysis>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ currentData, includeHistory }),
    });
  }

  async getPredictions(hours: number = 24): Promise<Predictions> {
    return this.request<Predictions>(`/api/alerts/predictions?hours=${hours}`);
  }

  async getAlerts(): Promise<AlertsResponse> {
    return this.request<AlertsResponse>('/api/alerts');
  }
}

export const apiClient = new ApiClient();

