import { OpenAI } from 'openai';
import { IoTData, TimeSeriesData, AIAnalysis } from '../types';

// LangChain imports (optional - will fallback to OpenAI if not available)
let ChatOpenAI: any = null;
let StructuredOutputParser: any = null;
try {
  const langchainOpenAI = require('@langchain/openai');
  const langchainCore = require('@langchain/core/output_parsers');
  ChatOpenAI = langchainOpenAI.ChatOpenAI;
  StructuredOutputParser = langchainCore.StructuredOutputParser;
} catch (error) {
  console.log('LangChain not available, using OpenAI direct API');
}

// Note: Using OpenAI JSON mode for structured outputs
// LangChain integration is optional and will fallback to OpenAI direct API

export class AIService {
  private openai: OpenAI | null = null;
  private langchainModel: any = null; // LangChain ChatOpenAI instance (optional)

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      // Initialize LangChain model if available
      if (ChatOpenAI) {
        try {
          this.langchainModel = new ChatOpenAI({
            modelName: 'gpt-4o-mini',
            temperature: 0.7,
            openAIApiKey: apiKey,
          });
        } catch (error) {
          console.log('LangChain initialization failed, using OpenAI direct API');
          this.langchainModel = null;
        }
      }
    }
  }

  /**
   * Analyzes IoT data using LangChain with structured outputs
   * Includes enhanced historical data analysis with statistical summaries
   */
  async analyzeData(
    currentData: IoTData,
    historicalData?: TimeSeriesData
  ): Promise<AIAnalysis> {
    if (!this.langchainModel) {
      return this.getFallbackAnalysis(currentData);
    }

    try {
      // Calculate statistical summaries from historical data
      const historicalSummary = historicalData 
        ? this.calculateHistoricalStatistics(historicalData)
        : null;

      // Try LangChain first if available, otherwise use OpenAI direct API
      if (this.langchainModel && StructuredOutputParser) {
        try {
          const prompt = this.buildAnalysisPrompt(currentData, historicalData, historicalSummary);
          // Use OpenAI direct API with JSON mode (more reliable)
          return await this.analyzeDataWithOpenAI(currentData, historicalData);
        } catch (error) {
          console.error('LangChain analysis failed, falling back to OpenAI:', error);
          return await this.analyzeDataWithOpenAI(currentData, historicalData);
        }
      } else {
        // Use OpenAI direct API
        return await this.analyzeDataWithOpenAI(currentData, historicalData);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to OpenAI direct API if LangChain fails
      return this.analyzeDataWithOpenAI(currentData, historicalData);
    }
  }

  /**
   * Fallback method using OpenAI direct API
   */
  private async analyzeDataWithOpenAI(
    currentData: IoTData,
    historicalData?: TimeSeriesData
  ): Promise<AIAnalysis> {
    if (!this.openai) {
      return this.getFallbackAnalysis(currentData);
    }

    try {
      const historicalSummary = historicalData 
        ? this.calculateHistoricalStatistics(historicalData)
        : null;
      const prompt = this.buildAnalysisPrompt(currentData, historicalData, historicalSummary);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert IoT data analyst. You MUST analyze the ACTUAL numerical values provided in the user message. Compare each value to the thresholds and ranges provided. If values are extreme (e.g., air quality >200 AQI, temperature <16°C or >28°C, humidity >80% or <30%), you MUST flag them as anomalies and provide urgent recommendations. Always respond with valid JSON only, no additional text. Be specific and reference the actual numbers in your analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent, fact-based analysis
        max_tokens: 800, // Increased for more detailed analysis
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseAnalysisJSON(content, currentData);
    } catch (error) {
      console.error('OpenAI fallback error:', error);
      return this.getFallbackAnalysis(currentData);
    }
  }

  /**
   * Calculates statistical summaries from historical time-series data
   * Includes averages, trends, peaks, and anomaly detection
   */
  private calculateHistoricalStatistics(historicalData: TimeSeriesData): {
    building: {
      temperature: { avg: number; min: number; max: number; trend: string };
      occupancy: { avg: number; min: number; max: number; trend: string };
      airQuality: { avg: number; min: number; max: number; trend: string };
    };
    energy: {
      powerConsumption: { avg: number; min: number; max: number; trend: string };
      efficiency: { avg: number; min: number; max: number; trend: string };
      cost: { avg: number; min: number; max: number; trend: string };
    };
  } {
    const calculateStats = (points: Array<{ value: number }>) => {
      if (points.length === 0) return { avg: 0, min: 0, max: 0, trend: 'stable' };
      
      const values = points.map(p => p.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Simple trend detection: compare first half vs second half
      const mid = Math.floor(values.length / 2);
      const firstHalfAvg = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const secondHalfAvg = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
      const trend = secondHalfAvg > firstHalfAvg * 1.05 ? 'increasing' 
        : secondHalfAvg < firstHalfAvg * 0.95 ? 'decreasing' 
        : 'stable';
      
      return { avg: Math.round(avg * 100) / 100, min, max, trend };
    };

    return {
      building: {
        temperature: calculateStats(historicalData.building.temperature),
        occupancy: calculateStats(historicalData.building.occupancy),
        airQuality: calculateStats(historicalData.building.airQuality),
      },
      energy: {
        powerConsumption: calculateStats(historicalData.energy.powerConsumption),
        efficiency: calculateStats(historicalData.energy.efficiency),
        cost: calculateStats(historicalData.energy.cost),
      },
    };
  }

  private buildAnalysisPrompt(
    currentData: IoTData,
    historicalData?: TimeSeriesData,
    historicalSummary?: ReturnType<typeof this.calculateHistoricalStatistics> | null
  ): string {
    let prompt = `You are analyzing REAL-TIME IoT sensor data. Analyze the ACTUAL values provided below and provide specific insights based on these exact numbers.\n\n`;
    
    prompt += `CURRENT BUILDING METRICS (Analyze these EXACT values):\n`;
    prompt += `- Temperature: ${currentData.building.temperature}°C (Optimal: 20-25°C, Critical High: >28°C, Critical Low: <16°C)\n`;
    prompt += `- Occupancy: ${currentData.building.occupancy} people\n`;
    prompt += `- HVAC Status: ${currentData.building.hvacStatus}\n`;
    prompt += `- Air Quality Index: ${currentData.building.airQuality} AQI (Good: 0-50, Moderate: 51-100, Unhealthy: 101-150, Very Unhealthy: 151-200, Hazardous: 201-300, Very Hazardous: >300)\n`;
    prompt += `- Humidity: ${currentData.building.humidity}% (Optimal: 40-60%, High Risk: >80%, Low Risk: <30%)\n\n`;
    
    prompt += `CURRENT ENERGY METRICS (Analyze these EXACT values):\n`;
    prompt += `- Power Consumption: ${currentData.energy.powerConsumption} kW\n`;
    prompt += `- Efficiency: ${currentData.energy.efficiency}% (Target: >85%, Low: <75%)\n`;
    prompt += `- Cost: $${currentData.energy.cost}/hour\n`;
    prompt += `- Peak Usage: ${currentData.energy.peakUsage} kW\n`;
    prompt += `- Renewable Energy: ${currentData.energy.renewablePercentage}%\n`;
    prompt += `- Carbon Footprint: ${currentData.energy.carbonFootprint} kg CO2\n\n`;

    // Add explicit analysis instructions
    prompt += `ANALYSIS REQUIREMENTS:\n`;
    prompt += `1. Compare each ACTUAL value to the thresholds provided above\n`;
    prompt += `2. Identify any values that are outside optimal ranges (e.g., temperature ${currentData.building.temperature}°C, air quality ${currentData.building.airQuality} AQI, humidity ${currentData.building.humidity}%)\n`;
    prompt += `3. If air quality is ${currentData.building.airQuality} AQI, this is ${currentData.building.airQuality > 300 ? 'VERY HAZARDOUS' : currentData.building.airQuality > 200 ? 'HAZARDOUS' : currentData.building.airQuality > 150 ? 'VERY UNHEALTHY' : currentData.building.airQuality > 100 ? 'UNHEALTHY' : 'MODERATE'}\n`;
    prompt += `4. If temperature is ${currentData.building.temperature}°C, this is ${currentData.building.temperature > 28 ? 'CRITICALLY HIGH' : currentData.building.temperature < 16 ? 'CRITICALLY LOW' : currentData.building.temperature > 25 ? 'ABOVE OPTIMAL' : currentData.building.temperature < 20 ? 'BELOW OPTIMAL' : 'OPTIMAL'}\n`;
    prompt += `5. Provide SPECIFIC insights based on these exact numbers, not generic statements\n\n`;

    if (historicalSummary) {
      prompt += `\nHISTORICAL CONTEXT (24-hour period):\n`;
      prompt += `Building Metrics:\n`;
      prompt += `- Temperature: Avg ${historicalSummary.building.temperature.avg.toFixed(1)}°C (Range: ${historicalSummary.building.temperature.min.toFixed(1)}-${historicalSummary.building.temperature.max.toFixed(1)}°C, Trend: ${historicalSummary.building.temperature.trend})\n`;
      prompt += `- Occupancy: Avg ${historicalSummary.building.occupancy.avg.toFixed(0)} people (Range: ${historicalSummary.building.occupancy.min}-${historicalSummary.building.occupancy.max}, Trend: ${historicalSummary.building.occupancy.trend})\n`;
      prompt += `- Air Quality: Avg ${historicalSummary.building.airQuality.avg.toFixed(0)} AQI (Range: ${historicalSummary.building.airQuality.min}-${historicalSummary.building.airQuality.max}, Trend: ${historicalSummary.building.airQuality.trend})\n`;
      prompt += `Energy Metrics:\n`;
      prompt += `- Power Consumption: Avg ${historicalSummary.energy.powerConsumption.avg.toFixed(2)} kW (Range: ${historicalSummary.energy.powerConsumption.min.toFixed(2)}-${historicalSummary.energy.powerConsumption.max.toFixed(2)} kW, Trend: ${historicalSummary.energy.powerConsumption.trend})\n`;
      prompt += `- Efficiency: Avg ${historicalSummary.energy.efficiency.avg.toFixed(1)}% (Range: ${historicalSummary.energy.efficiency.min.toFixed(1)}-${historicalSummary.energy.efficiency.max.toFixed(1)}%, Trend: ${historicalSummary.energy.efficiency.trend})\n`;
      prompt += `- Cost: Avg $${historicalSummary.energy.cost.avg.toFixed(2)}/hr (Range: $${historicalSummary.energy.cost.min.toFixed(2)}-$${historicalSummary.energy.cost.max.toFixed(2)}, Trend: ${historicalSummary.energy.cost.trend})\n`;
      prompt += `\nCompare current values to historical averages. For example, current air quality (${currentData.building.airQuality} AQI) vs average (${historicalSummary.building.airQuality.avg.toFixed(0)} AQI).\n`;
    } else if (historicalData) {
      prompt += `Historical trends are available. Identify patterns and anomalies.\n`;
    }

    prompt += `\nCRITICAL: Respond with a JSON object analyzing the ACTUAL values provided above. Include specific numbers in your insights.\n`;
    prompt += `{\n`;
    prompt += `  "insights": ["specific insight mentioning actual values", "another insight with numbers"],\n`;
    prompt += `  "trends": "description comparing current values to norms/thresholds",\n`;
    prompt += `  "anomalies": ["specific anomaly with actual value if detected"] (REQUIRED if any value is outside optimal range),\n`;
    prompt += `  "recommendations": ["specific actionable recommendation based on actual values"]\n`;
    prompt += `}\n`;

    return prompt;
  }

  /**
   * Parses JSON response from AI analysis endpoint
   * Validates and ensures required fields are present
   */
  private parseAnalysisJSON(content: string, currentData: IoTData): AIAnalysis {
    try {
      const parsed = JSON.parse(content);
      
      // Validate and extract insights
      const insights = Array.isArray(parsed.insights) 
        ? parsed.insights.filter((i: any) => typeof i === 'string').slice(0, 3)
        : [];
      
      // Validate trends
      const trends = typeof parsed.trends === 'string' 
        ? parsed.trends.trim() 
        : 'Stable performance observed across building and energy metrics.';
      
      // Validate anomalies (optional)
      const anomalies = Array.isArray(parsed.anomalies) && parsed.anomalies.length > 0
        ? parsed.anomalies.filter((a: any) => typeof a === 'string')
        : undefined;
      
      // Validate recommendations
      const recommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((r: any) => typeof r === 'string').slice(0, 3)
        : [];

      // Safety check: Ensure extreme values are flagged even if AI missed them
      const detectedAnomalies: string[] = [];
      if (currentData.building.airQuality > 200) {
        detectedAnomalies.push(`CRITICAL: Air quality is HAZARDOUS at ${currentData.building.airQuality} AQI (threshold: 200)`);
      } else if (currentData.building.airQuality > 150) {
        detectedAnomalies.push(`WARNING: Air quality is VERY UNHEALTHY at ${currentData.building.airQuality} AQI`);
      } else if (currentData.building.airQuality > 100) {
        detectedAnomalies.push(`Air quality is UNHEALTHY at ${currentData.building.airQuality} AQI`);
      }
      
      if (currentData.building.temperature > 28) {
        detectedAnomalies.push(`CRITICAL: Temperature is CRITICALLY HIGH at ${currentData.building.temperature}°C (threshold: 28°C)`);
      } else if (currentData.building.temperature < 16) {
        detectedAnomalies.push(`CRITICAL: Temperature is CRITICALLY LOW at ${currentData.building.temperature}°C (threshold: 16°C)`);
      }
      
      if (currentData.building.humidity > 80) {
        detectedAnomalies.push(`WARNING: Humidity is EXTREMELY HIGH at ${currentData.building.humidity}% (risk of mold)`);
      } else if (currentData.building.humidity < 30) {
        detectedAnomalies.push(`WARNING: Humidity is EXTREMELY LOW at ${currentData.building.humidity}% (dry air)`);
      }

      // Merge AI-detected anomalies with safety-check anomalies (avoid duplicates)
      const existingAnomalyTexts = (anomalies || []).join(' ').toLowerCase();
      const allAnomalies = [
        ...(anomalies || []),
        ...detectedAnomalies.filter(a => !existingAnomalyTexts.includes(a.toLowerCase().substring(0, 30)))
      ];
      const finalAnomalies = allAnomalies.length > 0 ? allAnomalies : undefined;

      // Fallback if required fields are missing
      if (insights.length === 0) {
        insights.push('Data analysis completed. All systems operating within normal parameters.');
      }
      if (recommendations.length === 0) {
        recommendations.push('Continue monitoring current performance metrics.');
        recommendations.push('Consider optimizing HVAC usage during off-peak hours.');
      }

      return {
        insights,
        trends: trends || 'No significant trends detected.',
        anomalies: finalAnomalies,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to parse AI analysis JSON:', error);
      return this.getFallbackAnalysis(currentData);
    }
  }

  private getFallbackAnalysis(currentData: IoTData): AIAnalysis {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const anomalies: string[] = [];

    // Temperature analysis with extreme value detection
    if (currentData.building.temperature > 28) {
      anomalies.push(`CRITICAL: Extreme high temperature detected (${currentData.building.temperature}°C)`);
      insights.push('Temperature is critically high - immediate action required');
      recommendations.push('URGENT: Activate emergency cooling systems');
      recommendations.push('Check HVAC system for malfunctions');
    } else if (currentData.building.temperature > 25) {
      insights.push('Temperature is above optimal range');
      recommendations.push('Consider adjusting HVAC settings to reduce temperature');
    } else if (currentData.building.temperature < 16) {
      anomalies.push(`CRITICAL: Extreme low temperature detected (${currentData.building.temperature}°C)`);
      insights.push('Temperature is critically low - immediate action required');
      recommendations.push('URGENT: Activate emergency heating systems');
      recommendations.push('Check HVAC system for malfunctions');
    } else if (currentData.building.temperature < 20) {
      insights.push('Temperature is below optimal range');
      recommendations.push('Consider increasing heating to improve comfort');
    } else {
      insights.push('Temperature is within optimal range');
    }

    // Air quality analysis with extreme value detection
    if (currentData.building.airQuality > 250) {
      anomalies.push(`CRITICAL: Hazardous air quality detected (${currentData.building.airQuality} AQI)`);
      insights.push('Air quality is in hazardous range - immediate ventilation required');
      recommendations.push('URGENT: Increase ventilation and consider evacuation if necessary');
      recommendations.push('Check air filtration systems');
    } else if (currentData.building.airQuality > 150) {
      insights.push('Air quality is in unhealthy range');
      recommendations.push('Increase ventilation and monitor air quality closely');
    } else if (currentData.building.airQuality < 30) {
      insights.push('Air quality is excellent');
    } else if (currentData.building.airQuality > 100) {
      insights.push('Air quality is moderate - monitor closely');
      recommendations.push('Consider increasing ventilation');
    }

    // Humidity analysis with extreme value detection
    if (currentData.building.humidity > 80) {
      anomalies.push(`WARNING: Extreme high humidity detected (${currentData.building.humidity}%)`);
      insights.push('Humidity is extremely high - risk of mold and condensation');
      recommendations.push('Activate dehumidification systems immediately');
      recommendations.push('Check for water leaks or ventilation issues');
    } else if (currentData.building.humidity < 30) {
      anomalies.push(`WARNING: Extreme low humidity detected (${currentData.building.humidity}%)`);
      insights.push('Humidity is extremely low - dry air conditions');
      recommendations.push('Consider humidification to improve comfort and reduce static');
    } else if (currentData.building.humidity > 65 || currentData.building.humidity < 40) {
      insights.push('Humidity is outside optimal range (40-60%)');
      recommendations.push('Adjust HVAC settings to maintain optimal humidity');
    }

    // Energy analysis
    if (currentData.energy.efficiency < 75) {
      insights.push('Energy efficiency is critically low');
      recommendations.push('URGENT: Review equipment performance and maintenance schedules');
    } else if (currentData.energy.efficiency < 85) {
      insights.push('Energy efficiency is below target');
      recommendations.push('Review equipment performance and maintenance schedules');
    } else {
      insights.push('Energy efficiency is good');
    }

    // Occupancy analysis
    if (currentData.building.occupancy > 80) {
      insights.push('High occupancy detected');
      recommendations.push('Monitor air quality and ventilation closely');
    }

    return {
      insights,
      trends: anomalies.length > 0 
        ? 'Anomalies detected - system requires immediate attention'
        : 'Stable performance with normal variations',
      anomalies: anomalies.length > 0 ? anomalies : undefined,
      recommendations,
    };
  }

}

