'use client';

import { useEffect, useState } from 'react';
import { Button, Spin, App } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BuildingKPIs from '@/components/BuildingKPIs';
import EnergyKPIs from '@/components/EnergyKPIs';
import Charts from '@/components/Charts';
import AIAnalytics from '@/components/AIAnalytics';
import Predictions from '@/components/Predictions';
import Alerts from '@/components/Alerts';
import { apiClient, IoTData, TimeSeriesData, AIAnalysis, Predictions as PredictionsType, AlertsResponse } from '@/lib/api';

export default function Home() {
  const { message } = App.useApp();
  const [currentData, setCurrentData] = useState<IoTData | null>(null);
  const [historyData, setHistoryData] = useState<TimeSeriesData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [predictions, setPredictions] = useState<PredictionsType | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const fetchData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      // Add cache-busting query parameter for manual refresh
      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      const [data, history] = await Promise.all([
        apiClient.getCurrentData(cacheBuster),
        apiClient.getHistoryData(24, cacheBuster),
      ]);
      setCurrentData(data);
      setHistoryData(history);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to fetch IoT data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      setLoadingPredictions(true);
      const pred = await apiClient.getPredictions(24);
      setPredictions(pred);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      message.error('Failed to fetch predictions');
    } finally {
      setLoadingPredictions(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const alertData = await apiClient.getAlerts();
      setAlerts(alertData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      message.error('Failed to fetch alerts');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleAnalyze = async () => {
    if (!currentData) return;
    
    try {
      setAnalyzing(true);
      const analysis = await apiClient.analyzeData(currentData, true);
      setAiAnalysis(analysis);
      message.success('Analysis completed');
    } catch (error) {
      console.error('Error analyzing data:', error);
      message.error('Failed to analyze data');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPredictions();
    fetchAlerts();
    
    const interval = setInterval(() => {
      fetchData();
      fetchPredictions();
      fetchAlerts();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !currentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              IoT Intelligent Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time monitoring and AI-powered analytics
            </p>
          </div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchData(true)}
            loading={loading}
            size="large"
          >
            Refresh Data
          </Button>
        </div>

        {currentData && (
          <>
            <ErrorBoundary>
              <div className="mb-8">
                <BuildingKPIs data={currentData.building} />
              </div>
            </ErrorBoundary>

            <ErrorBoundary>
              <div className="mb-8">
                <EnergyKPIs data={currentData.energy} />
              </div>
            </ErrorBoundary>

            {historyData && (
              <ErrorBoundary>
                <div className="mb-8">
                  <Charts data={historyData} />
                </div>
              </ErrorBoundary>
            )}

            <ErrorBoundary>
              <div className="mb-8">
                <AIAnalytics
                  data={aiAnalysis || undefined}
                  loading={analyzing}
                  onAnalyze={handleAnalyze}
                />
              </div>
            </ErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ErrorBoundary>
                <Predictions
                  data={predictions || undefined}
                  loading={loadingPredictions}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <Alerts
                  data={alerts || undefined}
                  loading={loadingAlerts}
                />
              </ErrorBoundary>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
