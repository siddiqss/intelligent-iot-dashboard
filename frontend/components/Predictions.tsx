'use client';

import { Card, Statistic, Spin, Tag } from 'antd';
import { LineChartOutlined, ThunderboltOutlined, FireOutlined } from '@ant-design/icons';
import { Predictions as PredictionsType } from '@/lib/api';
import { Line } from '@ant-design/charts';

interface PredictionsProps {
  data?: PredictionsType;
  loading?: boolean;
}

/**
 * Predictions component displaying forecasted metrics
 * Shows energy consumption and building metrics predictions
 */
export default function Predictions({ data, loading }: PredictionsProps) {
  if (loading && !data) {
    return (
      <Card title="Predictions" className="h-full">
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Generating predictions...</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card title="Predictions" className="h-full">
        <div className="text-center py-8 text-gray-500">
          <p>No predictions available</p>
        </div>
      </Card>
    );
  }

  // Calculate average predictions
  const avgPower = data.energy.length > 0
    ? data.energy.reduce((sum, p) => sum + (p.powerConsumption || 0), 0) / data.energy.length
    : 0;
  const avgCost = data.energy.length > 0
    ? data.energy.reduce((sum, p) => sum + (p.cost || 0), 0) / data.energy.length
    : 0;
  const avgTemp = data.building.length > 0
    ? data.building.reduce((sum, p) => sum + (p.temperature || 0), 0) / data.building.length
    : 0;

  // Prepare chart data
  const powerChartData = data.energy.map(p => ({
    timestamp: p.timestamp,
    value: p.powerConsumption || 0,
  }));

  const tempChartData = data.building.map(p => ({
    timestamp: p.timestamp,
    value: p.temperature || 0,
  }));

  const powerConfig = {
    data: powerChartData,
    xField: 'timestamp',
    yField: 'value',
    smooth: true,
    color: '#faad14',
    point: {
      size: 3,
      shape: 'circle',
    },
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text} kW`,
      },
    },
  };

  const tempConfig = {
    data: tempChartData,
    xField: 'timestamp',
    yField: 'value',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 3,
      shape: 'circle',
    },
    xAxis: {
      type: 'time',
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text}°C`,
      },
    },
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <LineChartOutlined style={{ fontSize: 20 }} />
          <span>Predictions (24h Forecast)</span>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <Statistic
              title="Avg Power (24h)"
              value={avgPower.toFixed(1)}
              suffix="kW"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
          <Card>
            <Statistic
              title="Avg Cost (24h)"
              value={avgCost.toFixed(2)}
              prefix="$"
              suffix="/hr"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
          <Card>
            <Statistic
              title="Avg Temperature (24h)"
              value={avgTemp.toFixed(1)}
              suffix="°C"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Power Consumption Forecast</h3>
          <Line {...powerConfig} height={200} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Temperature Forecast</h3>
          <Line {...tempConfig} height={200} />
        </div>

        <div className="text-sm text-gray-500">
          <Tag color="blue">Predictions based on linear regression analysis</Tag>
          <Tag color="green">Generated: {new Date(data.generatedAt).toLocaleString()}</Tag>
        </div>
      </div>
    </Card>
  );
}

